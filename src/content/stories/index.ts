import data from './stories.json';
import levels from './levels.json';
import collections from './collections.json';
import { parseStoryCollection } from '../../lib/stories/validateStory';
import { parseStoryCollections } from '../../lib/stories/validateCollections';

/** Text content only. No playable audio URL exists until recordings are delivered. */
export const stories = parseStoryCollection(data);
export const storyLevels = levels;
export const storyCollections = parseStoryCollections(collections, stories);

export function getStory(id: string) {
  return stories.find((story) => story.id === id);
}
