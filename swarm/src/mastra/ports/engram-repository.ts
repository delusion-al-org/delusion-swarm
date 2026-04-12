/**
 * Engram Repository Port
 * ──────────────────────
 * Hexagonal Architecture: This is the PORT (interface).
 * The domain only depends on this interface — never on concrete adapters.
 *
 * To add a new storage backend (Postgres, Redis, Supabase...):
 *   1. Create a new file in `../adapters/engram/`
 *   2. Implement `IEngramRepository`
 *   3. Register it in `../adapters/engram/index.ts`
 *   4. That's it. Zero changes to domain code.
 */

export interface ObservationPayload {
  title: string;
  content: string;
  type: string;
  project?: string;
  topic_key?: string;
}

export interface SearchParams {
  query: string;
  project?: string;
  type?: string;
  limit?: number;
}

export interface Observation extends ObservationPayload {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface SaveResult {
  id?: number;
  success: boolean;
}

/**
 * IEngramRepository — The Port.
 * All adapters must implement this contract.
 */
export interface IEngramRepository {
  save(payload: ObservationPayload): Promise<SaveResult>;
  search(params: SearchParams): Promise<Observation[]>;
}
