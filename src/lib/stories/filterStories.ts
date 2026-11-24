import type { Story } from '../../types/story';

export interface StoryFilters {
  query: string;
  level: number | null;
  storyIds: readonly string[] | null;
}

function searchable(text: string): string {
  return text
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replaceAll('đ', 'd');
}

export function filterStories(
  stories: readonly Story[],
  filters: StoryFilters,
): Story[] {
  const query = searchable(filters.query.trim());
  const ids = filters.storyIds ? new Set(filters.storyIds) : null;
  return stories.filter(
    (story) =>
      (filters.level === null || story.level === filters.level) &&
      (ids === null || ids.has(story.id)) &&
      searchable(story.title).includes(query),
  );
}
