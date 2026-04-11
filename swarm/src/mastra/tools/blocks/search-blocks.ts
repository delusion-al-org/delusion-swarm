import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Block manifest entry — what the model sees when searching for components.
 * Built from block.yaml files via scripts/build-block-manifest.ts
 */
const blockEntrySchema = z.object({
  name: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
  props: z.record(
    z.object({
      type: z.string(),
      required: z.boolean().optional(),
      description: z.string().optional(),
    }),
  ),
});

export type BlockEntry = z.infer<typeof blockEntrySchema>;

/**
 * search_blocks tool — Searches the @delusion/blocks manifest
 * to find components matching a query.
 *
 * The Forge agent calls this to discover available UI components
 * instead of generating HTML from scratch. This is the core of
 * our token economy: the LLM reads props from here and fills
 * a delusion.json, never touching HTML/CSS directly.
 *
 * Strategy:
 * 1. Read the pre-built manifest (blocks-manifest.json). This manifest MUST be built
 *    before starting the swarm using `bun run build:manifest`.
 * 2. Match by category, tags, or fuzzy name match
 */
export const searchBlocks = createTool({
  id: 'search-blocks',
  description:
    'Search available UI blocks from @delusion/blocks. Returns matching components with their props schema. ' +
    'Use this BEFORE generating any site content to know what blocks exist and what props they accept.',
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'Natural language query (e.g. "hero section", "pricing", "contact")',
      ),
    category: z
      .string()
      .optional()
      .describe('Filter by category exact match (e.g., hero, navigation, footer)'),
    limit: z.coerce
      .number()
      .optional()
      .default(10)
      .describe('Max results to return'),
  }),
  outputSchema: z.object({
    blocks: z.array(blockEntrySchema),
    total: z.number(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    try {
      // Configurable path via env var, fallback to monorepo root
      const manifestPath = process.env.BLOCKS_MANIFEST_PATH || join(process.cwd(), '..', 'blocks-manifest.json');
      
      const raw = await readFile(manifestPath, 'utf-8');
      const parsed = JSON.parse(raw);
      
      let blocks: BlockEntry[] = [];
      if (Array.isArray(parsed)) blocks = parsed;
      else if (parsed.blocks && Array.isArray(parsed.blocks)) blocks = parsed.blocks;

      if (blocks.length === 0) {
        return {
          blocks: [],
          total: 0,
          error: 'Manifest is empty.',
        };
      }

      const filtered = filterBlocks(blocks, context.query, context.category);
      const limited = filtered.slice(0, context.limit ?? 10);

      return { blocks: limited, total: filtered.length };
    } catch (err) {
      return {
        blocks: [],
        total: 0,
        error: `Failed to search blocks: ${String(err)}. Is the manifest built?`,
      };
    }
  },
});

/**
 * Filter blocks by query string and optional category.
 */
function filterBlocks(
  blocks: BlockEntry[],
  query: string,
  category?: string,
): BlockEntry[] {
  const q = query.toLowerCase();

  return blocks
    .filter((block) => {
      // Category filter (exact match)
      if (category && block.category !== category) return false;

      // Fuzzy matching on name, category, tags, description
      const searchable = [
        block.name.toLowerCase(),
        block.category.toLowerCase(),
        ...block.tags.map((t) => t.toLowerCase()),
        block.description.toLowerCase(),
      ].join(' ');

      return searchable.includes(q);
    })
    .sort((a, b) => {
      // Prioritize name matches
      const aNameMatch = a.name.toLowerCase().includes(q) ? 0 : 1;
      const bNameMatch = b.name.toLowerCase().includes(q) ? 0 : 1;
      return aNameMatch - bNameMatch;
    });
}
