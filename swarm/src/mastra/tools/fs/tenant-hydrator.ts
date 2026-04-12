import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { delusionConfigSchema } from '../../schemas/delusion-config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════
// SEED RESOLUTION STRATEGY (REQ-04)
// ═══════════════════════════════════════════════════════════
//
// Mode is controlled by SEED_RESOLVE_MODE env var:
//   - "npm"   → installs seed from registry (npm/GitHub Packages)
//   - "local" → copies from `../seeds/<template>` (dev fallback)
//
// In both cases, the resolved seed version is locked into
// the tenant's package.json under `delusion.seed.version`.
// ═══════════════════════════════════════════════════════════

type SeedResolveMode = 'npm' | 'local';

function getSeedResolveMode(): SeedResolveMode {
  const mode = process.env.SEED_RESOLVE_MODE;
  if (mode === 'npm') return 'npm';
  return 'local'; // safe default for dev
}

/**
 * Resolve the seed template into the target directory.
 * Returns the actual resolved version string.
 */
async function resolveSeed(
  template: string,
  version: string,
  targetDir: string,
): Promise<{ resolvedVersion: string }> {
  const mode = getSeedResolveMode();
  const packageName = `@delusion/seed-${template}`;

  if (mode === 'npm') {
    // ── NPM Resolution ──────────────────────────────────
    // Install the seed as a dependency from the configured registry.
    // This supports: npm public, GitHub Packages, Verdaccio, etc.
    // The registry URL is configured via .npmrc in the workspace or env.
    console.log(`[Hydrator] NPM mode: installing ${packageName}@${version}...`);

    await fs.mkdir(targetDir, { recursive: true });

    // Bootstrap a minimal package.json if it doesn't exist
    const pkgPath = path.join(targetDir, 'package.json');
    try {
      await fs.stat(pkgPath);
    } catch {
      await fs.writeFile(pkgPath, JSON.stringify({
        name: `@delusion-tenant/placeholder`,
        version: '0.0.0',
        private: true,
      }, null, 2), 'utf-8');
    }

    // Install the seed package — this pulls it from the registry
    const installCmd = `npm install ${packageName}@${version} --save-exact`;
    const { stdout, stderr } = await execAsync(installCmd, { cwd: targetDir });
    console.log(`[Hydrator] npm install output:`, stdout);
    if (stderr) console.warn(`[Hydrator] npm install stderr:`, stderr);

    // Copy the installed seed contents into the workspace root
    // Seeds ship their Astro project structure inside the package
    const installedSeedDir = path.join(targetDir, 'node_modules', packageName);

    try {
      await fs.stat(installedSeedDir);
    } catch {
      throw new Error(`Seed package ${packageName}@${version} was not found after install. Check registry config.`);
    }

    // Copy seed files into workspace (skip node_modules from the seed itself)
    const entries = await fs.readdir(installedSeedDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'package-lock.json') continue;
      const src = path.join(installedSeedDir, entry.name);
      const dest = path.join(targetDir, entry.name);
      await fs.cp(src, dest, { recursive: true });
    }

    // Read the actual resolved version from the installed package
    try {
      const seedPkg = JSON.parse(
        await fs.readFile(path.join(installedSeedDir, 'package.json'), 'utf-8')
      );
      return { resolvedVersion: seedPkg.version || version };
    } catch {
      return { resolvedVersion: version };
    }
  }

  // ── Local Resolution (dev fallback) ──────────────────
  console.log(`[Hydrator] Local mode: copying seed-${template} from workspace...`);
  const seedDir = path.resolve(process.cwd(), `../seeds/seed-${template}`);

  try {
    await fs.stat(seedDir);
  } catch {
    throw new Error(`Local seed not found at ${seedDir}. Set SEED_RESOLVE_MODE=npm for registry resolution.`);
  }

  await fs.cp(seedDir, targetDir, { recursive: true });

  // Read version from the local seed's package.json
  try {
    const seedPkg = JSON.parse(
      await fs.readFile(path.join(seedDir, 'package.json'), 'utf-8')
    );
    return { resolvedVersion: seedPkg.version || version };
  } catch {
    return { resolvedVersion: version };
  }
}

// ═══════════════════════════════════════════════════════════
// HYDRATE PROJECT TOOL
// ═══════════════════════════════════════════════════════════

export const hydrateProject = createTool({
  id: 'hydrate-project',
  name: 'Hydrate Project',
  description: 'Resolves a versioned meta-seed (via NPM or local fallback) into a new tenant workspace and injects the delusion.json config',
  inputSchema: z.object({
    projectId: z.string().describe('The unique tenant identifier (e.g., "customer-123")'),
    config: delusionConfigSchema.describe('The generated delusion configuration JSON payload'),
  }),
  execute: async (input) => {
    const { projectId, config } = input;
    const template = config.seed?.template || 'landing';
    const requestedVersion = config.seed?.version || '0.1.0';

    try {
      const rootDir = process.env.AGENT_WORKSPACE || path.resolve(process.cwd(), '../../workspaces');
      const targetDir = path.resolve(rootDir, projectId);

      // 1. Ensure absolute containment
      if (!targetDir.startsWith(rootDir)) {
        throw new Error('Security Error: Target directory escapes AGENT_WORKSPACE');
      }

      // 2. Resolve seed ONLY if tenant doesn't already exist
      let resolvedVersion = requestedVersion;
      try {
        await fs.stat(targetDir);
        console.log(`[Hydrator] Tenant ${projectId} already exists. Skipping seed resolution to protect custom code.`);
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          const resolved = await resolveSeed(template, requestedVersion, targetDir);
          resolvedVersion = resolved.resolvedVersion;
        } else {
          throw e;
        }
      }

      // 3. Ensure content/business directory exists
      const contentDir = path.join(targetDir, 'src/content/business');
      await fs.mkdir(contentDir, { recursive: true });

      // 4. Inject delusion.json
      const jsonPath = path.join(contentDir, 'delusion.json');
      await fs.writeFile(jsonPath, JSON.stringify(config, null, 2), 'utf-8');

      // 5. Update package.json — tenant name + locked seed version
      const pkgPath = path.join(targetDir, 'package.json');
      try {
        const pkgData = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));
        pkgData.name = `@delusion-tenant/${projectId}`;
        pkgData.delusion = {
          seed: {
            package: `@delusion/seed-${template}`,
            version: resolvedVersion,
            resolveMode: getSeedResolveMode(),
          },
        };
        await fs.writeFile(pkgPath, JSON.stringify(pkgData, null, 2), 'utf-8');
      } catch (e) {
        console.warn(`Could not update package.json for ${projectId}`, e);
      }

      return {
        status: 'success',
        message: `Project hydrated (seed: @delusion/seed-${template}@${resolvedVersion}, mode: ${getSeedResolveMode()})`,
        path: targetDir,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to hydrate project: ${error.message}`,
      };
    }
  },
});
