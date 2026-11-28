// Auta se spotřebou (vylepšení 2, nápad rodiče 2026-11-27): hráč pípne svá autíčka (SPZ) do hry, během směny
// jim ubývá benzín – každé má jinou spotřebu. Prázdné auto k stojanu přiveze vlečka (`LA999`, codes.ts),
// nebo se mu na parkovišti přileje z kanystru (`LA888` – naplní se u stojanu jako auto, kapacita `kanystr`).
// Stav se nepočítá po krocích, ale dopočítá se vždy, když je potřeba: stav = stav₀ − spotřeba × čas směny od t₀
// (čas směny = jen úsek běžícího odpočtu, den.ts → msSmenyMezi). Při každé změně (tankování, nové kolo) nový t₀.
// Čísla jsou návrh do dílny ✏️ – mění se jen v TABULKA_AUT. Auta se pamatují v prohlížeči (localStorage).
// Bez závislosti na Phaseru.

import { KOD_KANYSTRU } from './codes.ts';
import { DELKA_SMENY_MS, type HerniDen } from './den.ts';
import type { Uloziste } from './denik.ts';

/** Litry v setinách (jako stojan – pump.ts). */
export const TABULKA_AUT = {
  /** Kapacita nádrže: 10 / 15 / 20 L – stejná čísla jako karty, vejde se do jedné platby. */
  kapacity: [1000, 1500, 2000],
  /**
   * Spotřeba malá / střední / velká = kolik nádrže auto spálí za celou směnu (podíl kapacity, ne litry – jinak
   * by velká nádrž na rezervu nikdy nedojela). Ze startu ⅔ je rezerva (¼) po spálení 5/12 nádrže:
   * ½ → rezerva ke konci směny (17. min), nevyprázdní se; ¾ → rezerva v 11. min, prázdné v 18. min;
   * 1¼ → rezerva v 7. min, prázdné v 11. min. Ladění 2026-11-28: dřív 3 / 5 / 8 L a na rezervu skoro nic nedojelo.
   */
  spotrebyZaSmenu: [0.5, 0.75, 1.25],
  /** Auto přidané během směny má nádrž na ⅔ (na začátku kola rozvrh – viz Garaz.noveKolo). */
  startPodil: 2 / 3,
  /** Pod touto částí kapacity jede auto „na rezervu“ (bliká červeně). */
  rezervaPodil: 1 / 4,
  /** Kanystr: 5 L. Na začátku každého kola je prázdný. */
  kanystr: 500,
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
export const KLIC_KANYSTRU = 'pumpar.kanystr';
/** Verze uložených aut: 2 = spotřeba podílem nádrže (2026-11-28). Bez ní se stará spotřeba převede (jednou). */
export const KLIC_VERZE_AUT = 'pumpar.auta.verze';
const VERZE_AUT = '2';

function vyber<T>(moznosti: readonly T[], rng: () => number): T {
  const v = moznosti[Math.floor(rng() * moznosti.length)];
  if (v === undefined) throw new Error('Prázdný výběr');
  return v;
}

/** Spotřeba v setinách L za minutu směny z podílu nádrže za směnu. */
export function spotrebaAuta(kapacita: number, podilZaSmenu: number): number {
  return Math.round((kapacita * podilZaSmenu) / (DELKA_SMENY_MS / 60_000));
}

/** Auta uložená před laděním 2026-11-28 (spotřeba 15 / 25 / 40) dostanou novou spotřebu ve stejném stupni. */
const STARE_SPOTREBY = [15, 25, 40] as const;

function prevedStarouSpotrebu(a: Auto): Auto {
  const stupen = STARE_SPOTREBY.indexOf(a.spotreba as (typeof STARE_SPOTREBY)[number]);
  const podil = TABULKA_AUT.spotrebyZaSmenu[stupen];
  return podil === undefined ? a : { ...a, spotreba: spotrebaAuta(a.kapacita, podil) };
}

function startovniStav(kapacita: number): number {
  return Math.round(kapacita * TABULKA_AUT.startPodil);
}

/** Za kolik minut směny dojede auto z plné nádrže na rezervu. */
function minutDoRezervyZPlne(a: Auto): number {
  return a.spotreba > 0 ? (a.kapacita * (1 - TABULKA_AUT.rezervaPodil)) / a.spotreba : Number.POSITIVE_INFINITY;
}

function nejvydrzi(auta: readonly Auto[]): Auto {
  return auta.reduce((nej, a) => (minutDoRezervyZPlne(a) > minutDoRezervyZPlne(nej) ? a : nej));
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
  /** Benzín v kanystru (setiny L). */
  private kanystrObsah: number;

  constructor(uloziste: Uloziste | null) {
    this.uloziste = uloziste;
    this.auta = this.nacti();
    if (this.uloziste?.getItem(KLIC_VERZE_AUT) !== VERZE_AUT && this.uloziste?.getItem(KLIC_AUT)) this.uloz();
    this.kanystrObsah = this.nactiKanystr();
  }

  private nactiKanystr(): number {
    const n = Number(this.uloziste?.getItem(KLIC_KANYSTRU) ?? 0);
    return Number.isFinite(n) ? Math.min(TABULKA_AUT.kanystr, Math.max(0, n)) : 0;
  }

  private nacti(): Auto[] {
    try {
      const data: unknown = JSON.parse(this.uloziste?.getItem(KLIC_AUT) ?? '[]');
      if (!Array.isArray(data)) return [];
      const auta = data as Auto[];
      return this.uloziste?.getItem(KLIC_VERZE_AUT) === VERZE_AUT ? auta : auta.map(prevedStarouSpotrebu);
    } catch {
      return [];
    }
  }

  private uloz(): void {
    try {
      this.uloziste?.setItem(KLIC_AUT, JSON.stringify(this.auta));
      this.uloziste?.setItem(KLIC_KANYSTRU, String(this.kanystrObsah));
      this.uloziste?.setItem(KLIC_VERZE_AUT, VERZE_AUT);
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

  /**
   * Kanystr jako „auto“ u stojanu: nádrž = kapacita kanystru, nic nespotřebuje. Snímek stavu – po změně
   * (zaplacení, přelití) zavolat znovu.
   */
  kanystr(): Auto {
    return { spz: KOD_KANYSTRU, kapacita: TABULKA_AUT.kanystr, spotreba: 0, stav0: this.kanystrObsah, t0: 0 };
  }

  /** Auto nebo kanystr podle kódu (u stojanu stojí i kanystr). */
  vozidlo(spz: string): Auto | undefined {
    return spz.trim().toUpperCase() === KOD_KANYSTRU ? this.kanystr() : this.najdi(spz);
  }

  /**
   * Přelít kanystr do auta: kolik se vejde, zbytek zůstane v kanystru. Vrátí přelité setiny,
   * nebo undefined pro neznámé auto.
   */
  prelijKanystr(spz: string, ted: number, d: HerniDen): number | undefined {
    const a = this.najdi(spz);
    if (!a) return undefined;
    const stav = stavNadrzeAuta(a, ted, d);
    const prelito = Math.max(0, Math.min(this.kanystrObsah, a.kapacita - stav));
    a.stav0 = stav + prelito;
    a.t0 = ted;
    this.kanystrObsah -= prelito;
    this.uloz();
    return prelito;
  }

  /** Přidá auto, které hra ještě nezná (náhodná kapacita a spotřeba, nádrž na ⅔). Známé vrátí beze změny. */
  pridej(spz: string, ted: number, rng: () => number = Math.random): { auto: Auto; nove: boolean } {
    const zname = this.najdi(spz);
    if (zname) return { auto: zname, nove: false };
    const kapacita = vyber(TABULKA_AUT.kapacity, rng);
    const auto: Auto = {
      spz: spz.trim().toUpperCase(),
      kapacita,
      spotreba: spotrebaAuta(kapacita, vyber(TABULKA_AUT.spotrebyZaSmenu, rng)),
      stav0: startovniStav(kapacita),
      t0: ted,
    };
    this.auta.push(auto);
    this.uloz();
    return { auto, nove: true };
  }

  /**
   * Nové kolo (odemčení benzínky, restart K000): rozvrh tankování, aby na rezervu nedojelo víc aut naráz
   * (rodič 2026-11-28). Směna se rozdělí na stejná okénka podle počtu aut; každé auto dostane jedno a startovní
   * nádrž tak, aby na rezervu dojelo právě v něm. První okénko = začátek: auto začne se ¼ a jede se tankovat
   * hned. Pozdní okénka berou přednostně auta, která je s plnou nádrží stihnou (malá spotřeba); pořadí je
   * jinak náhodné, každé kolo jiné.
   */
  noveKolo(ted: number, rng: () => number = Math.random): void {
    const krok = DELKA_SMENY_MS / 60_000 / Math.max(1, this.auta.length);
    const zbyva = [...this.auta];
    for (let i = this.auta.length - 1; i >= 0; i--) {
      const cas = i * krok;
      const stihnou = zbyva.filter((a) => minutDoRezervyZPlne(a) >= cas);
      const a = stihnou.length > 0 ? vyber(stihnou, rng) : nejvydrzi(zbyva);
      zbyva.splice(zbyva.indexOf(a), 1);
      a.stav0 = Math.min(a.kapacita, Math.round(a.kapacita * TABULKA_AUT.rezervaPodil + a.spotreba * cas));
      a.t0 = ted;
    }
    this.kanystrObsah = 0;
    this.uloz();
  }

  /** Zaplacený benzín do nádrže auta / kanystru (nejvýš kapacita). Vrátí nový stav, nebo undefined pro neznámé auto. */
  dotankuj(spz: string, setiny: number, ted: number, d: HerniDen): number | undefined {
    if (spz.trim().toUpperCase() === KOD_KANYSTRU) {
      this.kanystrObsah = Math.min(TABULKA_AUT.kanystr, this.kanystrObsah + Math.max(0, setiny));
      this.uloz();
      return this.kanystrObsah;
    }
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
    this.kanystrObsah = 0;
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
