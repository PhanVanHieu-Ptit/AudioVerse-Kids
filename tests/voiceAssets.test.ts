import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../public/audio/guidance/manifest.json';
import { games } from '../src/content/games';
import { activityGames } from '../src/content/activityGames';
import { gameVoiceMessages } from '../src/content/gameVoiceMessages';
import { musicVoiceMessages } from '../src/content/musicVoiceMessages';
import {
  activityVoiceMessage,
  voiceMessages,
} from '../src/content/voiceMessages';

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
const sha256 = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex');

describe('bundled Vietnamese speech integrity', () => {
  it('uses the neural voice for games and music instructions and feedback', () => {
    const updated = [
      ...games.map(activityVoiceMessage),
      ...activityGames.map(activityVoiceMessage),
      ...Object.values(gameVoiceMessages),
      ...Object.values(musicVoiceMessages),
      voiceMessages.correct,
      voiceMessages.incorrect,
      voiceMessages.completed,
    ];
    for (const message of updated) {
      const asset = manifest.assets.find(
        (candidate) => candidate.id === message.id,
      );
      expect(asset).toMatchObject({ voice: 'Thanh Bình' });
      expect(asset).toHaveProperty('profileHash');
      expect(message.audioSrc).toMatch(/\.v2\.mp3$/);
    }
  });
  it.each(messages)(
    'ships the matching, nonempty speech file for $id',
    (message) => {
      const asset = manifest.assets.find(
        (candidate) => candidate.id === message.id,
      );
      expect(asset).toBeDefined();
      expect(message.audioSrc).toBeDefined();
      if (!asset || !message.audioSrc)
        throw new Error(`Missing recording: ${message.id}`);
      expect(message.audioSrc).toBe(`/audio/guidance/${asset.file}`);
      const audio = readFileSync(resolve('public/audio/guidance', asset.file));
      expect(audio.length).toBe(asset.bytes);
      expect(audio.length).toBeGreaterThan(1000);
      expect(audio.length).toBeLessThan(2 * 1024 * 1024);
      expect(sha256(audio)).toBe(asset.audioSha256);
      expect(asset.transcript).toBe(message.text);
      expect(asset.transcriptSha256).toBe(sha256(message.text));
      expect(asset.durationSeconds).toBeGreaterThan(0.5);
      expect(asset.rms).toBeGreaterThan(0.001);
    },
  );
});
