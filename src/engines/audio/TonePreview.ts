/** A real, quiet synthesized preview. No microphone, network, or autoplay. */
export class TonePreview {
  private context: AudioContext | undefined;
  private oscillator: OscillatorNode | undefined;
  private revision = 0;

  constructor(private readonly onEnded: () => void) {}

  async play({
    frequency,
    durationSeconds,
    gain,
  }: {
    frequency: number;
    durationSeconds: number;
    gain: number;
  }) {
    this.stop();
    const revision = this.revision;
    if (typeof AudioContext === 'undefined')
      throw new Error('Web Audio unavailable');
    this.context ??= new AudioContext();
    const context = this.context;
    await context.resume();
    if (revision !== this.revision) return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const now = context.currentTime;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(gain, now + 0.04);
    envelope.gain.setValueAtTime(gain, now + durationSeconds - 0.08);
    envelope.gain.linearRampToValueAtTime(0, now + durationSeconds);
    oscillator.connect(envelope).connect(context.destination);
    this.oscillator = oscillator;
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      if (revision === this.revision) {
        this.oscillator = undefined;
        this.onEnded();
      }
    };
    oscillator.start();
    oscillator.stop(now + durationSeconds);
  }

  stop() {
    this.revision += 1;
    this.oscillator?.stop();
    this.oscillator = undefined;
  }

  async dispose() {
    this.stop();
    const context = this.context;
    this.context = undefined;
    if (context && context.state !== 'closed') await context.close();
  }
}
