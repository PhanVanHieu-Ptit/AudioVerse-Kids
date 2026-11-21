import type { Route } from '@playwright/test';

/** Real, quiet PCM WAV generated only by tests; no fictitious production asset. */
function toneWav() {
  const sampleRate = 8000;
  const frames = sampleRate * 6;
  const bytes = Buffer.alloc(44 + frames * 2);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(frames * 2, 40);
  for (let i = 0; i < frames; i++)
    bytes.writeInt16LE(
      Math.round(Math.sin((i * 2 * Math.PI * 440) / sampleRate) * 900),
      44 + i * 2,
    );
  return bytes;
}

export async function serveTone(route: Route) {
  const body = toneWav();
  const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range ?? '');
  if (range) {
    const start = Number(range[1]);
    const end = range[2]
      ? Math.min(Number(range[2]), body.length - 1)
      : body.length - 1;
    await route.fulfill({
      status: 206,
      contentType: 'audio/wav',
      headers: {
        'accept-ranges': 'bytes',
        'content-range': `bytes ${start}-${end}/${body.length}`,
      },
      body: body.subarray(start, end + 1),
    });
  } else
    await route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      headers: { 'accept-ranges': 'bytes' },
      body,
    });
}
