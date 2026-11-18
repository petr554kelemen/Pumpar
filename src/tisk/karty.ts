// Sada štítků na staré platební karty (rozhodnutí rodiče 2026-11-18, karty nachystal hráč).
// Karty s pevnou hodnotou = kód bankovky `Bxxx` (číslo = hodnota v tečkách) – ve hře fungují hned
// (vzduch: pípnutí vybere kartu se stejnou hodnotou). Hráč bere vždy největší → většina karet jsou desítky.
// Karty se zůstatkem (`K001`…) přijdou později s peněženkou (fáze 5). Bez závislosti na prohlížeči.

import { SLUZEBNI_KARTA } from '../services/lock.ts';

export type StitekKarty =
  | { druh: 'penize'; kod: string; hodnota: number }
  | { druh: 'sluzebni'; kod: string };

function penize(hodnota: number): StitekKarty {
  return { druh: 'penize', kod: `B${String(hodnota).padStart(3, '0')}`, hodnota };
}

/** 1 × 20, 2 × 15, 4 × 10 a služební karta na odemykání benzínky = 8 karet (2 × 4 na A4). */
export const SADA_KARET: readonly StitekKarty[] = [
  penize(20),
  penize(15),
  penize(15),
  penize(10),
  penize(10),
  penize(10),
  penize(10),
  { druh: 'sluzebni', kod: SLUZEBNI_KARTA },
];

/** Velikost QR na kartě (mm) – místa je dost, větší QR se snáz čte i telefonem. */
export const QR_KARTA_MM = 20;
