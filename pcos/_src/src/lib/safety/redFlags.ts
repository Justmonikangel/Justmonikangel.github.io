import patternsSeed from '@/mocks/redFlagPatterns.json';
import type { RedFlagPattern } from '@/types/safety';

/**
 * The hydrated red-flag pattern registry.
 *
 * Patterns are loaded from `mocks/redFlagPatterns.json` and pre-compiled to
 * RegExp on module load. `detect()` (in ./detect.ts) iterates this list as
 * the FIRST step of every agent loop, before any LLM call. See
 * ARCHITECTURE-v2.md §16.4 (R-1..R-5).
 *
 * Editing in production: patterns are content not code. They should be
 * tunable without redeploy. P1 lives in JSON; P1.5 may move to Worker.
 */
export interface CompiledRedFlag extends RedFlagPattern {
  regex: RegExp;
}

function compile(p: RedFlagPattern): CompiledRedFlag {
  return { ...p, regex: new RegExp(p.pattern, p.flags ?? 'i') };
}

const REGISTRY: CompiledRedFlag[] = (patternsSeed as RedFlagPattern[]).map(compile);

export function listRedFlagPatterns(): CompiledRedFlag[] {
  return REGISTRY;
}

export function getRedFlagPattern(id: string): CompiledRedFlag | undefined {
  return REGISTRY.find((p) => p.id === id);
}
