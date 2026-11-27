// Auta se spotřebou (vylepšení 2, nápad rodiče 2026-11-27): hráč pípne svá autíčka (SPZ) do hry, během směny
// jim ubývá benzín – každé má jinou spotřebu. Prázdné auto k stojanu přiveze vlečka (`LA999`, codes.ts).
// Stav se nepočítá po krocích, ale dopočítá se vždy, když je potřeba: stav = stav₀ − spotřeba × čas směny od t₀
// (čas směny = jen úsek běžícího odpočtu, den.ts → msSmenyMezi). Při každé změně (tankování, nové kolo) nový t₀.
// Čísla jsou návrh do dílny ✏️ – mění se jen v TABULKA_AUT. Auta se pamatují v prohlížeči (localStorage).
// Bez závislosti na Phaseru.

import type { HerniDen } from './den.ts';
import type { Uloziste } from './denik.ts';

/** Litry v setinách (jako stojan – pump.ts). */
export const TABULKA_AUT = {
  /** Kapacita nádrže: 10 / 15 / 20 L – stejná čísla jako karty, vejde se do jedné platby. */
  kapacity: [1000, 1500, 2000],
  /**
   * Spotřeba v setinách litru za minutu směny: malá / střední / velká = za celou směnu (20 min) cca 3 / 5 / 8 L.
   * Tempo: hráč nemá jen tankovat – musí stihnout i vzduch a nákup (ladění = TODO v Dev_notes).
   */
  spotreby: [15, 25, 40],
  /** Na začátku každého kola (odemčení, restart K000) má každé auto nádrž na ⅔. */
  startPodil: 2 / 3,
  /** Pod touto částí kapacity jede auto „na rezervu“ (bliká červeně). */
  rezervaPodil: 1 / 4,
} as const;

export interface Auto {
  /** Kód SPZ bez pomlčky (`LA01`). */
  spz: string;
  /** Kapacita nádrže (setiny L). */
  kapacita: number;
  /** Spotřeba (setiny L za minutu směny). */
  spotreba: number;
  /** Stav nádrže v okamžiku t0 (setiny L). */
  stav0: number;
  /** Skutečný čas (ms) posledního nastavení stavu. */
  t0: number;
}

export const KLIC_AUT = 'pumpar.auta';

function vyber<T>(moznosti: readonly T[], rng: () => number): T {
  const v = moznosti[Math.floor(rng() * moznosti.length)];
  if (v === undefined) throw new Error('Prázdný výběr');
  return v;
}

function startovniStav(kapacita: number): number {
  return Math.round(kapacita * TABULKA_AUT.startPodil);
}

/** Stav nádrže v čase `ted` (setiny L, nikdy pod 0) – dopočet za čas směny od t0. */
export function stavNadrzeAuta(a: Auto, ted: number, d: HerniDen): number {
  const spaleno = (a.spotreba * d.msSmenyMezi(a.t0, ted)) / 60_000;
  return Math.max(0, Math.round(a.stav0 - spaleno));
}

export function jePrazdne(a: Auto, ted: number, d: HerniDen): boolean {
  return stavNadrzeAuta(a, ted, d) <= 0;
}

export function naRezerve(a: Auto, ted: number, d: HerniDen): boolean {
  const s = stavNadrzeAuta(a, ted, d);
  return s > 0 && s < a.kapacita * TABULKA_AUT.rezervaPodil;
}

/** Celé litry na obrazovce: zaokrouhleno nahoru, aby 0 znamenala opravdu prázdnou nádrž. */
export function litryNaObrazovce(setiny: number): number {
  return Math.ceil(setiny / 100);
}

/** Auta hráče (a rodiče) v pořadí přidání. */
export class Garaz {
  private readonly uloziste: Uloziste | null;
  private auta: Auto[];

  constructor(uloziste: Uloziste | null) {
    this.uloziste = uloziste;
    this.auta = this.nacti();
  }

  private nacti(): Auto[] {
    try {
      const data: unknown = JSON.parse(this.uloziste?.getItem(KLIC_AUT) ?? '[]');
      return Array.isArray(data) ? (data as Auto[]) : [];
    } catch {
      return [];
    }
  }

  private uloz(): void {
    try {
      this.uloziste?.setItem(KLIC_AUT, JSON.stringify(this.auta));
    } catch {
      // Plné / zakázané úložiště – hra jede dál, jen si auta nezapamatuje.
    }
  }

  vsechna(): readonly Auto[] {
    return this.auta;
  }

  najdi(spz: string): Auto | undefined {
    const k = spz.trim().toUpperCase();
    return this.auta.find((a) => a.spz === k);
  }

  /** Přidá auto, které hra ještě nezná (náhodná kapacita a spotřeba, nádrž na ⅔). Známé vrátí beze změny. */
  pridej(spz: string, ted: number, rng: () => number = Math.random): { auto: Auto; nove: boolean } {
    const zname = this.najdi(spz);
    if (zname) return { auto: zname, nove: false };
    const kapacita = vyber(TABULKA_AUT.kapacity, rng);
    const auto: Auto = {
      spz: spz.trim().toUpperCase(),
      kapacita,
      spotreba: vyber(TABULKA_AUT.spotreby, rng),
      stav0: startovniStav(kapacita),
      t0: ted,
    };
    this.auta.push(auto);
    this.uloz();
    return { auto, nove: true };
  }

  /** Nové kolo (odemčení benzínky, restart K000): všechny nádrže zpět na ⅔. */
  noveKolo(ted: number): void {
    for (const a of this.auta) {
      a.stav0 = startovniStav(a.kapacita);
      a.t0 = ted;
    }
    this.uloz();
  }

  /** Zaplacený benzín do nádrže auta (nejvýš kapacita). Vrátí nový stav, nebo undefined pro neznámé auto. */
  dotankuj(spz: string, setiny: number, ted: number, d: HerniDen): number | undefined {
    const a = this.najdi(spz);
    if (!a) return undefined;
    a.stav0 = Math.min(a.kapacita, stavNadrzeAuta(a, ted, d) + Math.max(0, setiny));
    a.t0 = ted;
    this.uloz();
    return a.stav0;
  }

  /** Rodič: smazat všechna auta (nové rozdělení). */
  smazVse(): void {
    this.auta = [];
    this.uloz();
  }
}

function prohlizecoveUloziste(): Uloziste | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

const aktualni = new Garaz(prohlizecoveUloziste());

/** Garáž sdílená všemi scénami. */
export function garaz(): Garaz {
  return aktualni;
}
