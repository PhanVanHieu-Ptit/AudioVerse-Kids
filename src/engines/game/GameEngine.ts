import type {
  ActivityGameDefinition,
  GameChallenge,
  GameLevel,
  GameProgress,
  GameSession,
} from '@/types/game';

export type GameAction =
  | { type: 'answer'; value: string }
  | { type: 'append'; value: string }
  | { type: 'card'; value: string }
  | { type: 'rhythm'; timestamps: readonly number[] }
  | { type: 'submit' }
  | { type: 'undo' }
  | { type: 'clear' }
  | { type: 'hide' }
  | { type: 'next' };

export function createSession(): GameSession {
  return {
    round: 0,
    phase: 'playing',
    firstTry: 0,
    mistakes: 0,
    roundMistakes: 0,
    feedback: null,
    input: [],
    matched: [],
  };
}

export function levelChallenges(
  game: ActivityGameDefinition,
  level: GameLevel,
) {
  return game.challenges.filter((challenge) => challenge.level === level);
}

function fail(session: GameSession): GameSession {
  return {
    ...session,
    feedback: 'incorrect',
    mistakes: session.mistakes + 1,
    roundMistakes: session.roundMistakes + 1,
  };
}

function succeed(session: GameSession): GameSession {
  return {
    ...session,
    phase: 'feedback',
    feedback: 'correct',
    firstTry: session.firstTry + (session.roundMistakes === 0 ? 1 : 0),
  };
}

/** Tempo-independent interval comparison. No timeout or reaction-speed requirement. */
export function matchesRhythm(
  expected: readonly number[],
  timestamps: readonly number[],
  tolerance: number,
) {
  if (
    !expected.length ||
    timestamps.length !== expected.length + 1 ||
    !Number.isFinite(tolerance) ||
    tolerance < 0 ||
    tolerance > 1 ||
    expected.some((n) => !Number.isFinite(n) || n <= 0) ||
    timestamps.some((n) => !Number.isFinite(n) || n < 0)
  )
    return false;
  const intervals = timestamps.slice(1).map((time, i) => time - timestamps[i]!);
  if (intervals.some((n) => n < 60)) return false;
  const scale =
    intervals.reduce((sum, n) => sum + n, 0) /
    expected.reduce((sum, n) => sum + n, 0);
  return intervals.every(
    (n, i) => Math.abs(n / scale - expected[i]!) <= expected[i]! * tolerance,
  );
}

/** Pure rules shared by all eight games. Stale/duplicate actions cannot earn points. */
export function transitionGame(
  session: GameSession,
  challenges: readonly GameChallenge[],
  action: GameAction,
): GameSession {
  const challenge = challenges[session.round];
  if (!challenge || session.phase === 'completed') return session;
  if (action.type === 'next') {
    if (session.phase !== 'feedback') return session;
    const round = session.round + 1;
    return {
      ...session,
      round,
      phase: round === challenges.length ? 'completed' : 'playing',
      roundMistakes: 0,
      feedback: null,
      input: [],
      matched: [],
    };
  }
  if (session.phase !== 'playing') return session;
  switch (action.type) {
    case 'answer':
      if (
        challenge.mode !== 'choice' ||
        !challenge.options.some((o) => o.id === action.value)
      )
        return session;
      return action.value === challenge.answer
        ? succeed(session)
        : fail(session);
    case 'append': {
      const maximum =
        challenge.mode === 'sequence'
          ? challenge.sequence.length
          : challenge.mode === 'rhythm'
            ? challenge.intervals.length
            : 0;
      const valid =
        challenge.mode === 'sequence'
          ? challenge.palette.some((s) => s.id === action.value)
          : challenge.mode === 'rhythm' &&
            ['1', '2', '3'].includes(action.value);
      if (!valid || session.input.length >= maximum) return session;
      return {
        ...session,
        input: [...session.input, action.value],
        feedback: null,
      };
    }
    case 'undo':
    case 'clear':
      if (challenge.mode !== 'sequence' && challenge.mode !== 'rhythm')
        return session;
      return {
        ...session,
        input: action.type === 'clear' ? [] : session.input.slice(0, -1),
        feedback: null,
      };
    case 'submit': {
      const expected =
        challenge.mode === 'sequence'
          ? challenge.sequence
          : challenge.mode === 'rhythm'
            ? challenge.intervals.map(String)
            : null;
      if (!expected || session.input.length !== expected.length) return session;
      return expected.every((value, i) => value === session.input[i])
        ? succeed(session)
        : fail(session);
    }
    case 'rhythm':
      if (
        challenge.mode !== 'rhythm' ||
        action.timestamps.length !== challenge.intervals.length + 1
      )
        return session;
      return matchesRhythm(
        challenge.intervals,
        action.timestamps,
        challenge.tolerance,
      )
        ? succeed(session)
        : fail(session);
    case 'hide':
      return challenge.mode === 'pairs' && session.input.length === 2
        ? { ...session, input: [], feedback: null }
        : session;
    case 'card': {
      if (
        challenge.mode !== 'pairs' ||
        session.input.length >= 2 ||
        session.matched.includes(action.value) ||
        session.input.includes(action.value)
      )
        return session;
      const card = challenge.cards.find((c) => c.id === action.value);
      if (!card) return session;
      const input = [...session.input, card.id];
      if (input.length === 1) return { ...session, input, feedback: null };
      const first = challenge.cards.find((c) => c.id === input[0]);
      if (first?.sound.id !== card.sound.id) return fail({ ...session, input });
      const matched = [...session.matched, ...input];
      const next = {
        ...session,
        input: [],
        matched,
        feedback: 'correct' as const,
      };
      return matched.length === challenge.cards.length ? succeed(next) : next;
    }
  }
}

function validSession(
  value: unknown,
  challenges: readonly GameChallenge[],
): value is GameSession {
  if (!value || typeof value !== 'object') return false;
  const s = value as GameSession;
  if (
    !['playing', 'feedback', 'completed'].includes(s.phase) ||
    ![s.round, s.firstTry, s.mistakes, s.roundMistakes].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) ||
    s.round > challenges.length ||
    s.firstTry > s.round + (s.phase === 'feedback' ? 1 : 0) ||
    s.roundMistakes > s.mistakes ||
    ![null, 'correct', 'incorrect'].includes(s.feedback) ||
    !Array.isArray(s.input) ||
    !Array.isArray(s.matched) ||
    ![...s.input, ...s.matched].every((n) => typeof n === 'string') ||
    (s.phase === 'feedback' && s.feedback !== 'correct')
  )
    return false;
  if (s.phase === 'completed')
    return (
      s.round === challenges.length &&
      s.input.length === 0 &&
      s.matched.length === 0 &&
      s.feedback === null
    );
  const c = challenges[s.round];
  if (!c) return false;
  if (c.mode === 'pairs') {
    const keys = [...s.input, ...s.matched];
    return (
      s.input.length <= 2 &&
      s.matched.length % 2 === 0 &&
      new Set(keys).size === keys.length &&
      keys.every((id) => c.cards.some((card) => card.id === id)) &&
      s.matched.every((id) => {
        const card = c.cards.find((item) => item.id === id)!;
        return (
          s.matched.filter(
            (key) =>
              c.cards.find((item) => item.id === key)?.sound.id ===
              card.sound.id,
          ).length === 2
        );
      })
    );
  }
  if (s.matched.length) return false;
  if (c.mode === 'choice') return s.input.length === 0;
  if (c.mode === 'sequence')
    return (
      s.input.length <= c.sequence.length &&
      s.input.every((id) => c.palette.some((sound) => sound.id === id))
    );
  return (
    s.input.length <= c.intervals.length &&
    s.input.every((id) => ['1', '2', '3'].includes(id))
  );
}

/** Validate untrusted IndexedDB snapshots against the current content version. */
export function restoreGame(
  game: ActivityGameDefinition,
  value: unknown,
): GameProgress {
  const fresh: GameProgress = { version: 1, selectedLevel: 1, levels: {} };
  if (!value || typeof value !== 'object') return fresh;
  const candidate = value as GameProgress;
  if (
    candidate.version !== 1 ||
    ![1, 2, 3].includes(candidate.selectedLevel) ||
    !candidate.levels ||
    typeof candidate.levels !== 'object'
  )
    return fresh;
  fresh.selectedLevel = candidate.selectedLevel;
  for (const level of [1, 2, 3] as const) {
    const session = candidate.levels[level];
    if (validSession(session, levelChallenges(game, level)))
      fresh.levels[level] = session;
  }
  return fresh;
}

export function progressSummary(progress: GameProgress) {
  const sessions = Object.values(progress.levels);
  return {
    position: sessions.reduce(
      (n, s) => n + s.round + (s.phase === 'feedback' ? 1 : 0),
      0,
    ),
    completed:
      sessions.length === 3 && sessions.every((s) => s.phase === 'completed'),
  };
}
