import { describe, it, expect } from 'vitest';
import {
  resolveWorkspaceDeps,
  SeedNotFoundError,
  DirtyTreeError,
  WorkspaceResolutionError,
  GitPushError,
  type PackageJson,
} from '../publish-seed';

// ---------------------------------------------------------------------------
// resolveWorkspaceDeps
// ---------------------------------------------------------------------------

describe('resolveWorkspaceDeps', () => {
  it('resolves workspace:* to the pinned version from workspacePackages', () => {
    const pkgJson: PackageJson = {
      name: '@delusion/seed-restaurant',
      version: '0.1.0',
      dependencies: {
        '@delusion/blocks': 'workspace:*',
        astro: '^5.0.0',
      },
    };

    const workspacePackages = new Map([['@delusion/blocks', '0.1.0']]);

    const result = resolveWorkspaceDeps(pkgJson, workspacePackages);

    expect(result.dependencies?.['@delusion/blocks']).toBe('0.1.0');
  });

  it('leaves non-workspace deps unchanged', () => {
    const pkgJson: PackageJson = {
      name: '@delusion/seed-restaurant',
      version: '0.1.0',
      dependencies: {
        '@delusion/blocks': 'workspace:*',
        astro: '^5.0.0',
      },
    };

    const workspacePackages = new Map([['@delusion/blocks', '0.1.0']]);

    const result = resolveWorkspaceDeps(pkgJson, workspacePackages);

    expect(result.dependencies?.['astro']).toBe('^5.0.0');
  });

  it('throws WorkspaceResolutionError for an unresolvable workspace:* dep', () => {
    const pkgJson: PackageJson = {
      name: '@delusion/seed-restaurant',
      version: '0.1.0',
      dependencies: {
        '@delusion/missing-pkg': 'workspace:*',
      },
    };

    const workspacePackages = new Map<string, string>();

    expect(() => resolveWorkspaceDeps(pkgJson, workspacePackages)).toThrowError(
      WorkspaceResolutionError
    );
  });

  it('resolves workspace:* deps in devDependencies as well', () => {
    const pkgJson: PackageJson = {
      name: '@delusion/seed-restaurant',
      version: '0.1.0',
      devDependencies: {
        '@delusion/blocks': 'workspace:*',
      },
    };

    const workspacePackages = new Map([['@delusion/blocks', '0.2.0']]);

    const result = resolveWorkspaceDeps(pkgJson, workspacePackages);

    expect(result.devDependencies?.['@delusion/blocks']).toBe('0.2.0');
  });

  it('does not mutate the original package.json object', () => {
    const pkgJson: PackageJson = {
      name: '@delusion/seed-restaurant',
      version: '0.1.0',
      dependencies: {
        '@delusion/blocks': 'workspace:*',
      },
    };

    const workspacePackages = new Map([['@delusion/blocks', '0.1.0']]);

    resolveWorkspaceDeps(pkgJson, workspacePackages);

    // Original should remain unchanged
    expect(pkgJson.dependencies?.['@delusion/blocks']).toBe('workspace:*');
  });
});

// ---------------------------------------------------------------------------
// Error class instantiation
// ---------------------------------------------------------------------------

describe('Error classes', () => {
  it('SeedNotFoundError has correct name and message', () => {
    const err = new SeedNotFoundError('restaurant', '/seeds/restaurant');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SeedNotFoundError);
    expect(err.name).toBe('SeedNotFoundError');
    expect(err.message).toContain('restaurant');
    expect(err.message).toContain('/seeds/restaurant');
  });

  it('DirtyTreeError has correct name and message', () => {
    const err = new DirtyTreeError();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(DirtyTreeError);
    expect(err.name).toBe('DirtyTreeError');
    expect(err.message).toMatch(/dirty/i);
  });

  it('WorkspaceResolutionError has correct name and message', () => {
    const err = new WorkspaceResolutionError('@delusion/missing');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(WorkspaceResolutionError);
    expect(err.name).toBe('WorkspaceResolutionError');
    expect(err.message).toContain('@delusion/missing');
  });

  it('GitPushError has correct name and message', () => {
    const err = new GitPushError('remote rejected');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GitPushError);
    expect(err.name).toBe('GitPushError');
    expect(err.message).toContain('remote rejected');
  });
});
