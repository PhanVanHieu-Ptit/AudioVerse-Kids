import { describe, expect, it } from 'vitest';
import data from '../../content/stories/collections.json';
import storyData from '../../content/stories/stories.json';
import { parseStoryCollections } from './validateCollections';
import { parseStoryCollection, validateStory } from './validateStory';

const stories = parseStoryCollection(storyData);
const collections = parseStoryCollections(data, stories);

describe('collection attribution and rights metadata', () => {
  it('accepts the attributed collection and retains the deferred title outside active content', () => {
    expect(collections.collections).toHaveLength(2);
    expect(collections.deferred[0]?.id).toBe('hoang-tu-be');
  });

  it('rejects broken membership and duplicate assignments', () => {
    const missing = structuredClone(collections);
    missing.collections[0]!.storyIds[0] = 'missing';
    expect(() => parseStoryCollections(missing, stories)).toThrow(
      /không tồn tại/,
    );
    const orphan = structuredClone(collections);
    orphan.collections[0]!.storyIds.pop();
    expect(() => parseStoryCollections(orphan, stories)).toThrow(/chưa thuộc/);
    const duplicate = structuredClone(collections);
    duplicate.collections[1]!.storyIds.push(
      duplicate.collections[0]!.storyIds[0]!,
    );
    expect(() => parseStoryCollections(duplicate, stories)).toThrow(
      /nhiều bộ sưu tập/,
    );
  });

  it('rejects duplicate collection IDs and duplicate deferred IDs', () => {
    const duplicate = structuredClone(collections);
    duplicate.collections[1]!.id = duplicate.collections[0]!.id;
    expect(() => parseStoryCollections(duplicate, stories)).toThrow(
      /ID bộ sưu tập trùng/,
    );
    const deferred = structuredClone(collections);
    deferred.deferred.push({ ...deferred.deferred[0]! });
    expect(() => parseStoryCollections(deferred, stories)).toThrow(
      /chờ rà soát trùng/,
    );
  });

  it('rejects lost credit and false original labels', () => {
    const uncredited = structuredClone(stories);
    const retelling = uncredited.find((story) => story.source)!;
    delete retelling.source;
    expect(() => parseStoryCollections(collections, uncredited)).toThrow(
      /thiếu xuất xứ/,
    );
    const mislabeled = structuredClone(collections);
    mislabeled.collections[1]!.kind = 'original';
    expect(() => parseStoryCollections(mislabeled, stories)).toThrow(
      /gắn nhãn nguyên bản/,
    );
  });

  it('rejects a deferred title accidentally appearing in active content', () => {
    const invalid = structuredClone(collections);
    invalid.deferred[0]!.id = stories[0]!.id;
    expect(() => parseStoryCollections(invalid, stories)).toThrow(
      /đã vào nội dung/,
    );
  });

  it('requires complete source metadata and safe source links', () => {
    const story = stories.find((item) => item.source)!;
    expect(validateStory({ ...story, source: {} }).story).toBeNull();
    expect(
      validateStory({
        ...story,
        source: { ...story.source, referenceUrl: 'javascript:alert(1)' },
      }).story,
    ).toBeNull();
    expect(
      validateStory({
        ...story,
        source: { ...story.source, reviewedOn: '2026-99-01' },
      }).story,
    ).toBeNull();
    expect(
      validateStory({
        ...story,
        source: { ...story.source, rightsReferences: [] },
      }).story,
    ).toBeNull();
    expect(() =>
      parseStoryCollections(
        {
          ...collections,
          deferred: [
            { ...collections.deferred[0], status: 'cleared-worldwide' },
          ],
        },
        stories,
      ),
    ).toThrow(/schema/);
  });
});
