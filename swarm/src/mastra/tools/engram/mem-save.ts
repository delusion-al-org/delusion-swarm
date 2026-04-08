import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Engram Save Bridge
 * ──────────────────
 * Saves observations to the Engram persistent memory.
 * Supports the same connection modes as mem-search.ts
 * (controlled by ENGRAM_MODE env var)
 */

type EngramMode = 'stub' | 'sqlite' | 'http' | 'mcp';

function getEngramMode(): EngramMode {
  const mode = process.env.ENGRAM_MODE as EngramMode | undefined;
  if (mode && ['stub', 'sqlite', 'http', 'mcp'].includes(mode)) return mode;
  return 'stub';
}

interface SavePayload {
  title: string;
  content: string;
  type: string;
  project?: string;
  topic_key?: string;
}

async function engramSave(payload: SavePayload): Promise<{ id?: number; success: boolean }> {
  const mode = getEngramMode();

  switch (mode) {
    case 'http': {
      const baseUrl = process.env.ENGRAM_HTTP_URL || 'http://localhost:3838';
      try {
        const res = await fetch(`${baseUrl}/api/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Engram HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json() as any;
        return { id: data.id, success: true };
      } catch (e: any) {
        console.warn(`[Engram HTTP] Save failed: ${e.message}`);
        return { success: false };
      }
    }

    case 'sqlite': {
      // TODO: Direct SQLite insert
      console.warn('[Engram SQLite] Not yet implemented — falling back to stub');
      return { success: false };
    }

    case 'mcp': {
      // TODO: MCP client bridge
      console.warn('[Engram MCP] Not yet implemented — falling back to stub');
      return { success: false };
    }

    default: // stub
      console.log(`[Engram Save STUB] ${payload.type.toUpperCase()}: "${payload.title}"`);
      console.log(`  Content: ${payload.content.substring(0, 200)}${payload.content.length > 200 ? '...' : ''}`);
      if (payload.project) console.log(`  Project: ${payload.project}`);
      if (payload.topic_key) console.log(`  Topic: ${payload.topic_key}`);
      return { success: true };
  }
}

export const memSave = createTool({
  id: 'engram_mem_save',
  description:
    'Saves a Golden Action Recipe, discovered pattern, or structural abstraction into the global ' +
    'Engram brain for cross-project reuse. Use the structured content format.',
  inputSchema: z.object({
    title: z.string().describe('Short, searchable title (e.g. "Dark mode toggle recipe")'),
    content: z.string().describe('Structured content: **What**, **Why**, **Where**, **Learned**'),
    type: z.enum(['architecture', 'decision', 'pattern', 'recipe', 'bugfix', 'discovery']),
    project: z.string().optional().describe('Project name for scoping'),
    topic_key: z.string().optional().describe('Stable key for upserts (e.g. "recipe/dark-mode-toggle")'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    id: z.number().optional(),
    mode: z.string(),
    message: z.string(),
  }),
  execute: async (context) => {
    const result = await engramSave({
      title: context.title,
      content: context.content,
      type: context.type,
      project: context.project,
      topic_key: context.topic_key,
    });

    return {
      success: result.success,
      id: result.id,
      mode: getEngramMode(),
      message: result.success
        ? `Observation "${context.title}" saved successfully (mode: ${getEngramMode()}).`
        : `Failed to save observation (mode: ${getEngramMode()}).`,
    };
  },
});
