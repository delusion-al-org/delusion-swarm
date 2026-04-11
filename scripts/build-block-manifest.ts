/**
 * Build Block Manifest
 * ────────────────────
 * Scans @delusion/blocks type definitions and generates
 * blocks-manifest.json at the repo root.
 *
 * The Forge agent reads this manifest via search-blocks to
 * discover available UI components and their props schemas.
 *
 * Usage: bun run scripts/build-block-manifest.ts
 *
 * Future: extend with block.yaml metadata files per component
 * for richer descriptions, tags, and examples.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface PropDef {
  type: string;
  required: boolean;
  description?: string;
}

interface BlockEntry {
  name: string;
  category: string;
  tags: string[];
  description: string;
  props: Record<string, PropDef>;
}

// Simple heuristics to derive category and tags from component name
function inferCategory(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('hero')) return 'hero';
  if (lower.includes('contact') || lower.includes('footer')) return 'contact';
  if (lower.includes('nav') || lower.includes('header')) return 'navigation';
  if (lower.includes('gallery') || lower.includes('image')) return 'media';
  if (lower.includes('pricing') || lower.includes('menu')) return 'content';
  if (lower.includes('testimonial') || lower.includes('review')) return 'social-proof';
  if (lower.includes('faq')) return 'content';
  return 'general';
}

function inferTags(name: string, category: string): string[] {
  const tags = [category, name.replace(/Section$/, '').toLowerCase()];
  const lower = name.toLowerCase();
  if (lower.includes('cta')) tags.push('cta');
  if (lower.includes('hero')) tags.push('landing', 'banner', 'header');
  if (lower.includes('menu')) tags.push('services', 'list', 'restaurant', 'catalog');
  if (lower.includes('contact')) tags.push('footer', 'address', 'phone', 'email');
  return [...new Set(tags)];
}

/**
 * Parse a TypeScript interface file to extract props.
 * This is a simple regex-based parser — not a full TS AST.
 */
function parsePropsFromTypeFile(content: string, componentName: string): Record<string, PropDef> {
  const props: Record<string, PropDef> = {};
  
  const interfaceRegex = new RegExp(
    `export\\s+interface\\s+${componentName}Props\\s*\\{([^}]+)\\}`,
    's',
  );
  const match = content.match(interfaceRegex);
  if (!match) return props;

  const body = match[1];
  const fieldRegex = /(\w+)(\??):\s*([^;]+);/g;
  let fieldMatch;

  while ((fieldMatch = fieldRegex.exec(body)) !== null) {
    const [, name, optional, type] = fieldMatch;
    props[name] = {
      type: type.trim(),
      required: optional !== '?',
    };
  }

  return props;
}

async function main() {
  const scriptDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
  const blocksDir = path.resolve(scriptDir, '../packages/blocks/src/components');
  const outPath = path.resolve(scriptDir, '../blocks-manifest.json');
  
  const entries = await fs.readdir(blocksDir, { withFileTypes: true });
  const typeFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.types.ts'))
    .map((e) => e.name);

  const manifest: BlockEntry[] = [];

  for (const typeFile of typeFiles) {
    const componentName = typeFile.replace('.types.ts', '');
    const content = await fs.readFile(path.join(blocksDir, typeFile), 'utf-8');
    const props = parsePropsFromTypeFile(content, componentName);
    const category = inferCategory(componentName);

    manifest.push({
      name: componentName,
      category,
      tags: inferTags(componentName, category),
      description: `${componentName} block from @delusion/blocks. Auto-generated from type definitions.`,
      props,
    });
  }

  await fs.writeFile(outPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\u2705 blocks-manifest.json generated with ${manifest.length} blocks`);
  manifest.forEach((b) => console.log(`   - ${b.name} (${Object.keys(b.props).length} props)`));
}

main().catch(console.error);
