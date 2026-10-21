let ctx: AudioContext | null = null;

/** Must be called from a user gesture so browsers allow playback later. */
export function primeAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* audio unavailable */
  }
}

/** Two soft sine tones; rising for "back to focus", falling for "break". */
export function chime(kind: "focus-done" | "break-done"): void {
  if (!ctx) return;
  const freqs = kind === "focus-done" ? [784, 523] : [523, 784];
  const t0 = ctx.currentTime;
  freqs.forEach((f, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    const start = t0 + i * 0.22;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(start);
    osc.stop(start + 0.95);
  });
}
