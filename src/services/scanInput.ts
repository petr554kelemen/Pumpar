// Sjednocený vstup kódů. Zatím zdroj: klávesnice / USB čtečka (HID = „píše“ kód a Enter).
// Později přibude kamera a telefon – všechny zdroje vysílají stejnou událost 'scan'.
// Bez závislosti na Phaseru.

import { parseCode } from './codes.ts';
import type { EventBus, GameEvents } from './eventBus.ts';

// Čtečka posílá klávesy podle US rozložení. S českým rozložením přijdou místo číslic
// znaky z horní řady: + ě š č ř ž ý á í é  →  1 2 3 4 5 6 7 8 9 0.
const CZ_DIGITS: Readonly<Record<string, string>> = {
  '+': '1', 'ě': '2', 'š': '3', 'č': '4', 'ř': '5',
  'ž': '6', 'ý': '7', 'á': '8', 'í': '9', 'é': '0',
};

/** Převede jeden znak z klávesnice na znak kódu (A–Z, 0–9), jinak null. */
export function normalizeChar(key: string): string | null {
  if (key.length !== 1) return null;
  const lower = key.toLowerCase();
  const digit = CZ_DIGITS[lower];
  if (digit) return digit;
  if (/^[a-z0-9]$/.test(lower)) return lower.toUpperCase();
  return null;
}

/**
 * Sjednotí klávesu z události: numerická klávesnice se bere podle fyzické klávesy (code),
 * takže číslice projdou i při vypnutém NumLocku (jinak přijde „Insert“, „End“…)
 * a „+“ z numerické klávesnice se nezamění za „1“ z českého rozložení.
 */
export function keyFromEvent(key: string, code: string): string {
  const numpad = /^Numpad(\d)$/.exec(code);
  if (numpad?.[1]) return numpad[1];
  if (code === 'NumpadEnter') return 'Enter';
  if (code.startsWith('Numpad')) return '';
  return key;
}

export interface KeyCollectorOptions {
  /** Pauza mezi znaky (ms), po které se rozepsaný kód zahodí. */
  resetMs?: number;
  /** Stejný kód do této doby (ms) se ignoruje – čtečka občas přečte dvakrát. */
  repeatMs?: number;
  maxLength?: number;
}

/**
 * Skládá kód z jednotlivých stisků. Bez vazby na prohlížeč – testovatelné.
 * Enter kód ukončí, Escape ho smaže.
 */
export class KeyCollector {
  private readonly resetMs: number;
  private readonly repeatMs: number;
  private readonly maxLength: number;
  private buffer = '';
  private lastKeyAt = 0;
  private lastCode: string | null = null;
  private lastCodeAt = 0;

  constructor({ resetMs = 3000, repeatMs = 1500, maxLength = 16 }: KeyCollectorOptions = {}) {
    this.resetMs = resetMs;
    this.repeatMs = repeatMs;
    this.maxLength = maxLength;
  }

  /** Rozepsaný (zatím neukončený) kód – pro ladicí zobrazení. */
  get rozepsano(): string {
    return this.buffer;
  }

  /** Zpracuje klávesu. Vrátí hotový kód, nebo null. */
  push(key: string, now: number): string | null {
    if (this.buffer && now - this.lastKeyAt > this.resetMs) this.buffer = '';
    this.lastKeyAt = now;

    if (key === 'Enter') {
      const code = this.buffer;
      this.buffer = '';
      if (!code) return null;
      if (code === this.lastCode && now - this.lastCodeAt < this.repeatMs) return null;
      this.lastCode = code;
      this.lastCodeAt = now;
      return code;
    }

    if (key === 'Escape') {
      this.buffer = '';
      return null;
    }

    const ch = normalizeChar(key);
    if (ch && this.buffer.length < this.maxLength) this.buffer += ch;
    return null;
  }
}

/** Připojí klávesnici k oknu a posílá 'scan' do sběrnice. Vrací funkci pro odpojení. */
export function startKeyboardScanner(bus: EventBus<GameEvents>, target: Window = window): () => void {
  const collector = new KeyCollector();

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    const kod = collector.push(keyFromEvent(e.key, e.code), performance.now());
    bus.emit('psani', { text: collector.rozepsano });
    if (kod) bus.emit('scan', { kod, info: parseCode(kod), zdroj: 'klavesnice' });
  };

  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}
