import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

/**
 * update_context tool — Updates the .delusion/context.md in a project repo.
 *
 * Agents call this AFTER completing work to record:
 * - What was changed
 * - Any gotchas discovered
 * - Client preferences learned
 *
 * This is the feedback loop: every iteration makes the next one smarter.
 */
export const updateContext = createTool({
  id: 'update-context',
  description:
    'Update the .delusion/context.md file in a project repository. ' +
    'Use "append" to add a new entry, or "replace" to rewrite the full context. ' +
    'ALWAYS update context after completing work on a project.',
  inputSchema: z.object({
    projectPath: z
      .string()
      .describe('Absolute path to the project repository root'),
    mode: z
      .enum(['append', 'replace'])
      .default('append')
      .describe('append: add to existing. replace: overwrite entirely.'),
    content: z
      .string()
      .describe(
        'Content to append or replace. For append, include a date header like "## 2026-04-07: Description"',
      ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async (context) => {
    const contextPath = join(context.projectPath, '.delusion', 'context.md');

    try {
      await mkdir(dirname(contextPath), { recursive: true });

      if (context.mode === 'replace') {
        await writeFile(contextPath, context.content, 'utf-8');
      } else {
        // Append mode
        let existing = '';
        try {
          existing = await readFile(contextPath, 'utf-8');
        } catch {
          // File doesn't exist yet — will create
        }

        const separator = existing.length > 0 ? '\n\n' : '';
        await writeFile(
          contextPath,
          existing + separator + context.content,
          'utf-8',
        );
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  },
});
