// Sedona Method release flow, after Lester Levenson / Hale Dwoskin.
// Steps are intentionally simple: welcome -> name the feeling -> three questions -> check -> loop or finish.
// Prompts are bilingual (zh + en) so the client can render either or both.

export const STEPS = {
  WELCOME: 'welcome',
  EMOTION: 'emotion',
  WELCOME_EMOTION: 'welcome_emotion',
  Q1_COULD: 'q1_could',
  Q2_WOULD: 'q2_would',
  Q3_WHEN: 'q3_when',
  CHECK: 'check',
  DONE: 'done',
};

const t = (zh, en) => ({ zh, en });

const fillEmotion = (text, emotion) =>
  text.replaceAll('{emotion}', emotion || '这个感受').replaceAll('{emotion_en}', emotion || 'this feeling');

const prompts = {
  [STEPS.WELCOME]: () => ({
    step: STEPS.WELCOME,
    next: STEPS.EMOTION,
    say: t(
      '欢迎。先做一次缓慢的深呼吸。我们会一起做圣多纳释放法 —— 不分析，不评判，只是觉察并放手。准备好了告诉我。',
      "Welcome. Take one slow, deep breath. We'll do the Sedona Method together — no analyzing, no judging, just noticing and letting go. Tell me when you're ready.",
    ),
    inputHint: t('随便说一句话，比如「好」或「准备好了」', 'Just say something like "ok" or "ready".'),
  }),

  [STEPS.EMOTION]: () => ({
    step: STEPS.EMOTION,
    next: STEPS.WELCOME_EMOTION,
    say: t(
      '把注意力带到内心。此刻你能觉察到什么样的情绪或感受？焦虑、悲伤、愤怒、紧绷、空虚……不用分析它从哪儿来，只说出来。',
      'Bring your attention inward. What feeling can you notice right now? Anxiety, sadness, anger, tightness, emptiness… no need to analyze where it came from, just name it.',
    ),
    inputHint: t('用一两个词描述这个感受', 'Describe the feeling in a word or two.'),
  }),

  [STEPS.WELCOME_EMOTION]: (s) => ({
    step: STEPS.WELCOME_EMOTION,
    next: STEPS.Q1_COULD,
    say: t(
      fillEmotion('好。允许「{emotion}」就在那里。不抗拒，不推开，也不抓住。让它存在,就像一片云飘过天空。准备好了,我会问你三个问题。', s.currentEmotion),
      fillEmotion("Good. Allow {emotion_en} to be there. Don't resist it, don't push it away, don't grab it. Let it be there, like a cloud crossing the sky. When you're ready, I'll ask you three questions.", s.currentEmotion),
    ),
    inputHint: t('准备好了就说「好」', 'Say "ready" when you are.'),
  }),

  [STEPS.Q1_COULD]: (s) => ({
    step: STEPS.Q1_COULD,
    next: STEPS.Q2_WOULD,
    say: t(
      fillEmotion('第一个问题：你**能**让「{emotion}」离开吗？(Could you let it go?) —— 不需要真的放下,只需要诚实回答:能,或不能。', s.currentEmotion),
      fillEmotion('First question: **Could** you let {emotion_en} go? You don\'t have to actually release it — just answer honestly: yes, or no.', s.currentEmotion),
    ),
    inputHint: t('能 / 不能 / 也许 都可以', 'Yes / No / Maybe — any answer is fine.'),
  }),

  [STEPS.Q2_WOULD]: (s) => ({
    step: STEPS.Q2_WOULD,
    next: STEPS.Q3_WHEN,
    say: t(
      fillEmotion('第二个问题：你**愿意**让它离开吗？(Would you?) —— 如果可以的话,你愿意吗？', s.currentEmotion),
      'Second question: **Would** you let it go? If you could, would you?',
    ),
    inputHint: t('愿意 / 不愿意 都可以', 'Willing / Not willing — either is fine.'),
  }),

  [STEPS.Q3_WHEN]: () => ({
    step: STEPS.Q3_WHEN,
    next: STEPS.CHECK,
    say: t(
      '第三个问题：**什么时候**？(When?) —— Lester 的建议是,试试看说「现在」。',
      "Third question: **When**? Lester's invitation is to try saying \"now.\"",
    ),
    inputHint: t('现在 / 待会 / 还不行 都可以', '"Now" / "later" / "not yet" — all welcome.'),
  }),

  [STEPS.CHECK]: (s) => ({
    step: STEPS.CHECK,
    next: STEPS.Q1_COULD, // default loop target; updated dynamically below
    say: t(
      fillEmotion('再次把注意力带回内心。那个「{emotion}」现在怎么样了？还在吗？强度变了吗？还是已经松动、变淡了？', s.currentEmotion),
      fillEmotion('Bring your attention back inside. How is {emotion_en} now? Still there? Softer? Lighter? Gone?', s.currentEmotion),
    ),
    inputHint: t('描述当下的感觉,或者说「还在」「轻了」「没了」', 'Describe what you notice now, or say "still there" / "lighter" / "gone".'),
  }),

  [STEPS.DONE]: () => ({
    step: STEPS.DONE,
    next: null,
    say: t(
      '好。停在这个空间里片刻。你随时可以重新开始,觉察下一个浮现的感受。Lester 说:你越放手,你就越自由。',
      "Good. Rest here for a moment. You can begin again any time, with whatever feeling shows up next. Lester said: the more you let go, the freer you are.",
    ),
    inputHint: null,
  }),
};

// Very small, deterministic intent classifier — no LLM needed.
// Returns 'still', 'released', or 'continue'.
const classifyCheck = (text = '') => {
  const lower = text.toLowerCase().trim();
  if (!lower) return 'continue';
  const releasedKeywords = [
    '没了', '没有了', '消失', '不见', '轻了', '松了', '松开', '释放', '走了', '空了', '舒服',
    'gone', 'released', 'lighter', 'better', 'released it', 'let go', 'freed',
  ];
  const stillKeywords = [
    '还在', '没变', '一样', '更强', '没动', '没用', '不行',
    'still', 'same', 'stronger', 'worse', 'no change', "didn't work",
  ];
  if (releasedKeywords.some((k) => lower.includes(k))) return 'released';
  if (stillKeywords.some((k) => lower.includes(k))) return 'still';
  return 'continue';
};

const extractEmotion = (text = '') => {
  const cleaned = text.trim().replace(/[。！？.!?]+$/, '');
  // Cap length so the prompt template stays tidy.
  return cleaned.length > 24 ? cleaned.slice(0, 24) + '…' : cleaned;
};

export const initialState = () => ({
  step: STEPS.WELCOME,
  currentEmotion: null,
  releaseCount: 0,
  history: [],
});

export const renderPrompt = (state) => {
  const builder = prompts[state.step] || prompts[STEPS.WELCOME];
  const prompt = builder(state);
  // For CHECK we don't know yet whether to loop or finish until the user answers.
  return prompt;
};

// Advance the flow given the user's input. Returns { state, prompt }.
export const advance = (state, userInput = '') => {
  const trimmed = String(userInput || '').trim();

  // Record user turn.
  if (trimmed) {
    state.history.push({ role: 'user', text: trimmed, at: Date.now() });
  }

  switch (state.step) {
    case STEPS.WELCOME:
      state.step = STEPS.EMOTION;
      break;

    case STEPS.EMOTION:
      state.currentEmotion = extractEmotion(trimmed) || '这个感受';
      state.step = STEPS.WELCOME_EMOTION;
      break;

    case STEPS.WELCOME_EMOTION:
      state.step = STEPS.Q1_COULD;
      break;

    case STEPS.Q1_COULD:
      state.step = STEPS.Q2_WOULD;
      break;

    case STEPS.Q2_WOULD:
      state.step = STEPS.Q3_WHEN;
      break;

    case STEPS.Q3_WHEN:
      state.step = STEPS.CHECK;
      break;

    case STEPS.CHECK: {
      const verdict = classifyCheck(trimmed);
      state.releaseCount += 1;
      if (verdict === 'released' || state.releaseCount >= 5) {
        state.step = STEPS.DONE;
      } else {
        state.step = STEPS.Q1_COULD; // loop the three questions
      }
      break;
    }

    case STEPS.DONE:
      // Stay in DONE; client can call /reset to start over.
      break;
  }

  const prompt = renderPrompt(state);
  state.history.push({
    role: 'guide',
    step: prompt.step,
    text_zh: prompt.say.zh,
    text_en: prompt.say.en,
    at: Date.now(),
  });

  return { state, prompt };
};

export const isTerminal = (state) => state.step === STEPS.DONE;
