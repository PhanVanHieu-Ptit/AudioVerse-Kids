import { webcrypto } from 'node:crypto';
import { deleteDB } from 'idb';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { audioRepository } from '../src/lib/storage/audioRepository';
import { openDatabase } from '../src/lib/storage/database';
import { audioResource } from '../src/test/audioTestUtils';

beforeEach(async () => {
  await deleteDB('audioverse-kids');
});
describe('downloaded story audio integrity', () => {
  it('rejects wrong bytes or checksums before saving a downloaded story asset', async () => {
    vi.stubGlobal('crypto', webcrypto);
    try {
      const blob = await new Response(new Uint8Array([1, 2, 3])).blob();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        blob: async () => blob,
      } as Response);
      const resource = audioResource('verified');
      await expect(
        audioRepository.download(resource, undefined, {
          bytes: 4,
          sha256: 'wrong',
        }),
      ).rejects.toThrow('size');
      await expect(
        audioRepository.download(resource, undefined, {
          bytes: 3,
          sha256: 'wrong',
        }),
      ).rejects.toThrow('checksum');
      expect(await audioRepository.read(resource)).toBeUndefined();
      await audioRepository.download(resource, undefined, {
        bytes: 3,
        sha256:
          '039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81',
      });
      const db = await openDatabase();
      expect((await db.get('audioAssets', resource.id))?.src).toBe(
        resource.src,
      );
      db.close();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
