import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseStoryCollection } from '../../src/lib/stories/validateStory.ts';
import { speakerName } from '../../src/lib/stories/production.ts';
import config from './voices.json' with { type: 'json' };

const stories = parseStoryCollection(
  JSON.parse(
    await readFile('src/content/stories/stories.json', 'utf8'),
  ) as unknown,
);
const story = stories.find((item) => item.id === config.storyId);
if (!story) throw new Error(`Không tìm thấy truyện ${config.storyId}`);
const scenes = config.sceneIds.map((id) => {
  const scene = story.scenes.find((item) => item.id === id);
  if (!scene) throw new Error(`Không tìm thấy cảnh ${id}`);
  return scene;
});
for (const [index, scene] of scenes.entries()) {
  const next = scenes[index + 1];
  if (
    next &&
    !scene.interaction?.choices.some((item) => item.nextSceneId === next.id)
  )
    throw new Error(`Trích đoạn không theo nhánh: ${scene.id} → ${next.id}`);
}

const candidates = config.candidates.map((candidate) => ({
  ...candidate,
  turns: scenes.flatMap((scene) => [
    {
      cueId: `${story.id}.scene.${scene.id}.title`,
      speaker: 'Người kể',
      text: scene.title,
      voice: candidate.narrator,
      tempo: config.narration.tempo,
      pauseMs: config.scenePauseMs,
    },
    ...scene.segments.map((segment) => {
      const character = Object.entries(config.characters).find(
        ([id]) => id === segment.speakerId,
      )?.[1];
      if (segment.speakerId !== 'narrator' && !character)
        throw new Error(`Chưa chọn giọng cho ${segment.speakerId}`);
      const speaker = speakerName(story, segment.speakerId);
      return {
        cueId: `${story.id}.scene.${scene.id}.segment.${segment.id}`,
        speaker,
        text:
          segment.speakerId === 'narrator'
            ? segment.text
            : `${speaker} nói: ${segment.text}`,
        voice: character?.voice ?? candidate.narrator,
        tempo: character?.tempo ?? config.narration.tempo,
        pauseMs: character?.pauseMs ?? config.narration.pauseMs,
      };
    }),
  ]),
}));
const out = resolve('artifacts/voice-previews/nam-ke-chuyen');
await mkdir(out, { recursive: true });
const plan = {
  schemaVersion: 1,
  status: 'planned',
  storyId: story.id,
  title: story.title,
  sourceAttribution: story.source?.attribution ?? null,
  contentRevision: createHash('sha256')
    .update(JSON.stringify(stories))
    .digest('hex'),
  candidates,
};
await writeFile(`${out}/plan.json`, JSON.stringify(plan, null, 2) + '\n');
console.log(
  `Đã tạo kế hoạch ${candidates.length} bản nghe thử: ${out}/plan.json`,
);
