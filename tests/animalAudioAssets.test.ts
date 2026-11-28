import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import manifest from '../public/audio/animals/sources.json';
import { animalSounds } from '../src/content/gameSounds';
import { activityGames } from '../src/content/activityGames';

it('ships a nonempty, credited recording for every animal with consistent audible levels', () => {
  expect(manifest.assets).toHaveLength(8);
  for (const sound of animalSounds) {
    const asset = manifest.assets.find((entry) => entry.id === sound.id)!;
    expect(asset).toBeDefined();
    expect(sound.audioSrc).toBe(`/audio/animals/${asset.file}`);
    const data = readFileSync(resolve('public/audio/animals', asset.file));
    expect(data.length).toBe(asset.bytes);
    expect(data.length).toBeGreaterThan(10000);
    expect(createHash('sha256').update(data).digest('hex')).toBe(asset.sha256);
    expect(['CC0-1.0', 'Public domain']).toContain(asset.license);
    expect(asset.author.length).toBeGreaterThan(0);
    expect(asset.sourceUrl).toMatch(/^https:\/\//);
    expect(asset.durationSeconds).toBeGreaterThan(1);
    expect(asset.durationSeconds).toBeLessThan(5);
    expect(asset.rms).toBeGreaterThan(0.06);
    expect(asset.peak).toBeLessThan(0.9);
    expect(sound.notes).toEqual([]);
  }
});

it('uses real recordings at every level without changing their pitch or duration', () => {
  const game = activityGames.find(
    (entry) => entry.id === 'doan-tieng-dong-vat',
  )!;
  expect(game.instructions).toContain('tiếng kêu thật');
  for (const level of [1, 2, 3]) {
    const challenges = game.challenges.filter((entry) => entry.level === level);
    expect(challenges).toHaveLength(8);
    const animals = new Set<string>();
    for (const challenge of challenges) {
      if (challenge.mode !== 'choice') throw new Error('Expected choice');
      const original = animalSounds.find(
        (entry) => entry.id === challenge.answer,
      )!;
      expect(challenge.sound).toEqual(original);
      expect(challenge.prompt).not.toContain('mô phỏng');
      expect(challenge.options).toHaveLength(level + 1);
      animals.add(challenge.answer);
    }
    expect(animals.size).toBe(8);
  }
});
