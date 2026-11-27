// Výsledková listina 🏆 – kreslení (sdílí scéna 🏆 během dne i konec dne). Jedna listina za herní den.
// Bez textu: nahoře součty ⭐ a ❤️ (číslo + ikony po 5, nad 30 balíčky po 10 – čísla vždy dvakrát),
// pod tím řádky plateb, nejnovější nahoře: barevná karta → co se platilo → zbytek na kartě → ❤️ a ⭐.

import type Phaser from 'phaser';
import type { RadekListiny, VysledkyDne } from '../services/vysledky.ts';
import { BARVA_KARTY } from './kartyPanel.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const EMOJI_PAD = { x: 4, y: 8 };
/** Šířka listiny (vnitřní souřadnice); menší místo = zmenšit celý kontejner. */
export const SIRKA_LISTINY = 1200;
const RADEK = { y0: 190, dy: 76 } as const;

function emoji(s: Phaser.Scene, x: number, y: number, znak: string, velikost: number): Phaser.GameObjects.Text {
  return s.add.text(x, y, znak, { fontSize: `${velikost}px`, padding: EMOJI_PAD }).setOrigin(0.5);
}

function cislo(s: Phaser.Scene, x: number, y: number, n: number, velikost: number, barva = '#ecf0f1'): Phaser.GameObjects.Text {
  return s.add
    .text(x, y, String(n), { fontFamily: FONT, fontSize: `${velikost}px`, fontStyle: 'bold', color: barva })
    .setOrigin(0, 0.5);
}

/**
 * Součet: velká ikona + číslo, vedle ikony ve skupinách po 5 (10 na řádek, nejvýš 3 řádky = 30).
 * Nad 30: balíček „10“ za každou desítku a zbytek jednotlivě.
 */
function soucet(s: Phaser.Scene, x: number, y: number, znak: string, n: number, nazev: string): Phaser.GameObjects.Container {
  const prvky: Phaser.GameObjects.GameObject[] = [emoji(s, 40, 0, znak, 68), cislo(s, 88, 0, n, 64)];
  const gx = 200;
  const d = 27;
  const mezera = 10;
  const pozice = (i: number) => ({
    x: gx + (i % 10) * d + (i % 10 >= 5 ? mezera : 0),
    y: -40 + Math.floor(i / 10) * 30,
  });
  if (n <= 30) {
    for (let i = 0; i < n; i++) {
      const p = pozice(i);
      prvky.push(emoji(s, p.x, p.y + 10, znak, 22));
    }
  } else {
    const desitek = Math.floor(n / 10);
    for (let i = 0; i < desitek; i++) {
      const bx = gx + 20 + (i % 4) * 72;
      const by = -28 + Math.floor(i / 4) * 50;
      prvky.push(
        s.add.rectangle(bx, by, 64, 42, 0x37404c).setStrokeStyle(2, 0xf1c40f),
        s.add.text(bx - 14, by, '10', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#f1c40f' }).setOrigin(0.5),
        emoji(s, bx + 15, by, znak, 18),
      );
    }
    for (let i = 0; i < n % 10; i++) prvky.push(emoji(s, gx + i * d, 46, znak, 20));
  }
  return s.add.container(x, y, prvky).setName(nazev);
}

/** Ikona n-krát (do 6), jinak ikona + číslo. */
function body(s: Phaser.Scene, x: number, znak: string, n: number): Phaser.GameObjects.GameObject[] {
  if (n === 0) return [];
  if (n <= 6) return Array.from({ length: n }, (_, i) => emoji(s, x + i * 30, 0, znak, 26));
  return [emoji(s, x, 0, znak, 30), cislo(s, x + 24, 0, n, 32)];
}

function radek(s: Phaser.Scene, y: number, r: RadekListiny, i: number): Phaser.GameObjects.Container {
  const prvky: Phaser.GameObjects.GameObject[] = [
    s.add.rectangle(SIRKA_LISTINY / 2, 0, SIRKA_LISTINY, RADEK.dy - 8, i % 2 ? 0x252c35 : 0x2c3540),
    // Karta barvou hodnoty + hodnota (pro rodiče a číslice).
    s.add.rectangle(60, 0, 92, 54, BARVA_KARTY[r.hodnotaKarty] ?? 0x555555).setStrokeStyle(3, 0xd4ac0d),
    s.add
      .text(60, 0, r.hodnotaKarty ? String(r.hodnotaKarty) : '?', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#f1c40f' })
      .setOrigin(0.5),
  ];
  // Co se platilo (nejvýš 9 ikon, pak …).
  const co = r.co.length > 9 ? [...r.co.slice(0, 8), '…'] : r.co;
  co.forEach((znak, j) => prvky.push(emoji(s, 140 + j * 44, 0, znak, 34)));
  // Zbytek na kartě po platbě: prázdná karta = výrazná 0 + 🏁.
  const zx = 560;
  prvky.push(emoji(s, zx, 0, '➡️', 28));
  prvky.push(
    s.add.rectangle(zx + 70, 0, 72, 48, BARVA_KARTY[r.hodnotaKarty] ?? 0x555555, r.zbytek === 0 ? 0.35 : 1).setStrokeStyle(2, 0xd4ac0d),
    s.add
      .text(zx + 70, 0, String(r.zbytek), {
        fontFamily: FONT,
        fontSize: r.zbytek === 0 ? '38px' : '28px',
        fontStyle: 'bold',
        color: r.zbytek === 0 ? '#ffffff' : '#f1c40f',
      })
      .setOrigin(0.5),
  );
  if (r.zbytek === 0) prvky.push(emoji(s, zx + 136, 0, '🏁', 32));
  prvky.push(...body(s, 760, '❤️', r.srdicka), ...body(s, 980, '⭐', r.hvezdy));
  return s.add.container(0, y, prvky).setName(`radek_${i + 1}`);
}

/** Celá listina v kontejneru (levý horní roh x, y). `maxRadku` = kolik posledních plateb se vejde. */
export function kresliListinu(s: Phaser.Scene, x: number, y: number, v: VysledkyDne, maxRadku: number): Phaser.GameObjects.Container {
  const prvky: Phaser.GameObjects.GameObject[] = [
    s.add.rectangle(SIRKA_LISTINY / 2, 70, SIRKA_LISTINY, 140, 0x1a2129).setStrokeStyle(3, 0x4a5563),
    soucet(s, 30, 70, '❤️', v.srdicka, 'soucet_srdicka'),
    soucet(s, SIRKA_LISTINY / 2 + 30, 70, '⭐', v.hvezdy, 'soucet_hvezdy'),
  ];
  if (v.radky.length === 0) {
    prvky.push(emoji(s, SIRKA_LISTINY / 2, RADEK.y0 + 120, '🏆', 150).setAlpha(0.25).setName('prazdna_listina'));
  }
  v.radky.slice(0, maxRadku).forEach((r, i) => prvky.push(radek(s, RADEK.y0 + i * RADEK.dy, r, i)));
  return s.add.container(x, y, prvky).setName('listina');
}
