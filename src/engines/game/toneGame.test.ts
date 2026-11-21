import { describe, expect, it } from 'vitest';
import { games } from '@/content/games';
import { answerToneRound } from '@/engines/game/toneGame';

describe('tone game rules', () => {
  const game = games[0];
  if (!game) throw new Error('A playable game must exist');
  it('advances only after a correct answer and never beyond the last round', () => {
    expect(answerToneRound(game, 0, 'low')).toEqual({
      correct: false,
      position: 0,
    });
    expect(answerToneRound(game, 0, 'high')).toEqual({
      correct: true,
      position: 1,
    });
    expect(answerToneRound(game, 1, 'low')).toEqual({
      correct: true,
      position: 2,
    });
    expect(answerToneRound(game, 2, 'high')).toEqual({
      correct: true,
      position: 3,
    });
    expect(answerToneRound(game, 3, 'high')).toEqual({
      correct: false,
      position: 3,
    });
    expect(answerToneRound(game, -1, 'high').correct).toBe(false);
  });
});
