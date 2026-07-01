/** Short two-tone chime for in-app schedule alerts (no external asset). */
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.12;
    gain.connect(ctx.destination);

    const playTone = (frequency: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;
      osc.connect(gain);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(880, ctx.currentTime, 0.12);
    playTone(1175, ctx.currentTime + 0.14, 0.16);

    window.setTimeout(() => void ctx.close(), 400);
  } catch {
    // Autoplay policies or missing Web Audio — ignore silently.
  }
}
