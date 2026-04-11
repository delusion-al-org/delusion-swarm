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
let _instanceMode: string | null = null;

export async function createEngramRepository(mode?: EngramMode): Promise<IEngramRepository> {
  const resolvedMode = mode || (process.env.ENGRAM_MODE as EngramMode) || 'stub';

  switch (resolvedMode) {
    case 'sqlite': {
      const { SqliteEngramAdapter } = await import('./sqlite-adapter');
      return new SqliteEngramAdapter();
    }
    case 'http': {
      const { HttpEngramAdapter } = await import('./http-adapter');
      return new HttpEngramAdapter();
    }
    case 'stub':
    default: {
      const { StubEngramAdapter } = await import('./stub-adapter');
      return new StubEngramAdapter();
    }
  }
}

/**
 * Singleton accessor — use this everywhere in the system.
 * The domain never instantiates adapters directly.
 */
export function getEngramRepository(): IEngramRepository {
  const currentMode = process.env.ENGRAM_MODE || 'stub';
  // Reset singleton if mode changed (e.g. during tests or hot reload)
  if (_instance && _instanceMode !== currentMode) {
    _instance = null;
  }
  if (!_instance) {
    // Lazy-sync fallback: we create the instance synchronously using a pre-resolved adapter
    // Full async creation available via createEngramRepository() for explicit control
    const mode = currentMode as EngramMode;
    if (mode === 'sqlite') {
      const { SqliteEngramAdapter } = require('./sqlite-adapter');
      _instance = new SqliteEngramAdapter();
    } else if (mode === 'http') {
      const { HttpEngramAdapter } = require('./http-adapter');
      _instance = new HttpEngramAdapter();
    } else {
      const { StubEngramAdapter } = require('./stub-adapter');
      _instance = new StubEngramAdapter();
    }
    _instanceMode = currentMode;
  }
  return _instance;
}

// Re-export the port interface for convenience
export type { IEngramRepository } from '../../ports/engram-repository';
