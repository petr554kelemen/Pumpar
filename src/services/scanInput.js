// Sjednocený vstup kódů. Zatím zdroj: klávesnice / USB čtečka (HID = „píše“ kód a Enter).
// Později přibude kamera a telefon – všechny zdroje vysílají stejnou událost 'scan'.
// Bez závislosti na Phaseru.
//
// Vysílá do sběrnice:
//   'scan' { kod, info, zdroj }  – info = výsledek parseCode() (druh: zbozi/bankovka/karta/rodic/chyba)

import { parseCode } from './codes.js';

// Čtečka posílá klávesy podle US rozložení. S českým rozložením přijdou místo číslic
// znaky z horní řady: + ě š č ř ž ý á í é  →  1 2 3 4 5 6 7 8 9 0.
const CZ_DIGITS = {
  '+': '1', 'ě': '2', 'š': '3', 'č': '4', 'ř': '5',
  'ž': '6', 'ý': '7', 'á': '8', 'í': '9', 'é': '0',
};

/** Převede jeden znak z klávesnice na znak kódu (A–Z, 0–9), jinak null. */
export function normalizeChar(key) {
  if (typeof key !== 'string' || key.length !== 1) return null;
  const lower = key.toLowerCase();
  if (CZ_DIGITS[lower]) return CZ_DIGITS[lower];
  if (/^[a-z0-9]$/.test(lower)) return lower.toUpperCase();
  return null;
}

/**
 * Skládá kód z jednotlivých stisků. Bez vazby na prohlížeč – testovatelné.
 * - Enter kód ukončí.
 * - Pauza delší než `resetMs` mezi znaky začne kód znovu (zbytky náhodného mačkání).
 * - Stejný kód do `repeatMs` se ignoruje (čtečka občas přečte dvakrát).
 */
export class KeyCollector {
  constructor({ resetMs = 3000, repeatMs = 1500, maxLength = 16 } = {}) {
    this.resetMs = resetMs;
    this.repeatMs = repeatMs;
    this.maxLength = maxLength;
    this.buffer = '';
    this.lastKeyAt = 0;
    this.lastCode = null;
    this.lastCodeAt = 0;
  }

  /** Zpracuje klávesu. Vrátí hotový kód (string), nebo null. */
  push(key, now) {
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
export function startKeyboardScanner(bus, target = window) {
  const collector = new KeyCollector();

  const onKeyDown = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const kod = collector.push(e.key, performance.now());
    if (kod) bus.emit('scan', { kod, info: parseCode(kod), zdroj: 'klavesnice' });
  };

  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}
