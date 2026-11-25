// Sizzle & Serve — the entry program. It hands the game in: game/ and
// screenshots/ are copied from this repository into the output directory,
// and dossier.json is written with buildDossier from the kit's vendor
// library, exactly as the scorer redoes it. The grader runs this twice and
// the two runs must write the same bytes, so nothing here reads the clock,
// the network, or anything outside the repository: it is a pure copy plus
// a deterministic dossier build. Node 22 standard library only. Outside the
// grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function entryPaths() {
  const repoRoot = dirname(fileURLToPath(import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
  return { repoRoot, outDir };
}

function copyHandIn(repoRoot, outDir) {
  mkdirSync(outDir, { recursive: true });
  for (const name of ['game', 'screenshots']) {
    cpSync(join(repoRoot, name), join(outDir, name), { recursive: true });
  }
}

function writeDossier(outDir) {
  const dossier = buildDossier(outDir, DOSSIER_CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

const { repoRoot, outDir } = entryPaths();
copyHandIn(repoRoot, outDir);
writeDossier(outDir);
