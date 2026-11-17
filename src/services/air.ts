// Dofukování kol (nápad hráče). Bez závislosti na Phaseru – testovatelné.
// Dofouknutí kola = 3 tečky, kontrola plného kola = 1 tečka. Platí se jednou kartou; malá karta je odmítnuta,
// přeplatek zůstane na kartě.

export const CENA_KOLA = 3;
export const CENA_KONTROLY = 1;

/** Kola: L/P = levé/pravé, P/Z = přední/zadní. */
export const KOLA = ['LP', 'PP', 'LZ', 'PZ'] as const;
export type KoloId = (typeof KOLA)[number];

/** Nové auto: u každého kola náhodně, zda je podhuštěné (true). Vždy aspoň jedno podhuštěné. */
export function noveAuto(rng: () => number = Math.random): Record<KoloId, boolean> {
  const auto: Record<KoloId, boolean> = { LP: rng() < 0.5, PP: rng() < 0.5, LZ: rng() < 0.5, PZ: rng() < 0.5 };
  if (!KOLA.some((k) => auto[k])) {
    const k = KOLA[Math.floor(rng() * KOLA.length)] ?? 'LP';
    auto[k] = true;
  }
  return auto;
}

export function cenaKol(pocet: number): number {
  return pocet * CENA_KOLA;
}

/** Cena za jedno vybrané kolo: podhuštěné se dofoukne (3), plné se jen zkontroluje (1). */
export function cenaKola(podhustene: boolean): number {
  return podhustene ? CENA_KOLA : CENA_KONTROLY;
}

/** Cena za všechna vybraná kola (true = podhuštěné). */
export function cenaVyberu(vybrana: readonly boolean[]): number {
  return vybrana.reduce((soucet, podhustene) => soucet + cenaKola(podhustene), 0);
}

export type Platba = { ok: true; zbytek: number } | { ok: false; chybi: number };

export function zaplat(hodnotaKarty: number, cena: number): Platba {
  return hodnotaKarty >= cena ? { ok: true, zbytek: hodnotaKarty - cena } : { ok: false, chybi: cena - hodnotaKarty };
}
