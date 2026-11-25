// All sound is synthesized with WebAudio: no audio files, no network.
// One job: short, immediate feedback blips for chopping, sizzling, serving,
// and mistakes. The context starts on the first user gesture.

let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

export function ensureAudio() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch { /* audio stays off */ }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol || 0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noiseBurst(dur, vol, filterFreq) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq || 1800;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol || 0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
}

export const sfx = {
  click() { tone(660, 0.06, 'triangle', 0.08); },
  grab() { tone(440, 0.07, 'triangle', 0.1, 620); },
  chop() { noiseBurst(0.07, 0.22, 900); tone(180, 0.05, 'square', 0.06); },
  chopped() { tone(520, 0.09, 'triangle', 0.12, 780); },
  sizzle() { noiseBurst(0.16, 0.1, 5200); },
  sear() { tone(880, 0.12, 'sine', 0.12, 1320); },
  place() { tone(330, 0.08, 'triangle', 0.11, 440); },
  ready() { tone(784, 0.1, 'sine', 0.12); setTimeout(() => tone(1046, 0.16, 'sine', 0.12), 90); },
  serve() { tone(659, 0.1, 'sine', 0.13); setTimeout(() => tone(880, 0.1, 'sine', 0.13), 90); setTimeout(() => tone(1318, 0.2, 'sine', 0.13), 180); },
  bad() { tone(220, 0.18, 'sawtooth', 0.08, 140); },
  expire() { tone(392, 0.14, 'sine', 0.1, 262); },
  tick() { tone(980, 0.04, 'square', 0.05); },
  dayEnd() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sine', 0.12), i * 110)); },
};
