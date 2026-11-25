export type GameLevel = 1 | 2 | 3;
export type GameMode = 'choice' | 'sequence' | 'pairs' | 'rhythm';

export interface SoundNote {
  frequency: number;
  endFrequency?: number;
  start: number;
  duration: number;
  wave?: OscillatorType;
  gain?: number;
}

export interface GameSound {
  id: string;
  label: string;
  description: string;
  notes: readonly SoundNote[];
}

export interface GameOption {
  id: string;
  label: string;
}

interface ChallengeBase {
  id: string;
  level: GameLevel;
  prompt: string;
  description: string;
  explanation: string;
  /** A local recording is generated for spoken questions. */
  audioSrc?: string;
}

export interface ChoiceChallenge extends ChallengeBase {
  mode: 'choice';
  options: readonly GameOption[];
  answer: string;
  sound?: GameSound;
  chapter?: string;
}

export interface SequenceChallenge extends ChallengeBase {
  mode: 'sequence';
  palette: readonly GameSound[];
  sequence: readonly string[];
}

export interface PairsChallenge extends ChallengeBase {
  mode: 'pairs';
  cards: readonly { id: string; sound: GameSound }[];
}

export interface RhythmChallenge extends ChallengeBase {
  mode: 'rhythm';
  /** Intervals between consecutive beats, measured in half-second units. */
  intervals: readonly number[];
  tolerance: number;
}

export type GameChallenge =
  ChoiceChallenge | SequenceChallenge | PairsChallenge | RhythmChallenge;

export interface ActivityGameDefinition {
  id: string;
  title: string;
  description: string;
  instructions: string;
  guidanceAudioSrc: string;
  challenges: readonly GameChallenge[];
}

export interface GameSession {
  round: number;
  phase: 'playing' | 'feedback' | 'completed';
  firstTry: number;
  mistakes: number;
  roundMistakes: number;
  feedback: 'correct' | 'incorrect' | null;
  input: string[];
  matched: string[];
}

export interface GameProgress {
  version: 1;
  selectedLevel: GameLevel;
  levels: Partial<Record<GameLevel, GameSession>>;
}
