import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * SANDBOX CONFIGURATION
 * ─────────────────────
 * Agents can ONLY edit files within AGENT_WORKSPACE.
 * If not set, defaults to a `workspace/` dir relative to cwd.
 *
 * Allowlist-based: only safe extensions pass through.
 * All paths are resolved and anchored — no traversal escape possible.
 */
const ALLOWED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.css', '.scss', '.less',
  '.html', '.astro', '.svelte', '.vue',
  '.md', '.mdx',
  '.json', '.yaml', '.yml',
  '.txt', '.csv',
  '.svg',
]);

const FORBIDDEN_FILENAMES = new Set([
  '.env', '.env.local', '.env.production', '.env.development',
  'docker-compose.yml', 'docker-compose.yaml', 'Dockerfile',
  '.gitignore', '.npmrc', '.nvmrc',
]);

function getWorkspaceRoot(): string {
  return path.resolve(process.env.AGENT_WORKSPACE || path.join(process.cwd(), 'workspace'));
}

function validateSandbox(targetFile: string): { ok: true; resolved: string } | { ok: false; error: string } {
  const workspace = getWorkspaceRoot();
  const resolved = path.resolve(workspace, targetFile);

  // 1. Anchor check — must be within workspace
  if (!resolved.startsWith(workspace + path.sep) && resolved !== workspace) {
    return { ok: false, error: `PATH TRAVERSAL BLOCKED: "${targetFile}" resolves outside workspace (${workspace}).` };
  }

  // 2. Core protection — block modifications to swarm infrastructure paths
  const relative = path.relative(workspace, resolved);
  const segments = relative.split(path.sep);
  const hasCoreSegment = segments.some((seg, i) =>
    (seg === 'src' && segments[i + 1] === 'mastra') || seg === 'openspec'
  );
  if (hasCoreSegment) {
    return { ok: false, error: `CORE PROTECTION: Agents cannot modify swarm infrastructure ("${relative}").` };
  }

  // 3. Extension allowlist
  const ext = path.extname(resolved).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: `FORBIDDEN EXTENSION: "${ext}" is not in the allowlist. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}` };
  }

  // 4. Filename blocklist
  const basename = path.basename(resolved);
  if (FORBIDDEN_FILENAMES.has(basename)) {
    return { ok: false, error: `FORBIDDEN FILE: "${basename}" is a protected configuration file.` };
  }

  return { ok: true, resolved };
}

export const multiReplace = createTool({
  id: 'multi_replace_file_content',
  description: 'Replaces specific strings or blocks of code in a file. Allowlist-based sandbox prevents editing protected files.',
  inputSchema: z.object({
    TargetFile: z.string().describe('Path relative to AGENT_WORKSPACE'),
    Instruction: z.string().describe('Human-readable description of the change'),
    ReplacementChunks: z.array(z.object({
      StartLine: z.number().int().positive(),
      EndLine: z.number().int().positive(),
      TargetContent: z.string(),
      ReplacementContent: z.string(),
      AllowMultiple: z.boolean().default(false),
    })),
  }),
  execute: async (context) => {
    const { TargetFile, ReplacementChunks } = context;

    // ════════════════════════════════════════════
    // 🛡️ SANDBOX: Allowlist-based workspace guard
    // ════════════════════════════════════════════
    const validation = validateSandbox(TargetFile);
    if (!validation.ok) {
      return { error: `🛑 SECURITY: ${validation.error}` };
    }
    const absolutePath = validation.resolved;

    try {
      let content = await fs.readFile(absolutePath, 'utf-8');

      for (const chunk of ReplacementChunks) {
        if (!content.includes(chunk.TargetContent)) {
          return { error: `TargetContent not found in file ${TargetFile} for chunk starting at line ${chunk.StartLine}` };
        }

        if (chunk.AllowMultiple) {
          content = content.split(chunk.TargetContent).join(chunk.ReplacementContent);
        } else {
          content = content.replace(chunk.TargetContent, chunk.ReplacementContent);
        }
      }

      await fs.writeFile(absolutePath, content, 'utf-8');
      return { status: 'success', message: `Successfully executed ${ReplacementChunks.length} replacements in ${TargetFile}` };
    } catch (e: any) {
      return { error: e.message || 'Failed to execute multi-replace.' };
    }
  },
});
