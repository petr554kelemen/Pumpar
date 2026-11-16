// Rozpoznání herních kódů (formát viz README → Formát kódů).
// Písmeno + 3 číslice; písmeno = kategorie. Rodičovské kódy: 9 + 3 číslice.
// Bez závislosti na Phaseru.

export const MAX_BANKNOTE = 30;

export type CategoryKind = 'zbozi' | 'bankovka' | 'karta';

export interface Category {
  nazev: string;
  emoji: string;
  druh: CategoryKind;
}

/**
 * Písmena kategorií. Zakázaná: s diakritikou, X (= chyba), Y a Z (prohazování na CZ klávesnici).
 * `satisfies` hlídá tvar záznamů a zároveň zachová přesná písmena v typu `CategoryLetter`.
 */
export const CATEGORIES = {
  P: { nazev: 'pití', emoji: '🧃', druh: 'zbozi' },
  S: { nazev: 'sladkosti', emoji: '🍭', druh: 'zbozi' },
  J: { nazev: 'jídlo', emoji: '🌭', druh: 'zbozi' },
  H: { nazev: 'hračky', emoji: '🧸', druh: 'zbozi' },
  A: { nazev: 'autíčka', emoji: '🏎️', druh: 'zbozi' },
  M: { nazev: 'myčka', emoji: '🧽', druh: 'zbozi' },
  V: { nazev: 'vysavač', emoji: '🧹', druh: 'zbozi' },
  N: { nazev: 'Natural', emoji: '⛽', druh: 'zbozi' },
  D: { nazev: 'Diesel', emoji: '⛽', druh: 'zbozi' },
  B: { nazev: 'bankovka', emoji: '💵', druh: 'bankovka' },
  K: { nazev: 'karta', emoji: '💳', druh: 'karta' },
} as const satisfies Record<string, Category>;

export type CategoryLetter = keyof typeof CATEGORIES;

interface CategoryCode {
  kod: string;
  pismeno: CategoryLetter;
  cislo: number;
  kategorie: Category;
}

/** Výsledek rozpoznání kódu – podle `druh` TypeScript ví, která pole jsou k dispozici. */
export type CodeInfo =
  | (CategoryCode & { druh: 'zbozi' })
  | (CategoryCode & { druh: 'karta' })
  | (CategoryCode & { druh: 'bankovka'; hodnota: number })
  | { druh: 'rodic'; kod: string }
  | { druh: 'chyba'; kod: string };

const CATEGORY_RE = /^([A-Z])(\d{3})$/;
const ADMIN_RE = /^9\d{3}$/;

function isCategoryLetter(ch: string): ch is CategoryLetter {
  return Object.hasOwn(CATEGORIES, ch);
}

export function parseCode(raw: unknown): CodeInfo {
  const kod = String(raw ?? '').trim().toUpperCase();

  if (ADMIN_RE.test(kod)) return { druh: 'rodic', kod };

  const m = CATEGORY_RE.exec(kod);
  const pismeno = m?.[1];
  const cisloText = m?.[2];
  if (!pismeno || !cisloText || !isCategoryLetter(pismeno)) return { druh: 'chyba', kod };

  const kategorie: Category = CATEGORIES[pismeno];
  const cislo = Number.parseInt(cisloText, 10);
  const zaklad = { kod, pismeno, cislo, kategorie };

  switch (kategorie.druh) {
    case 'bankovka':
      if (cislo < 1 || cislo > MAX_BANKNOTE) return { druh: 'chyba', kod };
      return { ...zaklad, druh: 'bankovka', hodnota: cislo };
    case 'karta':
      return { ...zaklad, druh: 'karta' };
    case 'zbozi':
      return { ...zaklad, druh: 'zbozi' };
  }
}
