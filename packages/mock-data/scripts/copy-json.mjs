import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src', 'data');
const outDir = join(__dirname, '..', 'dist', 'data');

mkdirSync(outDir, { recursive: true });
for (const file of readdirSync(srcDir).filter((f) => f.endsWith('.json'))) {
  cpSync(join(srcDir, file), join(outDir, file));
}
console.log('Copied JSON data to dist/data');
