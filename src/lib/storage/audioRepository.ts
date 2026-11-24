import { openDatabase } from './database';
import type { AudioAssetSource, AudioResource } from '@/engines/audio/types';

/** Explicit downloads only. A failed save rejects; never claim offline availability. */
export const audioRepository = {
  async read(resource: AudioResource): Promise<Blob | undefined> {
    const db = await openDatabase();
    try {
      const cached = await db.get('audioAssets', resource.id);
      return cached?.src === resource.src && cached.blob instanceof Blob
        ? cached.blob
        : undefined;
    } finally {
      db.close();
    }
  },
  async download(
    resource: AudioResource,
    signal?: AbortSignal,
    integrity?: { bytes: number; sha256: string },
  ): Promise<void> {
    const response = await fetch(resource.src, signal ? { signal } : {});
    if (!response.ok) throw new Error('Audio download failed');
    const blob = await response.blob();
    if (!blob.size) throw new Error('Empty audio download');
    if (integrity) {
      if (blob.size !== integrity.bytes) throw new Error('Audio size mismatch');
      const digest = await crypto.subtle.digest(
        'SHA-256',
        await blob.arrayBuffer(),
      );
      const actual = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('');
      if (actual !== integrity.sha256)
        throw new Error('Audio checksum mismatch');
    }
    signal?.throwIfAborted();
    const db = await openDatabase();
    try {
      await db.put('audioAssets', { src: resource.src, blob }, resource.id);
    } finally {
      db.close();
    }
  },
  async remove(id: string): Promise<void> {
    const db = await openDatabase();
    try {
      await db.delete('audioAssets', id);
    } finally {
      db.close();
    }
  },
};

export const offlineAudioSource: AudioAssetSource = {
  async resolve(resource, signal) {
    signal.throwIfAborted();
    let cached: Blob | undefined;
    try {
      cached = await audioRepository.read(resource);
    } catch {
      /* Storage denial must not prevent online or bundled playback. */
    }
    signal.throwIfAborted();
    return cached ?? resource.src;
  },
};
