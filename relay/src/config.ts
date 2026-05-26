const env = process.env;

export const config = {
  port: Number(env.PORT ?? 8787),
  dataDir: env.DATA_DIR ?? './data',
  skillsDir: env.SKILLS_DIR ?? './skills',
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
    url: env.OMBREBRAIN_URL ?? '',
    apiKey: env.OMBREBRAIN_API_KEY ?? '',
  },
};
