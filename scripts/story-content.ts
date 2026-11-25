import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
import {
  parseStoryCollection,
  validateStory,
} from '../src/lib/stories/validateStory.ts';
import {
  planStoryAssets,
  renderStoryTranscript,
  speakerName,
} from '../src/lib/stories/production.ts';
import { parseStoryCollections } from '../src/lib/stories/validateCollections.ts';
import playback from '../public/audio/stories/manifest.json' with { type: 'json' };

const root = fileURLToPath(new URL('../', import.meta.url));
const mode = process.argv[2];
if (mode !== '--check' && mode !== '--write')
  throw new Error('Dùng --check để kiểm tra hoặc --write để tái tạo tài liệu.');

const raw: unknown = JSON.parse(
  await readFile(resolve(root, 'src/content/stories/stories.json'), 'utf8'),
);
const stories = parseStoryCollection(raw);
const rawCollections: unknown = JSON.parse(
  await readFile(resolve(root, 'src/content/stories/collections.json'), 'utf8'),
);
const collections = parseStoryCollections(rawCollections, stories);
const contentRevision = createHash('sha256')
  .update(JSON.stringify(stories))
  .digest('hex');
const assets = stories.flatMap(planStoryAssets);
const speechIds = assets
  .filter((asset) => asset.kind === 'speech')
  .map((asset) => asset.id);
const coveredIds = new Set(playback.assets.flatMap((asset) => asset.cueIds));
const speechReady =
  playback.contentRevision === contentRevision &&
  speechIds.every((id) => coveredIds.has(id));
if (speechReady) {
  for (const asset of playback.assets) {
    const file = await readFile(
      resolve(root, 'public/audio/stories', asset.file),
    );
    if (
      file.length !== asset.bytes ||
      createHash('sha256').update(file).digest('hex') !== asset.audioSha256
    )
      throw new Error(`Bản đọc thiếu hoặc sai checksum: ${asset.file}`);
  }
}
for (const field of ['id', 'targetFile'] as const) {
  if (new Set(assets.map((asset) => asset[field])).size !== assets.length)
    throw new Error(`Manifest trùng ${field}.`);
}

const outputs = new Map<
  string,
  { content: string; parser: 'json' | 'markdown' }
>();
outputs.set('src/content/stories/audio-manifest.json', {
  parser: 'json',
  content: JSON.stringify({
    schemaVersion: 1,
    contentRevision,
    status: speechReady ? 'speech-recordings-available' : 'awaiting-production',
    playbackManifest: speechReady ? 'public/audio/stories/manifest.json' : null,
    assets,
  }),
});
const report = stories.map((story) => {
  const result = validateStory(story);
  return {
    id: story.id,
    level: story.level,
    sceneCount: story.scenes.length,
    endingCount: story.scenes.filter((scene) => scene.ending).length,
    paths: result.paths,
  };
});
outputs.set('docs/stories/validation-report.json', {
  parser: 'json',
  content: JSON.stringify({
    schemaVersion: 1,
    contentRevision,
    collectionsRevision: createHash('sha256')
      .update(JSON.stringify(collections))
      .digest('hex'),
    stories: report,
  }),
});

const recordingLines = [
  '# Kịch bản sản xuất giọng đọc',
  '',
  speechReady
    ? `Đã có ${playback.assets.length} bản đọc tổng hợp tiếng Việt trong public/audio/stories/manifest.json, phủ đầy đủ lời kể, câu hỏi và phản hồi. Các cue dưới đây được ghép trong bản đọc cảnh hoặc bản câu hỏi/phản hồi; targetFile của kế hoạch cue riêng vẫn là tên dự kiến, không dùng làm URL phát. Hiệu ứng vẫn chờ sản xuất.`
    : 'Chưa có bản đọc đồng bộ với nội dung hiện tại. Danh sách dưới đây là lời cần sản xuất; đường dẫn trong manifest cue chỉ là tên dự kiến.',
  '',
  'Giữ nguyên dấu tiếng Việt. Đọc rõ, tự nhiên, không diễn giọng theo định kiến. Chọn giọng phù hợp từng nhân vật và giữ ổn định; không cần mỗi nhân vật một giọng tổng hợp khác nhau. Lời kỹ thuật trong mã cue không được đọc thành tiếng.',
  '',
  'Cue lựa chọn/câu hỏi gồm cả các nhãn để người nghe biết mình có thể chọn gì. Chỉ phát phản hồi ứng với lựa chọn thực tế, chỉ đọc kết thúc đã tới. Người dùng được bỏ qua câu hỏi và tự quyết định khi tiếp tục; không tự phát tất cả cue theo thứ tự danh sách.',
  '',
  'Hiệu ứng sản xuất riêng, vào/ra êm, có thể tắt và luôn nhỏ hơn lời kể. Không yêu cầu stereo, định hướng tai nghe hoặc phân biệt âm để hoàn thành truyện. Cần kiểm tra nghe thực tế, quyền sử dụng, file hợp lệ, mức âm và đối chiếu transcript trước khi đưa vào phát.',
  '',
];
for (const story of stories) {
  outputs.set(`docs/stories/transcripts/${story.transcript.file}`, {
    parser: 'markdown',
    content: renderStoryTranscript(story),
  });
  recordingLines.push(`## ${story.title}`, '');
  for (const asset of assets.filter(
    (candidate) => candidate.storyId === story.id,
  )) {
    if (asset.kind !== 'speech') continue;
    recordingLines.push(
      `### ${asset.id}`,
      '',
      `Người đọc: ${speakerName(story, asset.speakerId)}. Vai trò: ${asset.role}.`,
      '',
      asset.text,
      '',
    );
  }
}
outputs.set('docs/stories/recording-script.md', {
  parser: 'markdown',
  content: recordingLines.join('\n'),
});

const errors: string[] = [];
for (const [relative, output] of outputs) {
  const expected = await format(output.content, {
    parser: output.parser,
    singleQuote: true,
    trailingComma: 'all',
  });
  const destination = resolve(root, relative);
  if (mode === '--write') {
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, expected);
  } else {
    const actual = await readFile(destination, 'utf8').catch(() => null);
    if (actual !== expected)
      errors.push(`${relative}: thiếu hoặc đã cũ; chạy npm run content:build.`);
  }
}
const expectedTranscripts = new Set(
  stories.map((story) => story.transcript.file),
);
for (const file of await readdir(resolve(root, 'docs/stories/transcripts'))) {
  if (!expectedTranscripts.has(file))
    errors.push(`Transcript ngoài danh sách: ${file}`);
}
if (errors.length) throw new Error(errors.join('\n'));
const pathCount = report.reduce((sum, story) => sum + story.paths.length, 0);
const speechCount = assets.filter((asset) => asset.kind === 'speech').length;
process.stdout.write(
  `${mode === '--write' ? 'Đã tạo' : 'Đã kiểm tra'}: ${stories.length} truyện, ${pathCount} đường đi, ${speechCount} cue giọng đọc, ${assets.length - speechCount} hiệu ứng chờ sản xuất.\n`,
);
