// Katalog zboží: kód → výrobek. Jediný zdroj pravdy pro obchod (později i tiskové visačky).
// Ceny v tečkách jsou jen ve hře (na visačky se netisknou) – zatím převzaté ze staré verze.
// Výrobky a ceny jsou návrh do dílny ✏️ (README → Pravidla jsou zákon). Bez závislosti na Phaseru.

import { parseCode } from './codes.ts';

export interface Zbozi {
  kod: string;
  nazev: string;
  emoji: string;
  /** Cena v tečkách. */
  cena: number;
}

/** Zboží ze staré verze (stejné ceny), kódy podle kategorií (README → Formát kódů). */
export const ZBOZI: readonly Zbozi[] = [
  { kod: 'S001', nazev: 'sušenka', emoji: '🍪', cena: 2 },
  { kod: 'S002', nazev: 'zmrzlina', emoji: '🍦', cena: 3 },
  { kod: 'P001', nazev: 'káva', emoji: '☕', cena: 4 },
  { kod: 'P002', nazev: 'pitíčko', emoji: '🧃', cena: 5 },
  { kod: 'J001', nazev: 'párek v rohlíku', emoji: '🌭', cena: 6 },
  { kod: 'A001', nazev: 'autíčko', emoji: '🏎️', cena: 9 },
];

/** Útrata v košíku se drží do 30 teček (README → Rozsah do 30). */
export const MAX_UTRATA = 30;

export function najdiZbozi(kod: string): Zbozi | undefined {
  const k = kod.trim().toUpperCase();
  return ZBOZI.find((z) => z.kod === k);
}

/** Útrata = součet cen zboží + případný benzín na účtu (tečky). */
export function utrata(kosik: readonly Zbozi[], benzin = 0): number {
  return kosik.reduce((soucet, z) => soucet + z.cena, benzin);
}

/** Vejde se výrobek ještě do košíku (útrata včetně benzínu do 30)? */
export function vejdeSe(kosik: readonly Zbozi[], z: Zbozi, benzin = 0): boolean {
  return utrata(kosik, benzin) + z.cena <= MAX_UTRATA;
}

/** Kontrola katalogu: každý kód je platné zboží podle Formátu kódů a kódy se neopakují. */
export function chybyKatalogu(): string[] {
  const chyby: string[] = [];
  const videne = new Set<string>();
  for (const z of ZBOZI) {
    if (parseCode(z.kod).druh !== 'zbozi') chyby.push(`${z.kod}: není kód zboží`);
    if (videne.has(z.kod)) chyby.push(`${z.kod}: duplicitní`);
    if (z.cena < 1 || z.cena > MAX_UTRATA) chyby.push(`${z.kod}: cena mimo 1–${MAX_UTRATA}`);
    videne.add(z.kod);
  }
  return chyby;
}
