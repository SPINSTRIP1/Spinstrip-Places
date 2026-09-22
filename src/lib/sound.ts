/**
 * WebAudio sound kit for the Smart Menu games: a gentle lo-fi loop plus a
 * couple of one-shot cues. Everything is synthesised, so no audio assets
 * ship with the app. Ported from the waiter prototype.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(freq: number, start: number, dur: number, gain = 0.18) {
  const ac = audio();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}

/** Small win — two rising chimes. */
export function playWin() {
  try {
    beep(880, 0, 0.18);
    beep(1174, 0.16, 0.22);
    beep(1568, 0.32, 0.26);
  } catch {
    /* audio unavailable */
  }
  navigator.vibrate?.([80, 60, 80]);
}

/** Call once from a user gesture so later sounds are allowed. */
export function unlockAudio() {
  try {
    audio();
  } catch {
    /* noop */
  }
}

// ---------- Background music (games) ----------

const CHORDS: number[][] = [
  [261.63, 329.63, 392.0], // C
  [220.0, 261.63, 329.63], // Am
  [174.61, 220.0, 261.63], // F
  [196.0, 246.94, 293.66], // G
];
const MELODY = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.0];

const MUTE_KEY = "spinstrip:music-muted";

let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicGain: GainNode | null = null;
let musicStep = 0;
let musicWanted = false;
let musicMuted: boolean | null = null;

function readMuted() {
  if (musicMuted === null) {
    try {
      musicMuted = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      musicMuted = false;
    }
  }
  return musicMuted;
}

export function isMusicMuted() {
  return readMuted();
}

function scheduleBar() {
  if (!musicWanted || readMuted()) return;
  const ac = audio();
  if (!musicGain) {
    musicGain = ac.createGain();
    musicGain.gain.value = 0.05;
    musicGain.connect(ac.destination);
  }
  const bar = musicStep % 4;
  const beat = musicStep % 8;

  if (beat === 0) {
    for (const f of CHORDS[bar]) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "triangle";
      osc.frequency.value = f / 2;
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(0.5, ac.currentTime + 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 3.6);
      osc.connect(g).connect(musicGain);
      osc.start();
      osc.stop(ac.currentTime + 3.8);
    }
  }
  if (beat % 2 === 0) {
    const f = MELODY[(musicStep / 2) % MELODY.length | 0];
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(0.35, ac.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
    osc.connect(g).connect(musicGain);
    osc.start();
    osc.stop(ac.currentTime + 1);
  }
  musicStep += 1;
}

/** Start the loop (call from a user gesture). Respects mute. */
export function startMusic() {
  musicWanted = true;
  if (musicTimer) return;
  try {
    unlockAudio();
    musicTimer = setInterval(scheduleBar, 450);
    scheduleBar();
  } catch {
    /* noop */
  }
}

export function stopMusic() {
  musicWanted = false;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function toggleMusicMuted(): boolean {
  musicMuted = !readMuted();
  try {
    localStorage.setItem(MUTE_KEY, musicMuted ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (musicGain) musicGain.gain.value = musicMuted ? 0 : 0.05;
  return musicMuted;
}
