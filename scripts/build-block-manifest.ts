import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { parse } from 'yaml'; // Requires yaml package

/**
 * This script scans the packages/blocks/src/components for any .block.yaml files,
 * parses them, validates them against our schema loosely, and outputs a single `blocks-manifest.json`
 * in the root of the monorepo.
 */

async function buildManifest() {
  console.log('🔄 Building block manifest...');
  const componentsDir = join(import.meta.dir, '..', 'packages', 'blocks', 'src', 'components');
  const outputPath = join(import.meta.dir, '..', 'blocks-manifest.json');
  
  const blocks: any[] = [];
  
  try {
    const files = await readdir(componentsDir);
    const yamlFiles = files.filter(f => f.endsWith('.block.yaml'));
    
    for (const file of yamlFiles) {
      try {
        const content = await readFile(join(componentsDir, file), 'utf-8');
        const parsed = parse(content);
        if (parsed && parsed.name) {
          blocks.push(parsed);
          console.log(`✅ Loaded: ${parsed.name}`);
        } else {
          console.warn(`⚠️ Skipped ${file}: Missing 'name' property`);
        }
      } catch (err) {
        console.error(`❌ Error parsing ${file}:`, err);
      }
    }
    
    await writeFile(outputPath, JSON.stringify({ blocks }, null, 2), 'utf-8');
    console.log(`🎉 Built blocks-manifest.json with ${blocks.length} blocks!`);
    
  } catch (err) {
    console.error('Failed to build manifest. Does packages/blocks/src/components exist?', err);
    process.exit(1);
  }
}

buildManifest();
