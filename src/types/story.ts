/** Content contract v1. Age bands describe language complexity, never ability. */
export type StoryLevel = 1 | 2 | 3;
export type StoryTheme =
  | 'friendship'
  | 'nature'
  | 'animals'
  | 'exploration'
  | 'science'
  | 'life-skills'
  | 'imagination';

export interface StoryCharacter {
  id: string;
  name: string;
  description: string;
}

export interface StorySegment {
  id: string;
  speakerId: string;
  text: string;
}

export interface StorySoundEffect {
  id: string;
  description: string;
  anchorSegmentId: string;
  placement: 'before' | 'after';
  productionNotes: string;
}

export interface StoryChoice {
  id: string;
  label: string;
  nextSceneId: string;
}

export interface StoryQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string; feedback: string }[];
  /** null means reflection: no preferred answer and no score. */
  suggestedOptionId: string | null;
}

export interface StoryScene {
  id: string;
  title: string;
  segments: StorySegment[];
  soundEffects: StorySoundEffect[];
  interaction: { prompt: string; choices: StoryChoice[] } | null;
  questions: StoryQuestion[];
  ending: { id: string; title: string; message: string } | null;
}

/** Rights concern the source story, not a license for modern editions or recordings. */
export interface StorySource {
  kind: 'folk-tale' | 'public-domain-source';
  title: string;
  attribution: string;
  referenceUrl: string;
  rightsNote: string;
  rightsReferences: string[];
  reviewedOn: string;
  adaptationNotes: string[];
}

export interface StoryCollections {
  schemaVersion: 1;
  collections: {
    id: string;
    title: string;
    kind: 'original' | 'retelling';
    storyIds: string[];
  }[];
  deferred: {
    id: string;
    title: string;
    status: 'rights-review-required';
    reviewedOn: string;
    reason: string;
    references: string[];
  }[];
}

export interface Story {
  schemaVersion: 1;
  id: string;
  language: 'vi';
  level: StoryLevel;
  title: string;
  introduction: string;
  themes: StoryTheme[];
  characters: StoryCharacter[];
  entrySceneId: string;
  scenes: StoryScene[];
  positiveMessage: string;
  /** Relative to docs/stories/transcripts; text in segments is the UI fallback. */
  transcript: { format: 'text/markdown'; file: string };
  accessibilityNotes: string[];
  /** Absent for the original collection; required editorially for retellings. */
  source?: StorySource;
}
