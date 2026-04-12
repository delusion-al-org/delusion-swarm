/**
 * publish-seed.ts
 *
 * Publishes a seed to its own standalone repo by resolving workspace:* deps
 * to pinned versions.
 *
 * Usage:
 *   bun scripts/publish-seed.ts <seed-name> [options]
 *
 * Options:
 *   --force      Force push to remote (default: false)
 *   --dry-run    Prepare temp dir but don't push (default: false)
 *   --tag <ver>  Create git tag (defaults to version from seed's package.json)
 */

import { join, resolve } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PackageJson = {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

export class SeedNotFoundError extends Error {
  constructor(seedName: string, seedPath: string) {
    super(`Seed "${seedName}" not found at ${seedPath}`);
    this.name = 'SeedNotFoundError';
  }
}

export class DirtyTreeError extends Error {
  constructor() {
    super('Git working tree is dirty. Commit or stash changes before publishing.');
    this.name = 'DirtyTreeError';
  }
}

export class WorkspaceResolutionError extends Error {
  constructor(depName: string) {
    super(
      `Cannot resolve workspace:* dep "${depName}" — no matching workspace package found.`
    );
    this.name = 'WorkspaceResolutionError';
  }
}

export class GitPushError extends Error {
  constructor(message: string) {
    super(`Git push failed: ${message}`);
    this.name = 'GitPushError';
  }
}

// ---------------------------------------------------------------------------
// Pure functions (exported for testability)
// ---------------------------------------------------------------------------

/**
 * Replaces workspace:* deps with pinned versions from the workspacePackages map.
 * Throws WorkspaceResolutionError if a workspace:* dep cannot be resolved.
 */
export function resolveWorkspaceDeps(
  pkgJson: PackageJson,
  workspacePackages: Map<string, string>
): PackageJson {
  const depFields = ['dependencies', 'devDependencies', 'peerDependencies'] as const;

  const resolved: PackageJson = { ...pkgJson };

  for (const field of depFields) {
    const deps = pkgJson[field];
    if (!deps) continue;

    const resolvedDeps: Record<string, string> = {};

    for (const [name, version] of Object.entries(deps)) {
      if (version === 'workspace:*' || version.startsWith('workspace:')) {
        const pinned = workspacePackages.get(name);
        if (pinned === undefined) {
          throw new WorkspaceResolutionError(name);
        }
        resolvedDeps[name] = pinned;
      } else {
        resolvedDeps[name] = version;
      }
    }

    resolved[field] = resolvedDeps;
  }

  return resolved;
}

/**
 * Returns true if the git working tree is clean.
 */
export async function isGitClean(): Promise<boolean> {
  const proc = Bun.spawn(['git', 'status', '--porcelain'], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  await proc.exited;

  const output = await new Response(proc.stdout).text();
  return output.trim() === '';
}

/**
 * Recursively copies src to dest, excluding paths that match any pattern in exclude.
 * Patterns are matched against the basename of each entry.
 */
export async function copyToTemp(
  src: string,
  dest: string,
  exclude: string[]
): Promise<void> {
  const proc = Bun.spawn(
    [
      'rsync',
      '-a',
      '--delete',
      ...exclude.flatMap((p) => ['--exclude', p]),
      src + '/',
      dest + '/',
    ],
    { stdout: 'pipe', stderr: 'pipe' }
  );

  await proc.exited;

  if (proc.exitCode !== 0) {
    const errOut = await new Response(proc.stderr).text();
    throw new Error(`copyToTemp failed: ${errOut}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function spawnAndCheck(
  args: string[],
  cwd: string,
  errorClass: new (msg: string) => Error
): Promise<void> {
  const proc = Bun.spawn(args, { cwd, stdout: 'pipe', stderr: 'pipe' });
  await proc.exited;

  if (proc.exitCode !== 0) {
    const errOut = await new Response(proc.stderr).text();
    throw new errorClass(errOut.trim());
  }
}

async function readJson(filePath: string): Promise<PackageJson> {
  const file = Bun.file(filePath);
  const text = await file.text();
  return JSON.parse(text) as PackageJson;
}

async function collectWorkspacePackages(root: string): Promise<Map<string, string>> {
  const rootPkg = await readJson(join(root, 'package.json'));
  const workspaces = (rootPkg.workspaces as string[] | undefined) ?? [];

  const map = new Map<string, string>();

  for (const pattern of workspaces) {
    // Simple glob: replace trailing /* with individual dirs
    const globProc = Bun.spawn(['bash', '-c', `ls -d ${pattern}`], {
      cwd: root,
      stdout: 'pipe',
      stderr: 'pipe',
    });
    await globProc.exited;

    const dirs = (await new Response(globProc.stdout).text()).trim().split('\n');

    for (const dir of dirs) {
      if (!dir) continue;
      const pkgPath = join(root, dir, 'package.json');
      try {
        const pkg = await readJson(pkgPath);
        if (pkg.name && pkg.version) {
          map.set(pkg.name as string, pkg.version as string);
        }
      } catch {
        // package.json might not exist for all dirs — skip
      }
    }
  }

  return map;
}

async function dirExists(p: string): Promise<boolean> {
  const proc = Bun.spawn(['test', '-d', p], { stdout: 'pipe', stderr: 'pipe' });
  await proc.exited;
  return proc.exitCode === 0;
}

async function rmrf(p: string): Promise<void> {
  const proc = Bun.spawn(['rm', '-rf', p], { stdout: 'pipe', stderr: 'pipe' });
  await proc.exited;
}

// ---------------------------------------------------------------------------
// Main publish pipeline
// ---------------------------------------------------------------------------

async function publishSeed(
  seedName: string,
  opts: { force: boolean; dryRun: boolean; tag?: string }
): Promise<void> {
  const root = resolve(import.meta.dir, '..');
  const seedPath = join(root, 'seeds', seedName);

  // 1. VALIDATE — seed directory must exist
  if (!(await dirExists(seedPath))) {
    throw new SeedNotFoundError(seedName, seedPath);
  }

  // 1b. VALIDATE — git working tree must be clean
  if (!(await isGitClean())) {
    throw new DirtyTreeError();
  }

  // 2. RESOLVE — read seed package.json and resolve workspace:* deps
  const seedPkgPath = join(seedPath, 'package.json');
  const seedPkg = await readJson(seedPkgPath);

  const workspacePackages = await collectWorkspacePackages(root);
  const resolvedPkg = resolveWorkspaceDeps(seedPkg, workspacePackages);

  const version = opts.tag ?? (resolvedPkg.version as string | undefined) ?? '0.0.0';

  // 3. PREPARE — copy to temp dir and write resolved package.json
  const tempDir = `/tmp/publish-${seedName}-${Date.now()}`;

  console.log(`Preparing ${tempDir} ...`);

  await spawnAndCheck(['mkdir', '-p', tempDir], root, Error);

  await copyToTemp(seedPath, tempDir, [
    'node_modules',
    'dist',
    '.astro',
    'bun.lock',
    'bun.lockb',
  ]);

  // Overwrite package.json with resolved deps
  await Bun.write(
    join(tempDir, 'package.json'),
    JSON.stringify(resolvedPkg, null, 2) + '\n'
  );

  // Remove lockfile if it ended up there anyway
  const lockFile = join(tempDir, 'bun.lock');
  const lockFileB = join(tempDir, 'bun.lockb');
  await rmrf(lockFile);
  await rmrf(lockFileB);

  console.log('Resolved package.json written.');

  // Determine remote URL
  const remoteName = resolvedPkg.name as string | undefined;
  if (!remoteName) {
    throw new Error('Seed package.json has no "name" field');
  }

  // Derive a git remote URL from the package name.
  // Convention: @scope/seed-xxx => github.com/<scope>/seed-xxx
  // The user can override GIT_REMOTE env var.
  const gitRemote =
    process.env['GIT_REMOTE'] ??
    (() => {
      const parts = remoteName.replace(/^@/, '').split('/');
      return `git@github.com:${parts.join('/')}.git`;
    })();

  if (opts.dryRun) {
    console.log(`[dry-run] Would push to ${gitRemote} with tag ${version}`);
    console.log(`Temp dir preserved at ${tempDir}`);
    return;
  }

  // 4. PUBLISH
  try {
    console.log('Initializing git repo in temp dir...');
    await spawnAndCheck(['git', 'init'], tempDir, GitPushError);
    await spawnAndCheck(['git', 'add', '.'], tempDir, GitPushError);
    await spawnAndCheck(
      ['git', 'commit', '-m', `chore: publish ${seedName}@${version}`],
      tempDir,
      GitPushError
    );
    await spawnAndCheck(
      ['git', 'remote', 'add', 'origin', gitRemote],
      tempDir,
      GitPushError
    );

    if (version) {
      await spawnAndCheck(['git', 'tag', version], tempDir, GitPushError);
    }

    const pushArgs = ['git', 'push', '--set-upstream', 'origin', 'HEAD'];
    if (opts.force) pushArgs.push('--force');
    await spawnAndCheck(pushArgs, tempDir, GitPushError);

    if (version) {
      await spawnAndCheck(['git', 'push', 'origin', '--tags'], tempDir, GitPushError);
    }

    // 5. CLEANUP — success
    await rmrf(tempDir);
    console.log(`Successfully published ${seedName}@${version} to ${gitRemote}`);
  } catch (err) {
    console.error(`Publish failed. Temp dir preserved at ${tempDir}`);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// CLI entry point — only runs when executed directly, not when imported
// ---------------------------------------------------------------------------

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: bun scripts/publish-seed.ts <seed-name> [options]

Options:
  --force      Force push to remote (default: false)
  --dry-run    Prepare temp dir but don't push (default: false)
  --tag <ver>  Create git tag (defaults to version from seed's package.json)
`);
    process.exit(0);
  }

  const seedName = args[0]!;
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const tagIdx = args.indexOf('--tag');
  const tag = tagIdx !== -1 ? args[tagIdx + 1] : undefined;

  publishSeed(seedName, { force, dryRun, tag }).catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
