import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export const multiReplace = createTool({
  id: 'multi_replace_file_content',
  description: 'Replaces specific strings or blocks of code in a file. This slashes token usage compared to rewriting entire files.',
  inputSchema: z.object({
    TargetFile: z.string(),
    Instruction: z.string(),
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
    const absolutePath = path.resolve(process.cwd(), TargetFile);
    
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
