// Jednoduché zvuky generované Web Audio API (bez zvukových souborů).
// Převzato ze staré verze hry. Hlasové fráze budou později ve službě `voice`.

let ctx = null;

function ensureAudio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function tick(freq = 600, duration = 0.05) {
  try {
    const audio = ensureAudio();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch {
    // Zvuk není podmínkou hry – chybu tiše ignorujeme.
  }
}

export function win() {
  [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => setTimeout(() => tick(n, 0.22), i * 110));
}

export function error() {
  tick(180, 0.25);
  setTimeout(() => tick(140, 0.3), 150);
}
