// Prepare all recordings before publishing one complete, verified playback manifest.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
import { parseStoryCollection } from '../src/lib/stories/validateStory.ts';
import { planStoryPerformance } from '../src/lib/stories/performance.ts';
import profile from './local-tts/library-profile.json' with { type: 'json' };

const root = fileURLToPath(new URL('../', import.meta.url));
const staging = join(root, '.cache/local-tts/library-render');
const output = join(root, 'public/audio/stories');
const hash = (value: string | Uint8Array) =>
  createHash('sha256').update(value).digest('hex');
const stories = parseStoryCollection(
  JSON.parse(
    await readFile(join(root, 'src/content/stories/stories.json'), 'utf8'),
  ) as unknown,
);
if (profile.voice !== profile.cast.narrator.voice)
  throw new Error('Tên giọng chính không khớp phân vai.');
const contentRevision = hash(JSON.stringify(stories));
const recordings = stories.flatMap((story) =>
  planStoryPerformance(story, profile.cast).map((item) => {
    const performanceSha256 = hash(JSON.stringify(item.turns));
    const transcriptSha256 = hash(item.transcript);
    const profileHash = hash(
      JSON.stringify({ profile, transcriptSha256, performanceSha256 }),
    );
    return {
      ...item,
      transcriptSha256,
      performanceSha256,
      profileHash,
      file: `${item.storyId}/${item.id}.${profileHash.slice(0, 16)}.v2.mp3`,
    };
  }),
);
await mkdir(staging, { recursive: true });
const planFile = join(staging, 'plan.json');
await writeFile(
  planFile,
  JSON.stringify({ schemaVersion: 1, contentRevision, profile, recordings }),
);
if (process.argv.includes('--plan-only')) {
  console.log(`Kế hoạch ${recordings.length} bản đọc: ${planFile}`);
  process.exit(0);
}

await new Promise<void>((resolve, reject) => {
  const child = spawn(
    join(root, '.cache/local-tts/venv/bin/python'),
    [join(root, 'scripts/local-tts/render-library.py'), planFile],
    { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] },
  );
  child.on('error', (error) =>
    reject(
      new Error('Không khởi động được bộ tạo giọng cục bộ.', { cause: error }),
    ),
  );
  child.on('close', (code) =>
    code === 0
      ? resolve()
      : reject(new Error(`Tạo giọng thất bại (${code}); chưa đổi manifest.`)),
  );
});

interface RenderedAudio {
  id: string;
  profileHash: string;
  audioSha256: string;
  bytes: number;
  durationSeconds: number;
  rms: number;
  peak: number;
}
interface PublishedAudio extends RenderedAudio {
  storyId: string;
  sceneId: string;
  kind: 'scene' | 'question' | 'feedback';
  questionId: string | null;
  optionId: string | null;
  status: 'ready';
  file: string;
  transcriptSha256: string;
  performanceSha256: string;
  voices: string[];
  cueIds: string[];
}
function isRenderedAudio(value: unknown): value is RenderedAudio {
  if (typeof value !== 'object' || value === null) return false;
  const fields: Record<string, unknown> = Object.fromEntries(
    Object.entries(value),
  );
  return (
    typeof fields.id === 'string' &&
    typeof fields.profileHash === 'string' &&
    typeof fields.audioSha256 === 'string' &&
    /^[a-f0-9]{64}$/.test(fields.audioSha256) &&
    typeof fields.bytes === 'number' &&
    Number.isInteger(fields.bytes) &&
    fields.bytes > 1000 &&
    typeof fields.durationSeconds === 'number' &&
    Number.isFinite(fields.durationSeconds) &&
    fields.durationSeconds > 0.5 &&
    typeof fields.rms === 'number' &&
    Number.isFinite(fields.rms) &&
    fields.rms > 0.001 &&
    typeof fields.peak === 'number' &&
    Number.isFinite(fields.peak) &&
    fields.peak >= fields.rms &&
    fields.peak < 0.95
  );
}
const report: unknown = JSON.parse(
  await readFile(join(staging, 'report.json'), 'utf8'),
);
if (
  !Array.isArray(report) ||
  !report.every(isRenderedAudio) ||
  report.length !== recordings.length ||
  new Set(report.map((item) => item.id)).size !== recordings.length
)
  throw new Error(
    'Báo cáo âm thanh thiếu hoặc không hợp lệ. Chưa đổi manifest.',
  );

const assets: PublishedAudio[] = [];
for (const item of recordings) {
  const measured = report.find((result) => result.id === item.id);
  const file = await readFile(join(staging, 'files', item.file));
  if (
    !measured ||
    measured.profileHash !== item.profileHash ||
    measured.bytes !== file.length ||
    measured.audioSha256 !== hash(file)
  )
    throw new Error(`Checksum/phiên bản sai: ${item.id}. Chưa đổi manifest.`);
  const destination = join(output, item.file);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(join(staging, 'files', item.file), destination + '.pending');
  await rename(destination + '.pending', destination);
  assets.push({
    id: item.id,
    storyId: item.storyId,
    sceneId: item.sceneId,
    kind: item.kind,
    questionId: item.questionId,
    optionId: item.optionId,
    status: 'ready',
    file: item.file,
    transcriptSha256: item.transcriptSha256,
    performanceSha256: item.performanceSha256,
    profileHash: item.profileHash,
    audioSha256: measured.audioSha256,
    bytes: measured.bytes,
    durationSeconds: measured.durationSeconds,
    rms: measured.rms,
    peak: measured.peak,
    voices: [...new Set(item.turns.map((turn) => turn.voice))],
    cueIds: item.cueIds,
  });
}
const manifest = {
  schemaVersion: 1,
  kind: 'pre-generated-synthetic-speech',
  language: 'vi-VN',
  contentRevision,
  listeningReview: 'pending',
  networkConnectionsBlockedDuringGeneration: true,
  profile,
  assets,
};
const availability = {
  contentRevision,
  stories: stories.map((story) => {
    const files = assets.filter((item) => item.storyId === story.id);
    return {
      id: story.id,
      scenes: story.scenes.length,
      files: files.length,
      bytes: files.reduce((sum, item) => sum + item.bytes, 0),
    };
  }),
};
const availabilityFile = join(
  root,
  'src/content/stories/audio-availability.json',
);
await writeFile(
  availabilityFile + '.pending',
  await format(JSON.stringify(availability), { parser: 'json' }),
);
await writeFile(
  join(output, 'manifest.pending.json'),
  await format(JSON.stringify(manifest), { parser: 'json' }),
);
await rename(availabilityFile + '.pending', availabilityFile);
await rename(
  join(output, 'manifest.pending.json'),
  join(output, 'manifest.json'),
);
console.log(
  `Đã chuyển ${stories.length} truyện, ${assets.length} bản đọc sang ${profile.voice}.`,
);
