import { IEngramRepository, ObservationPayload, SearchParams, Observation, SaveResult } from '../../ports/engram-repository';

/**
 * HTTP Adapter for Engram Repository
 * ────────────────────────────────────
 * Hexagonal Architecture: ADAPTER for remote Engram HTTP server.
 * Used when ENGRAM_MODE=http (e.g., distributed / multi-instance deployments).
 */
export class HttpEngramAdapter implements IEngramRepository {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.ENGRAM_HTTP_URL || 'http://localhost:3838';
  }

  async save(payload: ObservationPayload): Promise<SaveResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json() as any;
      return { id: data.id, success: true };
    } catch (e: any) {
      console.warn(`[HttpAdapter] save failed: ${e.message}`);
      return { success: false };
    }
  }

  async search(params: SearchParams): Promise<Observation[]> {
    try {
      const qs = new URLSearchParams({
        query: params.query,
        ...(params.project && { project: params.project }),
        ...(params.type && { type: params.type }),
        ...(params.limit !== undefined && { limit: String(params.limit) }),
      });
      const res = await fetch(`${this.baseUrl}/api/search?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return (await res.json()) as Observation[];
    } catch (e: any) {
      console.warn(`[HttpAdapter] search failed: ${e.message}`);
      return [];
    }
  }
}
