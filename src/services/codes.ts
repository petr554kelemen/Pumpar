// Rozpoznání herních kódů (formát viz README → Formát kódů).
// Zboží apod.: písmeno + 3 číslice (písmeno = kategorie). SPZ aut: slabika + 2 číslice.
// Rodičovské kódy: 9 + 3 číslice.
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

export type CarOwner = 'hrac' | 'rodic';

/**
 * SPZ aut: slabika + 2 číslice (`LA01`, na obrazovce `LA-01`). Štítky jsou na autíčkách
 * nebo na prošlých platebních kartách. SPZ říká jen „čí auto a kolikáté“ – které autíčko to
 * právě je a jak vypadá ve hře, bude samostatné, měnitelné přiřazení (hráč auta přerozděluje).
 * Původ slabik se v repozitáři neuvádí (osobní údaje).
 */
export const SPZ_SLABIKY = {
  LA: { majitel: 'hrac' },
  KE: { majitel: 'rodic' },
} as const satisfies Record<string, { majitel: CarOwner }>;

export type SpzSlabika = keyof typeof SPZ_SLABIKY;
export const MAX_SPZ_CISLO = 99;

/** Výsledek rozpoznání kódu – podle `druh` TypeScript ví, která pole jsou k dispozici. */
export type CodeInfo =
  | (CategoryCode & { druh: 'zbozi' })
  | (CategoryCode & { druh: 'karta' })
  | (CategoryCode & { druh: 'bankovka'; hodnota: number })
  | { druh: 'auto'; kod: string; slabika: SpzSlabika; cislo: number; spz: string; majitel: CarOwner }
  | { druh: 'vlecka'; kod: string }
  | { druh: 'kanystr'; kod: string }
  | { druh: 'rodic'; kod: string }
  | { druh: 'chyba'; kod: string };

/**
 * Vlečka 🚛 (odtahovka – slovo hráče): přiveze ke stojanu auto s prázdnou nádrží (auta.ts). Vypadá jako SPZ
 * hráče, ale má 3 číslice → „úplně něco jiného“ než auta a neřeší se písmeno kategorie (rozhodnutí rodiče
 * 2026-11-27). Jediný takový kód; jiné `LA` + 3 číslice zůstávají chyba.
 */
export const KOD_VLECKY = 'LA999';

/**
 * Kanystr ⛽🧴 (2026-11-28): u stojanu se naplní (platí se jako benzín), na parkovišti 🅿️ + SPZ se přelije
 * do auta. Nutnost, ne přepych: velké auto, které se nevejde na vlečku, by s prázdnou nádrží nešlo natankovat
 * (přišel na to hráč). Stejný tvar jako vlečka (`LA` + 3 číslice).
 */
export const KOD_KANYSTRU = 'LA888';

const CATEGORY_RE = /^([A-Z])(\d{3})$/;
const SPZ_RE = /^([A-Z]{2})(\d{2})$/;
const ADMIN_RE = /^9\d{3}$/;

function isCategoryLetter(ch: string): ch is CategoryLetter {
  return Object.hasOwn(CATEGORIES, ch);
}

function isSpzSlabika(text: string): text is SpzSlabika {
  return Object.hasOwn(SPZ_SLABIKY, text);
}

function parseSpz(kod: string): CodeInfo | null {
  const m = SPZ_RE.exec(kod);
  const slabika = m?.[1];
  const cisloText = m?.[2];
  if (!slabika || !cisloText) return null;
  if (!isSpzSlabika(slabika)) return { druh: 'chyba', kod };

  const cislo = Number.parseInt(cisloText, 10);
  if (cislo < 1 || cislo > MAX_SPZ_CISLO) return { druh: 'chyba', kod };

  const { majitel } = SPZ_SLABIKY[slabika];
  return { druh: 'auto', kod, slabika, cislo, spz: `${slabika}-${cisloText}`, majitel };
}

export function parseCode(raw: unknown): CodeInfo {
  const kod = String(raw ?? '').trim().toUpperCase();

  if (ADMIN_RE.test(kod)) return { druh: 'rodic', kod };
  if (kod === KOD_VLECKY) return { druh: 'vlecka', kod };
  if (kod === KOD_KANYSTRU) return { druh: 'kanystr', kod };

  const spz = parseSpz(kod);
  if (spz) return spz;

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
