import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const outDir = join(process.cwd(), '..', 'web', 'public', 'mobile');

if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const result = spawnSync(
  process.execPath,
  [require.resolve('expo/bin/cli'), 'export', '--platform', 'web', '--output-dir', outDir],
  { stdio: 'inherit', cwd: process.cwd() },
);

process.exit(result.status ?? 1);
