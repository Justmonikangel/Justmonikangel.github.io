import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targets = [path.resolve(__dirname, '..', '..', 'assets'), path.resolve(__dirname, '..', '..', 'index.html')];

for (const target of targets) {
  await rm(target, { recursive: true, force: true });
}
