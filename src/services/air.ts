// Dofukování kol (nápad hráče). Bez závislosti na Phaseru – testovatelné.
// Dofouknutí kola podle barvy disku (modrý 2, červený 3, zelený 5 teček), kontrola plného kola = 1 tečka.
// Obě kola na jedné nápravě mají stejný disk; přední a zadní náprava se mohou lišit.
// Platí se jednou kartou; malá karta je odmítnuta, přeplatek zůstane na kartě.

export const DISKY = ['modry', 'cerveny', 'zeleny'] as const;
export type Disk = (typeof DISKY)[number];
export const CENA_DISKU: Readonly<Record<Disk, number>> = { modry: 2, cerveny: 3, zeleny: 5 };
export const CENA_KONTROLY = 1;

/** Kola: L/P = levé/pravé, P/Z = přední/zadní. */
export const KOLA = ['LP', 'PP', 'LZ', 'PZ'] as const;
export type KoloId = (typeof KOLA)[number];

export interface StavKola {
  podhustene: boolean;
  disk: Disk;
}

/** Nové auto: disky po nápravách (přední / zadní), u každého kola náhodně podhuštění. Vždy aspoň jedno podhuštěné. */
export function noveAuto(rng: () => number = Math.random): Record<KoloId, StavKola> {
  const disk = (): Disk => DISKY[Math.floor(rng() * DISKY.length)] ?? 'cerveny';
  const predni = disk();
  const zadni = disk();
  const auto: Record<KoloId, StavKola> = {
    LP: { podhustene: rng() < 0.5, disk: predni },
    PP: { podhustene: rng() < 0.5, disk: predni },
    LZ: { podhustene: rng() < 0.5, disk: zadni },
    PZ: { podhustene: rng() < 0.5, disk: zadni },
  };
  if (!KOLA.some((k) => auto[k].podhustene)) {
    const k = KOLA[Math.floor(rng() * KOLA.length)] ?? 'LP';
    auto[k].podhustene = true;
  }
  return auto;
}

/** Cena za jedno vybrané kolo: podhuštěné se dofoukne (podle disku), plné se jen zkontroluje (1). */
export function cenaKola(kolo: StavKola): number {
  return kolo.podhustene ? CENA_DISKU[kolo.disk] : CENA_KONTROLY;
}

/** Cena za všechna vybraná kola. */
export function cenaVyberu(vybrana: readonly StavKola[]): number {
  return vybrana.reduce((soucet, kolo) => soucet + cenaKola(kolo), 0);
}

export type Platba = { ok: true; zbytek: number } | { ok: false; chybi: number };

export function zaplat(hodnotaKarty: number, cena: number): Platba {
  return hodnotaKarty >= cena ? { ok: true, zbytek: hodnotaKarty - cena } : { ok: false, chybi: cena - hodnotaKarty };
}
