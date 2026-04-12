import { IEngramRepository, ObservationPayload, SearchParams, Observation, SaveResult } from '../../ports/engram-repository';

/**
 * Stub Adapter for Engram Repository
 * ────────────────────────────────────
 * Hexagonal Architecture: ADAPTER for local dev / testing.
 * No persistence — just logs. Zero external dependencies.
 * Used when ENGRAM_MODE=stub (default in dev).
 */
export class StubEngramAdapter implements IEngramRepository {
  async save(payload: ObservationPayload): Promise<SaveResult> {
    console.log(`[Engram STUB] SAVE ${payload.type.toUpperCase()}: "${payload.title}"`);
    console.log(`  Content: ${payload.content.substring(0, 200)}${payload.content.length > 200 ? '...' : ''}`);
    if (payload.project) console.log(`  Project: ${payload.project}`);
    if (payload.topic_key) console.log(`  Topic: ${payload.topic_key}`);
    return { id: Math.floor(Math.random() * 1000), success: true };
  }

  async search(_params: SearchParams): Promise<Observation[]> {
    console.log(`[Engram STUB] SEARCH: "${_params.query}" — returning empty (stub mode)`);
    return [];
  }
}
