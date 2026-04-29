/**
 * useNotificationSound
 * Plays a short pleasant chime using the Web Audio API.
 * No external audio files needed — synthesized in-browser.
 */
export function useNotificationSound() {
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Two-note ascending chime: C5 → E5
      const notes = [523.25, 659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.value = freq;

        const start = ctx.currentTime + i * 0.18;
        const end = start + 0.35;

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        osc.start(start);
        osc.stop(end);
      });
    } catch {
      // Silently ignore if AudioContext is unavailable
    }
  };

  return { playChime };
}
