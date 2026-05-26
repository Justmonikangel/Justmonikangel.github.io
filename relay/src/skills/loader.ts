import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../config.ts';

export async function loadSkills(enabled: string[]): Promise<string> {
  if (!enabled.length) return '';
  const out: string[] = [];
  for (const name of enabled) {
    const dir = join(config.skillsDir, name);
    try {
      const s = await stat(dir);
      if (!s.isDirectory()) continue;
      const body = await readFile(join(dir, 'SKILL.md'), 'utf8');
      out.push(`## skill:${name}\n${body}`);
    } catch {}
  }
  return out.join('\n\n');
}

export async function listAvailableSkills(): Promise<string[]> {
  try {
    const entries = await readdir(config.skillsDir, { withFileTypes: true });
    return entries.filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
}
