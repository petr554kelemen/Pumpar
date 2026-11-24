// Peněžní karty se zůstatkem (rozhodnutí rodiče 2026-11-22): každá stará platební karta má vlastní kód
// `K001`… a počáteční hodnotu v tečkách. Zůstatek se drží po celý herní den, nový den = karty zase plné.
// Hodnotu karty hráč pozná podle její barvy (na štítku je jen QR). Přečerpání zatím ne (nápad rodiče).
// Na začátku kola (po odemčení benzínky a po restartu K000) si hráč karty sám aktivuje – tím si určí strop
// na celé kolo (rozhodnutí rodiče 2026-11-24). Platí jen aktivní karty; během kola se nic nepřidává.
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

/** Výsledek aktivace: nová karta / už aktivní (chyba hráče) / neznámá nebo služební karta. */
export type Aktivace = 'aktivovano' | 'uz_aktivni' | 'neznama';

/** Zůstatky karet během jednoho dne. */
export class Penezenka {
  private zustatky = new Map<string, number>();
  private aktivni = new Set<string>();
  private readonly karty: readonly PenezniKarta[];

  constructor(karty: readonly PenezniKarta[] = PENEZNI_KARTY) {
    this.karty = karty;
    this.naplnVse();
  }

  /** Aktivuje kartu pro toto kolo. Už aktivní karta se nemění (hráč ji pípl podruhé). */
  aktivuj(kod: string): Aktivace {
    const k = kod.trim().toUpperCase();
    if (!this.zustatky.has(k)) return 'neznama';
    if (this.aktivni.has(k)) return 'uz_aktivni';
    this.aktivni.add(k);
    return 'aktivovano';
  }

  jeAktivni(kod: string): boolean {
    return this.aktivni.has(kod.trim().toUpperCase());
  }

  /** Aktivní karty v pořadí sady. */
  aktivniKarty(): PenezniKarta[] {
    return this.karty.filter((k) => this.aktivni.has(k.kod));
  }

  /** Strop kola: součet hodnot aktivních karet. */
  strop(): number {
    return this.aktivniKarty().reduce((s, k) => s + k.hodnota, 0);
  }

  /** Zůstatek aktivní karty; neznámá nebo neaktivní karta = undefined. */
  zustatek(kod: string): number | undefined {
    const k = kod.trim().toUpperCase();
    return this.aktivni.has(k) ? this.zustatky.get(k) : undefined;
  }

  /** Zaplatí z karty. Stačí-li zůstatek, odečte se; jinak se nic nezmění. */
  zaplat(kod: string, cena: number): Platba {
    const k = kod.trim().toUpperCase();
    const zbyva = this.zustatek(k);
    if (zbyva === undefined) return { ok: false, chybi: cena };
    if (zbyva < cena) return { ok: false, chybi: cena - zbyva };
    this.zustatky.set(k, zbyva - cena);
    return { ok: true, zbytek: zbyva - cena };
  }

  /** Nový den / restart: všechny karty zase plné a neaktivní – hráč si je vybere znovu. */
  naplnVse(): void {
    this.zustatky = new Map(this.karty.map((k) => [k.kod, k.hodnota]));
    this.aktivni = new Set();
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
