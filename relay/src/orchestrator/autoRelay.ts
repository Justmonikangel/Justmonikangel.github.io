import { loadTurns } from '../memory/markdown.ts';
import { readManifest } from '../lib/sessions.ts';
import { runTurn } from './relay.ts';
import type { Attachment, ProviderTarget, Turn } from '../types.ts';

export type AutoRelayEvent =
  | { type: 'turn-start'; role: ProviderTarget; round: number }
  | { type: 'delta'; role: ProviderTarget; delta: string };

export async function* runAutoRelay(opts: {
  sessionId: string;
  rounds: number;
  stopOn?: string | string[];
  target?: ProviderTarget;
  userMessage?: { content: string; attachments: Attachment[] };
}): AsyncGenerator<AutoRelayEvent> {
  const rounds = clampRounds(opts.rounds);
  const stopTerms = normalizeStopTerms(opts.stopOn);
  const recentAssistantTexts = await loadAssistantHistory(opts.sessionId);
  let stagnantTurns = 0;
  let target = await resolveInitialTarget(
    opts.sessionId,
    opts.target,
    Boolean(opts.userMessage),
  );

  for (let round = 1; round <= rounds; round += 1) {
    yield { type: 'turn-start', role: target, round };

    let assistantText = '';
    for await (const chunk of runTurn({
      sessionId: opts.sessionId,
      target,
      userMessage: round === 1 ? opts.userMessage : undefined,
    })) {
      assistantText += chunk;
      yield { type: 'delta', role: target, delta: chunk };
    }

    if (matchesStopTerm(assistantText, stopTerms)) return;

    if (isStagnant(assistantText, recentAssistantTexts)) {
      stagnantTurns += 1;
    } else {
      stagnantTurns = 0;
    }
    recentAssistantTexts.push(assistantText);
    if (recentAssistantTexts.length > 4) recentAssistantTexts.shift();
    if (stagnantTurns >= 2) return;

    target = target === 'claude' ? 'gpt' : 'claude';
  }
}

async function resolveInitialTarget(
  sessionId: string,
  requestedTarget: ProviderTarget | undefined,
  hasUserMessage: boolean,
): Promise<ProviderTarget> {
  if (requestedTarget) return requestedTarget;

  const manifest = await readManifest(sessionId);
  if (manifest.turnCount === 0) {
    if (hasUserMessage) return 'claude';
    throw new Error('target is required for an empty session');
  }

  const turns = await loadTurns(sessionId, Math.max(1, manifest.turnCount - 4));
  const lastAssistant = [...turns].reverse().find((turn) => isAssistantTurn(turn));
  if (!lastAssistant) return 'claude';
  return lastAssistant.role === 'claude' ? 'gpt' : 'claude';
}

async function loadAssistantHistory(sessionId: string): Promise<string[]> {
  const manifest = await readManifest(sessionId);
  if (manifest.turnCount === 0) return [];
  const turns = await loadTurns(sessionId, Math.max(1, manifest.turnCount - 5));
  return turns
    .filter(isAssistantTurn)
    .map((turn) => turn.content)
    .slice(-2);
}

function clampRounds(rounds: number): number {
  if (!Number.isFinite(rounds)) return 1;
  return Math.min(20, Math.max(1, Math.floor(rounds)));
}

function normalizeStopTerms(stopOn?: string | string[]): string[] {
  const raw = Array.isArray(stopOn) ? stopOn : stopOn ? [stopOn] : [];
  return raw.map((term) => term.trim().toLowerCase()).filter(Boolean);
}

function matchesStopTerm(text: string, stopTerms: string[]): boolean {
  if (!stopTerms.length) return false;
  const haystack = text.toLowerCase();
  return stopTerms.some((term) => haystack.includes(term));
}

function isAssistantTurn(turn: Turn): turn is Turn & { role: 'claude' | 'gpt' } {
  return turn.role === 'claude' || turn.role === 'gpt';
}

function isStagnant(current: string, recentAssistantTexts: string[]): boolean {
  const latest = recentAssistantTexts[recentAssistantTexts.length - 1];
  if (!latest) return false;

  const currentNormalized = normalizeText(current);
  const latestNormalized = normalizeText(latest);
  if (!currentNormalized || !latestNormalized) return true;

  if (currentNormalized === latestNormalized) return true;
  if (signalsNoNewInfo(current)) return true;

  const currentWords = new Set(currentNormalized.split(' '));
  const latestWords = new Set(latestNormalized.split(' '));
  let overlap = 0;
  for (const word of currentWords) {
    if (latestWords.has(word)) overlap += 1;
  }

  const newWords = currentWords.size - overlap;
  const overlapRatio = overlap / Math.max(currentWords.size, 1);
  return overlapRatio >= 0.92 && newWords <= 8;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function signalsNoNewInfo(text: string): boolean {
  return /nothing (?:new|further|additional)|no further|already covered|same points|no new information/i.test(
    text,
  );
}
