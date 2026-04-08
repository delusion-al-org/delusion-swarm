import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Engram Bridge Configuration
 * ────────────────────────────
 * This tool connects to the Engram persistent memory system.
 * 
 * Connection modes (set via ENGRAM_MODE env var):
 * - "stub"   : Logs to console only (development/testing)
 * - "sqlite" : Direct SQLite connection via better-sqlite3
 * - "http"   : HTTP API bridge to a running Engram server
 * - "mcp"    : MCP protocol bridge (requires MCP client SDK)
 *
 * Default: "stub" — switch to "sqlite" or "http" for production
 */

type EngramMode = 'stub' | 'sqlite' | 'http' | 'mcp';

function getEngramMode(): EngramMode {
  const mode = process.env.ENGRAM_MODE as EngramMode | undefined;
  if (mode && ['stub', 'sqlite', 'http', 'mcp'].includes(mode)) return mode;
  return 'stub';
}

async function engramSearch(query: string, project?: string, type?: string, limit?: number): Promise<any[]> {
  const mode = getEngramMode();

  switch (mode) {
    case 'http': {
      const baseUrl = process.env.ENGRAM_HTTP_URL || 'http://localhost:3838';
      try {
        const params = new URLSearchParams({ query });
        if (project) params.set('project', project);
        if (type) params.set('type', type);
        if (limit) params.set('limit', String(limit));

        const res = await fetch(`${baseUrl}/api/search?${params.toString()}`);
        if (!res.ok) throw new Error(`Engram HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json() as any;
        return data.results || [];
      } catch (e: any) {
        console.warn(`[Engram HTTP] Search failed: ${e.message}`);
        return [];
      }
    }

    case 'sqlite': {
      // TODO: Import better-sqlite3 or bun:sqlite when available
      // const db = new Database(path.join(os.homedir(), '.engram', 'engram.db'));
      // return db.prepare('SELECT * FROM observations WHERE content LIKE ? LIMIT ?')
      //   .all(`%${query}%`, limit || 10);
      console.warn('[Engram SQLite] Not yet implemented — falling back to stub');
      return [];
    }

    case 'mcp': {
      // TODO: Spawn MCP client and call mem_search tool
      console.warn('[Engram MCP] Not yet implemented — falling back to stub');
      return [];
    }

    default: // stub
      console.log(`[Engram Search STUB] query="${query}" project="${project || 'all'}" type="${type || 'all'}"`);
      return [];
  }
}

export const memSearch = createTool({
  id: 'engram_mem_search',
  description:
    'Searches the global Engram brain for Golden Action Recipes, previous architecture patterns, ' +
    'and shared cross-project knowledge. Returns matching observations ranked by relevance.',
  inputSchema: z.object({
    query: z.string().describe('Natural language search query'),
    project: z.string().optional().describe('Filter by project name'),
    type: z.string().optional().describe('Filter by observation type: recipe, pattern, bugfix, decision, architecture'),
    limit: z.number().int().positive().max(20).optional().default(10).describe('Max results'),
  }),
  outputSchema: z.object({
    results: z.array(z.any()),
    count: z.number(),
    mode: z.string(),
    message: z.string(),
  }),
  execute: async (context) => {
    const results = await engramSearch(context.query, context.project, context.type, context.limit);

    return {
      results,
      count: results.length,
      mode: getEngramMode(),
      message: results.length > 0
        ? `Found ${results.length} matching observations.`
        : `No results found. Mode: ${getEngramMode()}.`,
    };
  },
});
