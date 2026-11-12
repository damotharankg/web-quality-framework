#!/usr/bin/env -S node --use-bundled-ca
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const distCli = path.resolve(__dirname, '../dist/cli.js');
  const srcCli = path.resolve(__dirname, '../src/cli.js');

  if (fs.existsSync(distCli)) {
    const { runCli } = await import(`file://${distCli}`);
    await runCli();
  } else {
    const { runCli } = await import(`file://${srcCli}`);
    await runCli();
  }
}

start().catch(err => {
  console.error('[web-quality-framework] Fatal error:', err);
  process.exit(1);
});
