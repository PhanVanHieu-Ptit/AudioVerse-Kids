import { describe, expect, it } from 'vitest';
import { stories, storyCollections } from '../../content/stories';
import { filterStories } from './filterStories';

const all = { query: '', level: null, storyIds: null };

describe('story filtering', () => {
  it('searches Vietnamese titles with or without accents, case and surrounding space', () => {
    for (const query of [
      'Trạng Quỳnh',
      'TRANG QUYNH',
      '  trạng quỳnh  ',
      'trang quynh'.normalize('NFD'),
    ])
      expect(
        filterStories(stories, { ...all, query }).map((story) => story.id),
      ).toEqual(['trang-quynh-mam-da']);
    expect(
      filterStories(stories, { ...all, query: 'khan do' }).map(
        (story) => story.id,
      ),
    ).toEqual(['co-be-quang-khan-do']);
  });

  it('combines level, collection and search, without mutating the catalogue', () => {
    const classicIds = storyCollections.collections.find(
      (collection) => collection.kind === 'retelling',
    )!.storyIds;
    expect(filterStories(stories, { ...all, level: 1 })).toHaveLength(7);
    expect(
      filterStories(stories, { ...all, level: 3, storyIds: classicIds }),
    ).toHaveLength(2);
    expect(
      filterStories(stories, { query: 'heo', level: 3, storyIds: classicIds }),
    ).toEqual([]);
    expect(filterStories(stories, { ...all, storyIds: [] })).toEqual([]);
    expect(filterStories(stories, { ...all, query: '  ' })).toEqual(stories);
    expect(stories).toHaveLength(21);
  });
});
