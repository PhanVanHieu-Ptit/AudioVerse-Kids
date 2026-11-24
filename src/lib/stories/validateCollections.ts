import Ajv from 'ajv';
import schema from '../../content/stories/collections.schema.json' with { type: 'json' };
import type { Story, StoryCollections } from '../../types/story.ts';

const validateShape = new Ajv({
  strict: true,
  allErrors: true,
}).compile<StoryCollections>(schema);

/** Ensure every active story belongs to one collection and retellings retain credit. */
export function parseStoryCollections(
  value: unknown,
  stories: readonly Story[],
): StoryCollections {
  if (!validateShape(value))
    throw new Error(
      `Sai schema bộ sưu tập: ${JSON.stringify(validateShape.errors)}`,
    );
  const byId = new Map(stories.map((story) => [story.id, story]));
  const memberships = new Set<string>();
  const collectionIds = new Set<string>();
  for (const collection of value.collections) {
    if (collectionIds.has(collection.id))
      throw new Error(`ID bộ sưu tập trùng: ${collection.id}`);
    collectionIds.add(collection.id);
    for (const id of collection.storyIds) {
      const story = byId.get(id);
      if (!story)
        throw new Error(`Truyện trong bộ sưu tập không tồn tại: ${id}`);
      if (memberships.has(id))
        throw new Error(`Truyện thuộc nhiều bộ sưu tập: ${id}`);
      if (collection.kind === 'retelling' && !story.source)
        throw new Error(`Truyện kể lại thiếu xuất xứ: ${id}`);
      if (collection.kind === 'original' && story.source)
        throw new Error(
          `Truyện có nguồn chuyển thể bị gắn nhãn nguyên bản: ${id}`,
        );
      memberships.add(id);
    }
  }
  for (const story of stories) {
    if (!memberships.has(story.id))
      throw new Error(`Truyện chưa thuộc bộ sưu tập: ${story.id}`);
  }
  const deferredIds = new Set<string>();
  for (const item of value.deferred) {
    if (deferredIds.has(item.id))
      throw new Error(`ID truyện chờ rà soát trùng: ${item.id}`);
    if (byId.has(item.id))
      throw new Error(`Truyện chờ rà soát đã vào nội dung: ${item.id}`);
    deferredIds.add(item.id);
  }
  return value;
}
