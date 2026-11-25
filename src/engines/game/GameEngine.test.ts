import { describe, expect, it } from 'vitest';
import { activityGames } from '@/content/activityGames';
import type { GameChallenge, GameSession } from '@/types/game';
import {
  createSession,
  levelChallenges,
  matchesRhythm,
  progressSummary,
  restoreGame,
  transitionGame,
} from './GameEngine';

function solve(
  challenge: GameChallenge,
  before = createSession(),
): GameSession {
  const send = (action: Parameters<typeof transitionGame>[2]) => {
    before = transitionGame(before, [challenge], action);
  };
  if (challenge.mode === 'choice')
    send({ type: 'answer', value: challenge.answer });
  if (challenge.mode === 'sequence' || challenge.mode === 'rhythm') {
    const values =
      challenge.mode === 'sequence'
        ? challenge.sequence
        : challenge.intervals.map(String);
    for (const value of values) send({ type: 'append', value });
    send({ type: 'submit' });
  }
  if (challenge.mode === 'pairs') {
    for (const sound of new Set(challenge.cards.map((card) => card.sound.id))) {
      for (const card of challenge.cards.filter(
        (card) => card.sound.id === sound,
      ))
        send({ type: 'card', value: card.id });
    }
  }
  return before;
}

describe('game content and rules', () => {
  it('ships eight games with 24 distinct challenges and three populated levels each', () => {
    expect(activityGames).toHaveLength(8);
    expect(new Set(activityGames.map((game) => game.id)).size).toBe(8);
    for (const game of activityGames) {
      expect(game.challenges).toHaveLength(24);
      expect(new Set(game.challenges.map((c) => c.id)).size).toBe(24);
      for (const level of [1, 2, 3] as const)
        expect(levelChallenges(game, level)).toHaveLength(8);
      for (const c of game.challenges) {
        expect(c.prompt).not.toBe('');
        expect(c.explanation).not.toBe('');
        if (c.mode === 'choice') {
          expect(c.options.filter((o) => o.id === c.answer)).toHaveLength(1);
          expect(new Set(c.options.map((o) => o.label)).size).toBe(
            c.options.length,
          );
        }
        if (c.mode === 'pairs')
          for (const sound of new Set(c.cards.map((card) => card.sound.id)))
            expect(
              c.cards.filter((card) => card.sound.id === sound),
            ).toHaveLength(2);
      }
    }
  });

  it.each(activityGames)(
    'can solve every challenge in $title, once only',
    (game) => {
      for (const challenge of game.challenges) {
        const solved = solve(challenge);
        expect(solved).toMatchObject({
          phase: 'feedback',
          firstTry: 1,
          mistakes: 0,
        });
        expect(solve(challenge, solved)).toBe(solved);
        const completed = transitionGame(solved, [challenge], { type: 'next' });
        expect(completed).toMatchObject({
          phase: 'completed',
          round: 1,
          input: [],
          matched: [],
        });
        expect(transitionGame(completed, [challenge], { type: 'next' })).toBe(
          completed,
        );
      }
    },
  );

  it('retains the round after a wrong answer and counts first-try success honestly', () => {
    const c = activityGames[4]!.challenges[0]!;
    if (c.mode !== 'choice') throw new Error('Expected choice');
    let state = createSession();
    expect(transitionGame(state, [c], { type: 'next' })).toBe(state);
    expect(
      transitionGame(state, [c], { type: 'answer', value: 'missing' }),
    ).toBe(state);
    state = transitionGame(state, [c], {
      type: 'answer',
      value: c.options.find((o) => o.id !== c.answer)!.id,
    });
    expect(state).toMatchObject({
      round: 0,
      phase: 'playing',
      mistakes: 1,
      feedback: 'incorrect',
    });
    expect(solve(c, state)).toMatchObject({
      firstTry: 0,
      mistakes: 1,
      phase: 'feedback',
    });
  });

  it('checks sequence order, bounds input, and supports undo and retry', () => {
    const c = activityGames[2]!.challenges[0]!;
    if (c.mode !== 'sequence') throw new Error('Expected sequence');
    let state = createSession();
    expect(transitionGame(state, [c], { type: 'submit' })).toBe(state);
    expect(
      transitionGame(state, [c], { type: 'append', value: 'unknown' }),
    ).toBe(state);
    for (const value of [...c.sequence].reverse())
      state = transitionGame(state, [c], { type: 'append', value });
    expect(
      transitionGame(state, [c], { type: 'append', value: c.sequence[0]! }),
    ).toBe(state);
    state = transitionGame(state, [c], { type: 'submit' });
    expect(state.feedback).toBe('incorrect');
    state = transitionGame(state, [c], { type: 'undo' });
    expect(state.input).toHaveLength(1);
    state = transitionGame(state, [c], { type: 'clear' });
    expect(solve(c, state)).toMatchObject({ firstTry: 0, phase: 'feedback' });
  });

  it('cannot pair a card with itself, blocks a third card and preserves matched pairs', () => {
    const c = activityGames[3]!.challenges[0]!;
    if (c.mode !== 'pairs') throw new Error('Expected pairs');
    const a = c.cards[0]!;
    const wrong = c.cards.find((card) => card.sound.id !== a.sound.id)!;
    const mate = c.cards.find(
      (card) => card.id !== a.id && card.sound.id === a.sound.id,
    )!;
    let state = transitionGame(createSession(), [c], {
      type: 'card',
      value: a.id,
    });
    expect(transitionGame(state, [c], { type: 'card', value: a.id })).toBe(
      state,
    );
    state = transitionGame(state, [c], { type: 'card', value: wrong.id });
    expect(state).toMatchObject({
      feedback: 'incorrect',
      mistakes: 1,
      input: [a.id, wrong.id],
    });
    expect(transitionGame(state, [c], { type: 'card', value: mate.id })).toBe(
      state,
    );
    state = transitionGame(state, [c], { type: 'hide' });
    state = transitionGame(state, [c], { type: 'card', value: a.id });
    state = transitionGame(state, [c], { type: 'card', value: mate.id });
    expect(state.matched).toEqual([a.id, mate.id]);
    expect(transitionGame(state, [c], { type: 'card', value: a.id })).toBe(
      state,
    );
    expect(solve(c, state)).toMatchObject({ phase: 'feedback', firstTry: 0 });
  });
});

describe('rhythm timing', () => {
  it('accepts different tempos and small timing errors but rejects different patterns', () => {
    expect(matchesRhythm([1, 2, 1], [100, 600, 1600, 2100], 0.2)).toBe(true);
    expect(matchesRhythm([1, 2, 1], [100, 1100, 3100, 4100], 0.2)).toBe(true);
    expect(matchesRhythm([1, 2, 1], [100, 610, 1620, 2100], 0.2)).toBe(true);
    expect(matchesRhythm([1, 2, 1], [100, 600, 1100, 1600], 0.2)).toBe(false);
  });
  it.each(
    [
      [0, 0, 0],
      [0, 500],
      [0, 500, NaN],
      [0, 500, Infinity],
      [500, 400, 300],
      [0, 10, 20],
    ].map((times) => ({ times })),
  )(
    'rejects incomplete, nonmonotonic and invalid taps: $times',
    ({ times }) => {
      expect(matchesRhythm([1, 1], times, 0.2)).toBe(false);
    },
  );
});

describe('restoring game sessions', () => {
  const game = activityGames[2]!;
  it('round trips partial input and preserves independent levels and total completion', () => {
    const progress = {
      version: 1 as const,
      selectedLevel: 2 as const,
      levels: { 1: { ...createSession(), input: ['do'] }, 2: createSession() },
    };
    expect(restoreGame(game, JSON.parse(JSON.stringify(progress)))).toEqual(
      progress,
    );
    expect(progressSummary(progress)).toEqual({
      position: 0,
      completed: false,
    });
    const complete = {
      ...createSession(),
      phase: 'completed' as const,
      round: 8,
      firstTry: 8,
    };
    expect(
      progressSummary({
        ...progress,
        levels: { 1: complete, 2: complete, 3: complete },
      }),
    ).toEqual({ position: 24, completed: true });
  });
  it.each([
    null,
    {},
    { version: 7 },
    { version: 1, selectedLevel: 9, levels: {} },
  ])('recovers from incompatible snapshots: %j', (value) => {
    expect(restoreGame(game, value)).toEqual({
      version: 1,
      selectedLevel: 1,
      levels: {},
    });
  });
  it.each([
    { round: -1 },
    { round: 99 },
    { phase: 'completed' },
    { input: ['missing'] },
    { input: [1] },
    { firstTry: 20 },
    { roundMistakes: 3 },
    { phase: 'feedback', feedback: null },
  ])('discards corrupt sessions without losing other levels: %j', (patch) => {
    const restored = restoreGame(game, {
      version: 1,
      selectedLevel: 2,
      levels: { 1: { ...createSession(), ...patch }, 2: createSession() },
    });
    expect(restored.levels[1]).toBeUndefined();
    expect(restored.levels[2]).toEqual(createSession());
  });
});
