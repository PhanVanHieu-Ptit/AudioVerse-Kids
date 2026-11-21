// Run on macOS with the installed Vietnamese Linh voice and FFmpeg.
// Generated assets are committed; application builds never need these tools.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import {
  voiceMessages,
  activityVoiceMessage,
} from '../src/content/voiceMessages.ts';
import { games } from '../src/content/games.ts';

const output = fileURLToPath(
  new URL('../public/audio/guidance/', import.meta.url),
);
const temporary = mkdtempSync(join(tmpdir(), 'audioverse-voice-'));
const messages = [
  ...Object.values(voiceMessages),
  ...games.map(activityVoiceMessage),
];
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const assets = [];
mkdirSync(output, { recursive: true });
try {
  for (const message of messages) {
    if (!message.audioSrc) throw new Error(`Missing audioSrc: ${message.id}`);
    const file = basename(message.audioSrc);
    const speech = join(temporary, `${file}.aiff`);
    const destination = join(output, file);
    execFileSync('/usr/bin/say', [
      '-v',
      'Linh',
      '-r',
      '155',
      '-o',
      speech,
      message.text,
    ]);
    execFileSync('ffmpeg', [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      speech,
      '-af',
      'loudnorm=I=-20:TP=-3:LRA=7',
      '-ar',
      '22050',
      '-ac',
      '1',
      '-codec:a',
      'libmp3lame',
      '-b:a',
      '64k',
      '-map_metadata',
      '-1',
      destination,
    ]);
    const durationSeconds = Number(
      execFileSync(
        'ffprobe',
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          destination,
        ],
        { encoding: 'utf8' },
      ).trim(),
    );
    const pcm = execFileSync(
      'ffmpeg',
      [
        '-v',
        'error',
        '-i',
        destination,
        '-f',
        's16le',
        '-ac',
        '1',
        '-ar',
        '16000',
        '-',
      ],
      { maxBuffer: 8 * 1024 * 1024 },
    );
    let energy = 0;
    for (let offset = 0; offset < pcm.length; offset += 2)
      energy += (pcm.readInt16LE(offset) / 32768) ** 2;
    const rms = Math.sqrt(energy / (pcm.length / 2));
    if (
      !Number.isFinite(durationSeconds) ||
      durationSeconds < 0.5 ||
      rms < 0.001
    )
      throw new Error(`Empty or silent output: ${message.id}`);
    const audio = readFileSync(destination);
    assets.push({
      id: message.id,
      file,
      transcript: message.text,
      transcriptSha256: sha256(message.text),
      audioSha256: sha256(audio),
      bytes: audio.length,
      durationSeconds,
      rms,
    });
  }
  writeFileSync(
    join(output, 'manifest.json'),
    JSON.stringify(
      {
        language: 'vi-VN',
        kind: 'pre-generated-synthetic-speech',
        voice: 'macOS Linh',
        wordsPerMinute: 155,
        normalization: 'FFmpeg loudnorm I=-20:TP=-3:LRA=7',
        assets,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
