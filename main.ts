// make.fun hand-in: copy game/ (and screenshots/ when present) from beside this
// file into MAKEFUN_OUTPUT_DIR (default /output), then write dossier.json with
// the kit's buildDossier. Node 22, standard library only — `node main.ts`, no
// flags, no build, no install.

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Fresh copies, so stale files from an earlier run never ride along.
for (const name of ['game', 'screenshots']) {
  const src = join(here, name);
  if (!existsSync(src)) continue;
  const dest = join(out, name);
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });
}

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000
});
const dossierPath = join(out, 'dossier.json');
writeFileSync(dossierPath, dossier);
if (!existsSync(dossierPath) || statSync(dossierPath).size === 0) {
  throw new Error(`dossier.json missing or empty at ${dossierPath} after write`);
}
console.log(`dossier.json written to ${out} (${dossier.length} bytes)`);
