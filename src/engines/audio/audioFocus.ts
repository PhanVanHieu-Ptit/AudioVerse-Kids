const players = new Set<() => void>();

export function registerAudioStop(stop: () => void) {
  players.add(stop);
  return () => {
    players.delete(stop);
  };
}

export function stopAudio(except?: () => void) {
  for (const stop of players) if (stop !== except) stop();
}
