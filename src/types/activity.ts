import type { GameProgress } from './game';

export type ActivityKind = 'game' | 'story';

/** Only device-local progress; no names, recordings or personal profiles. */
export interface ActivityProgress {
  kind: ActivityKind;
  id: string;
  position: number;
  completed: boolean;
  updatedAt: number;
  /** Optional versioned game snapshot; validated against its question bank on restore. */
  game?: GameProgress;
}

export function activityKey(kind: ActivityKind, id: string) {
  return `${kind}:${id}`;
}

export function activityPath(kind: ActivityKind, id: string) {
  return `/${kind === 'game' ? 'games' : 'stories'}/${encodeURIComponent(id)}`;
}

export function isActivityProgress(value: unknown): value is ActivityProgress {
  if (typeof value !== 'object' || value === null) return false;
  return (
    'kind' in value &&
    (value.kind === 'game' || value.kind === 'story') &&
    'id' in value &&
    typeof value.id === 'string' &&
    /^[a-z0-9-]+$/.test(value.id) &&
    'position' in value &&
    typeof value.position === 'number' &&
    Number.isSafeInteger(value.position) &&
    value.position >= 0 &&
    'completed' in value &&
    typeof value.completed === 'boolean' &&
    'updatedAt' in value &&
    typeof value.updatedAt === 'number' &&
    Number.isFinite(value.updatedAt) &&
    value.updatedAt >= 0
  );
}
