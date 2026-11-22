// Peněžní karty se zůstatkem (rozhodnutí rodiče 2026-11-22): každá stará platební karta má vlastní kód
// `K001`… a počáteční hodnotu v tečkách. Zůstatek se drží po celý herní den, nový den = karty zase plné.
// Hodnotu karty hráč pozná podle její barvy (na štítku je jen QR). Přečerpání zatím ne (nápad rodiče).
// Bez závislosti na Phaseru.

import { den } from './den.ts';

export interface PenezniKarta {
  kod: string;
  /** Počáteční hodnota (tečky) na začátku každého dne. */
  hodnota: number;
}

/** Sada karet: 1 × 20, 2 × 15, 4 × 10 (hráč bere vždy největší → většina jsou desítky). */
export const PENEZNI_KARTY: readonly PenezniKarta[] = [
  { kod: 'K001', hodnota: 20 },
  { kod: 'K002', hodnota: 15 },
  { kod: 'K003', hodnota: 15 },
  { kod: 'K004', hodnota: 10 },
  { kod: 'K005', hodnota: 10 },
  { kod: 'K006', hodnota: 10 },
  { kod: 'K007', hodnota: 10 },
];

export function najdiKartu(kod: string): PenezniKarta | undefined {
  const k = kod.trim().toUpperCase();
  return PENEZNI_KARTY.find((karta) => karta.kod === k);
}

export type Platba = { ok: true; zbytek: number } | { ok: false; chybi: number };

/** Zůstatky karet během jednoho dne. */
export class Penezenka {
  private zustatky = new Map<string, number>();
  private readonly karty: readonly PenezniKarta[];

  constructor(karty: readonly PenezniKarta[] = PENEZNI_KARTY) {
    this.karty = karty;
    this.naplnVse();
  }

  /** Zůstatek karty; neznámá karta = undefined. */
  zustatek(kod: string): number | undefined {
    return this.zustatky.get(kod.trim().toUpperCase());
  }

  /** Zaplatí z karty. Stačí-li zůstatek, odečte se; jinak se nic nezmění. */
  zaplat(kod: string, cena: number): Platba {
    const k = kod.trim().toUpperCase();
    const zbyva = this.zustatky.get(k);
    if (zbyva === undefined) return { ok: false, chybi: cena };
    if (zbyva < cena) return { ok: false, chybi: cena - zbyva };
    this.zustatky.set(k, zbyva - cena);
    return { ok: true, zbytek: zbyva - cena };
  }

  /** Nový den: všechny karty zase plné. */
  naplnVse(): void {
    this.zustatky = new Map(this.karty.map((k) => [k.kod, k.hodnota]));
  }
}

// Peněženka patří k hernímu dni – sdílí ji všechny scény; s novým dnem se karty naplní.
const aktualni = new Penezenka();
let proDen = den().cislo;

export function penezenka(): Penezenka {
  const cislo = den().cislo;
  if (cislo !== proDen) {
    aktualni.naplnVse();
    proDen = cislo;
  }
  return aktualni;
}
