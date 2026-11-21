/** Optional Web Audio gain graph. Constructing the engine never opens a context. */
export class AudioMixer {
  private context: AudioContext | undefined;
  private failed = false;
  private disposed = false;
  private nodes = new Map<
    HTMLAudioElement,
    { source: MediaElementAudioSourceNode; gain: GainNode }
  >();

  async unlock() {
    if (this.disposed || this.failed || typeof AudioContext === 'undefined')
      return;
    let context: AudioContext | undefined;
    try {
      context = this.context ??= new AudioContext();
      if (context.state !== 'running') await context.resume();
    } catch {
      if (this.context === context && !this.disposed) this.failed = true;
    }
  }

  volume(element: HTMLAudioElement, volume: number) {
    const context = this.context;
    let nodes = this.nodes.get(element);
    if (!nodes && context?.state === 'running' && !this.failed) {
      try {
        const gain = context.createGain();
        const source = context.createMediaElementSource(element);
        source.connect(gain).connect(context.destination);
        nodes = { source, gain };
        this.nodes.set(element, nodes);
      } catch {
        /* HTMLAudioElement remains the fallback for unsupported graphs. */
      }
    }
    if (nodes) {
      element.volume = 1;
      nodes.gain.gain.value = volume;
    } else {
      element.volume = volume;
    }
  }

  requiresReload(element: HTMLAudioElement) {
    // A media element cannot be detached from its Web Audio source once created.
    // Recreate it for HTML fallback if a previously connected context cannot run.
    return (
      this.nodes.has(element) &&
      (this.failed || this.context?.state !== 'running')
    );
  }

  release(element: HTMLAudioElement) {
    const nodes = this.nodes.get(element);
    nodes?.source.disconnect();
    nodes?.gain.disconnect();
    this.nodes.delete(element);
  }

  async reset() {
    for (const element of this.nodes.keys()) this.release(element);
    const context = this.context;
    this.context = undefined;
    this.failed = false;
    if (context && context.state !== 'closed') await context.close();
  }

  async dispose() {
    this.disposed = true;
    await this.reset();
  }
}
