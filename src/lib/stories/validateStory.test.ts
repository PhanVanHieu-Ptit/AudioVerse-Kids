import { describe, expect, it } from 'vitest';
import data from '../../content/stories/stories.json';
import type { Story } from '../../types/story';
import { parseStoryCollection, validateStory } from './validateStory';

const stories = parseStoryCollection(data);
function copy(): Story {
  const first = stories[0];
  if (!first) throw new Error('Thiếu truyện kiểm tra.');
  return structuredClone(first);
}
function rejects(change: (story: Story) => void, message: RegExp): void {
  const story = copy();
  change(story);
  const result = validateStory(story);
  expect(result.story).toBeNull();
  expect(result.paths).toEqual([]);
  expect(result.errors.join('\n')).toMatch(message);
}

describe('Story schema and branch validation', () => {
  it.each(stories)('validates every edge and terminal path in $id', (story) => {
    const result = validateStory(story);
    expect(result.errors).toEqual([]);
    expect(result.paths).toHaveLength(story.level === 1 ? 2 : 4);
    const edges = new Set<string>();
    const scenes = new Map(story.scenes.map((scene) => [scene.id, scene]));
    for (const path of result.paths) {
      expect(path[0]).toBe(story.entrySceneId);
      expect(new Set(path).size).toBe(path.length);
      expect(scenes.get(path.at(-1) ?? '')?.ending).not.toBeNull();
      for (let i = 1; i < path.length; i++)
        edges.add(`${path[i - 1]}/${path[i]}`);
    }
    for (const scene of story.scenes) {
      for (const choice of scene.interaction?.choices ?? [])
        expect(edges.has(`${scene.id}/${choice.nextSceneId}`)).toBe(true);
    }
  });

  it.each([
    null,
    {},
    [],
    'truyện',
    { ...copy(), level: 4 },
    { ...copy(), title: '  ' },
    { ...copy(), audioSrc: '/nonexistent.mp3' },
    { ...copy(), schemaVersion: 2 },
    {
      ...copy(),
      transcript: { format: 'text/markdown', file: '../escape.md' },
    },
  ])('rejects malformed or unsupported data %#', (value: unknown) => {
    expect(validateStory(value).story).toBeNull();
    expect(validateStory(value).errors.length).toBeGreaterThan(0);
  });

  it('rejects a missing entry, missing destination and a dead end', () => {
    rejects((story) => {
      story.entrySceneId = 'missing';
    }, /mở đầu/);
    rejects((story) => {
      story.scenes[0]!.interaction!.choices[0]!.nextSceneId = 'missing';
    }, /đích không tồn tại/);
    rejects((story) => {
      story.scenes[0]!.interaction = null;
    }, /schema|oneOf/);
  });

  it('rejects cycles, including a cycle with another valid exit', () => {
    rejects((story) => {
      story.scenes[0]!.interaction!.choices[0]!.nextSceneId =
        story.entrySceneId;
    }, /vòng lặp/);
  });

  it('rejects unreachable content', () => {
    rejects((story) => {
      const scene = structuredClone(story.scenes.at(-1)!);
      scene.id = 'orphan';
      scene.ending!.id = 'ending-orphan';
      story.scenes.push(scene);
    }, /không thể tới/);
  });

  it('rejects duplicate scene, character, ending, choice and segment IDs', () => {
    rejects((story) => {
      story.scenes[1]!.id = story.scenes[0]!.id;
    }, /ID trùng/);
    rejects((story) => {
      story.characters.push({ ...story.characters[0]! });
    }, /ID trùng/);
    rejects((story) => {
      story.scenes.at(-1)!.ending!.id = story.scenes.at(-2)!.ending!.id;
    }, /ID trùng/);
    rejects((story) => {
      story.scenes[0]!.interaction!.choices[1]!.id =
        story.scenes[0]!.interaction!.choices[0]!.id;
    }, /ID trùng/);
    rejects((story) => {
      story.scenes[0]!.segments.push({ ...story.scenes[0]!.segments[0]! });
    }, /ID trùng/);
  });

  it('rejects dangling speakers, effect anchors and question references', () => {
    rejects((story) => {
      story.scenes[0]!.segments[0]!.speakerId = 'missing';
    }, /người nói không tồn tại/);
    rejects((story) => {
      story.characters[0]!.id = 'narrator';
    }, /dành riêng/);
    rejects((story) => {
      story.scenes[0]!.soundEffects[0]!.anchorSegmentId = 'missing';
    }, /mốc hiệu ứng/);
    rejects((story) => {
      story.scenes.at(-1)!.questions[0]!.suggestedOptionId = 'missing';
    }, /đáp án tham khảo/);
    rejects((story) => {
      story.scenes.at(-1)!.questions[0]!.options[1]!.id = 'option-1';
    }, /ID trùng/);
  });

  it('rejects a scene that ends and continues at once', () => {
    rejects((story) => {
      story.scenes[0]!.ending = {
        id: 'bad-ending',
        title: 'Dừng',
        message: 'Thông điệp',
      };
    }, /oneOf/);
  });

  it('accepts converging branches without misidentifying a cycle', () => {
    const story = stories.find((candidate) => candidate.level === 2)!;
    const result = validateStory(story);
    expect(result.errors).toEqual([]);
    expect(result.paths).toHaveLength(4);
  });

  it('guards against exponential path expansion', () => {
    const story = copy();
    const template = story.scenes[0]!;
    const terminal = story.scenes.at(-1)!;
    story.entrySceneId = 'step-0';
    story.scenes = Array.from({ length: 15 }, (_, index) => ({
      ...structuredClone(template),
      id: `step-${index}`,
      interaction: {
        prompt: 'Chọn cách tiếp tục.',
        choices: [
          {
            id: 'choice-1',
            label: 'Cách thứ nhất.',
            nextSceneId: index === 14 ? terminal.id : `step-${index + 1}`,
          },
          {
            id: 'choice-2',
            label: 'Cách thứ hai.',
            nextSceneId: index === 14 ? terminal.id : `step-${index + 1}`,
          },
        ],
      },
    }));
    story.scenes.push(terminal);
    expect(validateStory(story).errors.join('\n')).toMatch(/Quá nhiều nhánh/);
  });

  it('parses collections without accepting duplicate stories or invalid items', () => {
    expect(() => parseStoryCollection({})).toThrow(/phải là mảng/);
    expect(() => parseStoryCollection([copy(), copy()])).toThrow(
      /ID truyện trùng/,
    );
    expect(() => parseStoryCollection([null])).toThrow();
  });
});
