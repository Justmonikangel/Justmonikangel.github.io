const env = process.env;

function parseListEnv(value: string | undefined): string[] {
  const trimmed = value?.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
  }
  return trimmed.split(/\s+/).filter(Boolean);
}

function parseRecordEnv(value: string | undefined): Record<string, string> {
  const trimmed = value?.trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, innerValue]) => [key, String(innerValue)]),
    );
  } catch {
    return {};
  }
}

export const config = {
  port: Number(env.PORT ?? 8787),
  dataDir: env.DATA_DIR ?? './data',
  skillsDir: env.SKILLS_DIR ?? './skills',
  relayToken: env.RELAY_TOKEN ?? '',
  anthropicApiKey: env.ANTHROPIC_API_KEY ?? '',
  openaiApiKey: env.OPENAI_API_KEY ?? '',
  claude: {
    model: env.CLAUDE_MODEL ?? 'claude-opus-4-7',
    thinkingBudget: Number(env.CLAUDE_THINKING_BUDGET ?? 32000),
    maxTokens: Number(env.CLAUDE_MAX_TOKENS ?? 64000),
  },
  gpt: {
    model: env.GPT_MODEL ?? 'gpt-5',
    reasoningEffort: (env.GPT_REASONING_EFFORT ?? 'high') as 'low' | 'medium' | 'high',
  },
  compaction: {
    thresholdTokens: Number(env.COMPACTION_THRESHOLD_TOKENS ?? 140000),
    keepRecentTurns: Number(env.COMPACTION_KEEP_RECENT_TURNS ?? 8),
  },
  ombrebrain: {
    mode: (env.OMBREBRAIN_MODE ?? '').trim() as 'http' | 'mcp' | '',
    url: env.OMBREBRAIN_URL ?? '',
    apiKey: env.OMBREBRAIN_API_KEY ?? '',
    mcpTransport: (env.OMBREBRAIN_MCP_TRANSPORT ?? 'streamable-http') as 'streamable-http' | 'stdio',
    mcpUrl: env.OMBREBRAIN_MCP_URL ?? '',
    mcpCommand: env.OMBREBRAIN_MCP_COMMAND ?? '',
    mcpArgs: parseListEnv(env.OMBREBRAIN_MCP_ARGS),
    mcpEnv: parseRecordEnv(env.OMBREBRAIN_MCP_ENV_JSON),
  },
};
