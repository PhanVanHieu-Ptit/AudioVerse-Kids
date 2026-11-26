// Offline neural speech production; application builds use the committed MP3s.
import { execFileSync } from 'node:child_process';
import { log } from 'node:console';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { format } from 'prettier';
import {
  voiceMessages,
  activityVoiceMessage,
} from '../src/content/voiceMessages.ts';
import { games } from '../src/content/games.ts';
import { activityGames } from '../src/content/activityGames.ts';
import { gameVoiceMessages } from '../src/content/gameVoiceMessages.ts';
import { musicVoiceMessages } from '../src/content/musicVoiceMessages.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public/audio/guidance');
const staging = join(root, '.cache/local-tts/guidance-render');
const profile = JSON.parse(
  readFileSync(join(root, 'scripts/local-tts/guidance-profile.json'), 'utf8'),
);
const messages = [
  ...Object.values(voiceMessages),
  ...games.map(activityVoiceMessage),
  ...activityGames.map(activityVoiceMessage),
  ...Object.values(gameVoiceMessages),
  ...Object.values(musicVoiceMessages),
  ...activityGames.flatMap((game) =>
    game.challenges
      .filter((challenge) => challenge.audioSrc)
      .map((challenge) => ({
        id: challenge.id,
        text: challenge.prompt,
        audioSrc: challenge.audioSrc,
      })),
  ),
];
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
let previous = [];
try {
  previous = JSON.parse(
    readFileSync(join(output, 'manifest.json'), 'utf8'),
  ).assets;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
mkdirSync(output, { recursive: true });
mkdirSync(staging, { recursive: true });
const assets = [];
const recordings = [];
for (const message of messages) {
  if (!message.audioSrc) throw new Error(`Missing audioSrc: ${message.id}`);
  const file = basename(message.audioSrc);
  // Read conversational sentences separately, with a short breath between them.
  const sentences = message.text.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) ?? [];
  const turns = sentences.map((sentence, index) => ({
    cueId: `${message.id}:${index}`,
    text: sentence.trim(),
    voice: profile.voice,
    tempo: 1,
    pauseMs: index === sentences.length - 1 ? 120 : profile.sentencePauseMs,
  }));
  if (!turns.length) throw new Error(`Empty transcript: ${message.id}`);
  const profileHash = sha256(JSON.stringify({ profile, turns }));
  const cached = previous.find(
    (asset) =>
      asset.id === message.id &&
      asset.file === file &&
      asset.transcriptSha256 === sha256(message.text) &&
      (asset.profileHash
        ? asset.profileHash === profileHash
        : file.endsWith('.v1.mp3')),
  );
  if (cached) {
    try {
      if (sha256(readFileSync(join(output, file))) === cached.audioSha256) {
        assets.push({ ...cached, voice: cached.voice ?? 'macOS Linh' });
        continue;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  recordings.push({ id: message.id, file, profileHash, turns });
}
if (recordings.length) {
  const plan = join(staging, 'plan.json');
  writeFileSync(plan, JSON.stringify({ profile, recordings }, null, 2) + '\n');
  execFileSync(
    join(root, '.cache/local-tts/venv/bin/python'),
    [join(root, 'scripts/local-tts/render-library.py'), plan],
    { cwd: root, stdio: 'inherit' },
  );
  const report = JSON.parse(readFileSync(join(staging, 'report.json'), 'utf8'));
  for (const item of recordings) {
    const result = report.find(
      (candidate) =>
        candidate.id === item.id && candidate.profileHash === item.profileHash,
    );
    if (!result) throw new Error(`Missing generated recording: ${item.id}`);
    const audio = readFileSync(join(staging, 'files', item.file));
    if (
      audio.length !== result.bytes ||
      sha256(audio) !== result.audioSha256 ||
      audio.length > 2 * 1024 * 1024 ||
      result.durationSeconds < 0.5 ||
      result.rms < 0.001
    )
      throw new Error(`Invalid generated recording: ${item.id}`);
    const message = messages.find((candidate) => candidate.id === item.id);
    const pending = join(output, item.file + '.pending');
    writeFileSync(pending, audio);
    renameSync(pending, join(output, item.file));
    assets.push({
      ...result,
      file: item.file,
      voice: profile.voice,
      transcript: message.text,
      transcriptSha256: sha256(message.text),
      listeningReview: 'pending',
    });
  }
}
// Publish only when every requested recording has passed integrity checks.
const pendingManifest = join(output, 'manifest.json.pending');
writeFileSync(
  pendingManifest,
  await format(
    JSON.stringify({
      language: 'vi-VN',
      kind: 'pre-generated-synthetic-speech',
      voices: [...new Set(assets.map((asset) => asset.voice))],
      profile,
      normalization: `FFmpeg ${profile.normalization}`,
      assets: messages.map((message) =>
        assets.find((asset) => asset.id === message.id),
      ),
    }),
    { parser: 'json' },
  ),
);
renameSync(pendingManifest, join(output, 'manifest.json'));
// Replaced versioned files must not remain in the PWA's precache bundle.
const currentFiles = new Set(assets.map((asset) => asset.file));
for (const asset of previous) {
  if (!currentFiles.has(asset.file) && basename(asset.file) === asset.file)
    rmSync(join(output, asset.file), { force: true });
}
log(
  `Đã kiểm tra ${assets.length} bản đọc; tạo mới ${recordings.length} bản bằng ${profile.voice}.`,
);
