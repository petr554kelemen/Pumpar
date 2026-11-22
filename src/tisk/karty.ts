// Sada štítků na staré platební karty (rozhodnutí rodiče 2026-11-18, karty nachystal hráč).
// Každá peněžní karta má vlastní kód `K001`… (rozhodnutí 2026-11-22) – hra jí drží zůstatek po celý herní den.
// Hodnoty karet jsou v `services/penezenka.ts` (jediný zdroj pravdy). Hráč bere vždy největší → většina karet
// jsou desítky. Na štítku je jen QR – hodnotu hráč pozná podle barvy karty (rozhodnutí rodiče).
// Bez závislosti na prohlížeči.

import { SLUZEBNI_KARTA } from '../services/lock.ts';
import { PENEZNI_KARTY } from '../services/penezenka.ts';

export type StitekKarty =
  | { druh: 'penize'; kod: string; hodnota: number }
  | { druh: 'sluzebni'; kod: string };

/** 1 × 20, 2 × 15, 4 × 10 a služební karta na odemykání benzínky = 8 karet (2 × 4 na A4). */
export const SADA_KARET: readonly StitekKarty[] = [
  ...PENEZNI_KARTY.map(({ kod, hodnota }): StitekKarty => ({ druh: 'penize', kod, hodnota })),
  { druh: 'sluzebni', kod: SLUZEBNI_KARTA },
];

/** Velikost QR na kartě (mm) – místa je dost, větší QR se snáz čte i telefonem. */
export const QR_KARTA_MM = 20;
