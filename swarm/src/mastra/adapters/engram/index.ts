import { IEngramRepository } from '../../ports/engram-repository';

export type EngramMode = 'stub' | 'sqlite' | 'http' | 'mcp';

/**
 * Engram Adapter Factory
 * ─────────────────────────────────────────────────────────
 * Hexagonal Architecture: This is the FACTORY / WIRING layer.
 *
 * Reads ENGRAM_MODE from env and returns the correct adapter.
 * The rest of the system (domain) receives an IEngramRepository
 * and never knows which concrete adapter is behind it.
 *
 * Adding a new backend (e.g. Postgres, Supabase):
 *   1. Create `postgres-adapter.ts` implementing IEngramRepository
 *   2. Add case 'postgres' here
 *   3. Zero changes anywhere else
 */

let _instance: IEngramRepository | null = null;

export function createEngramRepository(mode?: EngramMode): IEngramRepository {
  const resolvedMode = mode || (process.env.ENGRAM_MODE as EngramMode) || 'stub';

  switch (resolvedMode) {
    case 'sqlite': {
      const { SqliteEngramAdapter } = require('./sqlite-adapter');
      return new SqliteEngramAdapter();
    }
    case 'http': {
      const { HttpEngramAdapter } = require('./http-adapter');
      return new HttpEngramAdapter();
    }
    case 'stub':
    default: {
      const { StubEngramAdapter } = require('./stub-adapter');
      return new StubEngramAdapter();
    }
  }
}

/**
 * Singleton accessor — use this everywhere in the system.
 * The domain never instantiates adapters directly.
 */
export function getEngramRepository(): IEngramRepository {
  if (!_instance) {
    _instance = createEngramRepository();
  }
  return _instance;
}

// Re-export the port interface for convenience
export type { IEngramRepository } from '../../ports/engram-repository';
