import type { Pitch, ToneGameDefinition } from '@/content/games';

export function answerToneRound(
  game: ToneGameDefinition,
  position: number,
  answer: Pitch,
) {
  const round = game.rounds[position];
  if (!Number.isSafeInteger(position) || !round)
    return { correct: false, position };
  const correct = round.answer === answer;
  return { correct, position: correct ? position + 1 : position };
}
