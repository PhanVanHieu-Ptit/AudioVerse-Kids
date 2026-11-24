import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import {
  getStory,
  stories,
  storyLevels,
  storyCollections,
} from '../src/content/stories';
import manifest from '../src/content/stories/audio-manifest.json';
import manifestSchema from '../src/content/stories/audio-manifest.schema.json';
import report from '../docs/stories/validation-report.json';
import { planStoryAssets } from '../src/lib/stories/production';
import { validateStory } from '../src/lib/stories/validateStory';

describe('Vietnamese original and classic content delivery', () => {
  it('preserves fifteen originals and adds six attributed retellings across three levels', () => {
    expect(stories).toHaveLength(21);
    const originals = storyCollections.collections.find(
      (collection) => collection.kind === 'original',
    )!;
    const retellings = storyCollections.collections.find(
      (collection) => collection.kind === 'retelling',
    )!;
    expect(originals.storyIds).toHaveLength(15);
    expect(retellings.storyIds).toHaveLength(6);
    for (const id of originals.storyIds)
      expect(getStory(id)?.source).toBeUndefined();
    for (const id of retellings.storyIds)
      expect(getStory(id)?.source).toBeDefined();
    expect(storyLevels.map((level) => level.id)).toEqual([1, 2, 3]);
    for (const level of storyLevels)
      expect(stories.filter((story) => story.level === level.id)).toHaveLength(
        7,
      );
    expect(new Set(stories.flatMap((story) => story.themes))).toEqual(
      new Set([
        'friendship',
        'nature',
        'animals',
        'exploration',
        'science',
        'life-skills',
        'imagination',
      ]),
    );
    expect(getStory('missing')).toBeUndefined();
    expect(getStory(stories[0]!.id)).toBe(stories[0]);
    expect(getStory('hoang-tu-be')).toBeUndefined();
    expect(
      storyCollections.deferred.find((item) => item.id === 'hoang-tu-be')
        ?.status,
    ).toBe('rights-review-required');
  });

  it('ships a complete, current asset plan with no invented audio sources', () => {
    const valid = new Ajv({ strict: true, allErrors: true }).compile(
      manifestSchema,
    );
    expect(valid(manifest), JSON.stringify(valid.errors)).toBe(true);
    expect(manifest.assets).toEqual(stories.flatMap(planStoryAssets));
    expect(new Set(manifest.assets.map((asset) => asset.id)).size).toBe(
      manifest.assets.length,
    );
    expect(new Set(manifest.assets.map((asset) => asset.targetFile)).size).toBe(
      manifest.assets.length,
    );
    for (const asset of manifest.assets) {
      expect(asset.status).toBe('planned');
      expect(asset).not.toHaveProperty('src');
      expect(asset).not.toHaveProperty('durationSeconds');
      expect(existsSync(resolve('public', asset.targetFile))).toBe(false);
    }
    expect(
      valid({
        ...manifest,
        assets: [{ ...manifest.assets[0], src: '/fake.mp3' }],
      }),
    ).toBe(false);
  });

  it('links the branch report and manifest to exactly the delivered content', () => {
    const revision = createHash('sha256')
      .update(JSON.stringify(stories))
      .digest('hex');
    expect(report.contentRevision).toBe(revision);
    expect(report.collectionsRevision).toBe(
      createHash('sha256')
        .update(JSON.stringify(storyCollections))
        .digest('hex'),
    );
    expect(manifest.contentRevision).toBe(revision);
    expect(report.stories).toHaveLength(stories.length);
    let paths = 0;
    for (const story of stories) {
      const entry = report.stories.find(
        (candidate) => candidate.id === story.id,
      );
      expect(entry?.paths).toEqual(validateStory(story).paths);
      expect(entry?.sceneCount).toBe(story.scenes.length);
      expect(entry?.endingCount).toBe(
        story.scenes.filter((scene) => scene.ending).length,
      );
      paths += entry?.paths.length ?? 0;
    }
    expect(paths).toBe(70);
  });

  it.each(stories)(
    'provides all branch text and recording cues for $id',
    (story) => {
      const transcript = readFileSync(
        resolve('docs/stories/transcripts', story.transcript.file),
        'utf8',
      );
      const cues = planStoryAssets(story);
      expect(transcript).toContain(story.introduction);
      expect(transcript).toContain(story.positiveMessage);
      if (story.source) {
        expect(transcript).toContain(story.source.attribution);
        expect(transcript).toContain(story.source.referenceUrl);
        expect(transcript).toContain(story.source.rightsNote);
        for (const note of story.source.adaptationNotes)
          expect(transcript).toContain(note);
        const credits = cues.filter(
          (cue) => cue.kind === 'speech' && cue.role === 'source-credit',
        );
        expect(credits).toHaveLength(1);
        expect(credits[0]).toMatchObject({
          text: story.source.attribution,
          speakerId: 'narrator',
        });
      }
      expect(story.scenes.filter((scene) => scene.ending)).toHaveLength(2);
      expect(story.scenes.some((scene) => scene.questions.length > 0)).toBe(
        true,
      );
      for (const character of story.characters) {
        expect(transcript).toContain(character.name);
        expect(transcript).toContain(character.description);
      }
      for (const scene of story.scenes) {
        expect(transcript).toContain(`<a id="${scene.id}"></a>`);
        for (const segment of scene.segments) {
          expect(transcript).toContain(segment.text);
          expect(
            cues.some(
              (cue) =>
                cue.kind === 'speech' &&
                cue.text === segment.text &&
                cue.speakerId === segment.speakerId &&
                cue.sceneId === scene.id,
            ),
          ).toBe(true);
        }
        for (const effect of scene.soundEffects)
          expect(transcript).toContain(effect.description);
        for (const choice of scene.interaction?.choices ?? []) {
          expect(transcript).toContain(choice.label);
          expect(transcript).toContain(`](#${choice.nextSceneId})`);
        }
        for (const question of scene.questions) {
          expect(transcript).toContain(question.prompt);
          for (const option of question.options) {
            expect(transcript).toContain(option.label);
            expect(transcript).toContain(option.feedback);
          }
        }
        if (scene.ending) expect(transcript).toContain(scene.ending.message);
      }
    },
  );
});
