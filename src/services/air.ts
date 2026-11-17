// Dofukování kol (nápad hráče). Bez závislosti na Phaseru – testovatelné.
// Dofouknutí kola podle barvy disku (modrý 2, červený 3, zelený 5 teček), kontrola plného kola = 1 tečka.
// Obě kola na jedné nápravě mají stejný disk; přední a zadní náprava se mohou lišit.
// Platí se jednou kartou; malá karta je odmítnuta, přeplatek zůstane na kartě.

export const DISKY = ['modry', 'cerveny', 'zeleny'] as const;
export type Disk = (typeof DISKY)[number];
export const CENA_DISKU: Readonly<Record<Disk, number>> = { modry: 2, cerveny: 3, zeleny: 5 };
export const CENA_KONTROLY = 1;

/** Kola auta: L/P = levé/pravé, P/Z = přední/zadní. Vozík (nápad hráče): LV/PV = levé/pravé kolo vozíku. */
export const KOLA_AUTA = ['LP', 'PP', 'LZ', 'PZ'] as const;
export const KOLA_VOZIKU = ['LV', 'PV'] as const;
export type KoloId = (typeof KOLA_AUTA)[number] | (typeof KOLA_VOZIKU)[number];

/** Pravděpodobnost, že auto přijede s vozíkem. */
export const SANCE_VOZIKU = 0.35;

export interface StavKola {
  podhustene: boolean;
  disk: Disk;
}

export interface NoveAuto {
  vozik: boolean;
  kola: { id: KoloId; stav: StavKola }[];
}

/**
 * Nové auto: disky po nápravách (přední / zadní / vozík), u každého kola náhodně podhuštění.
 * Občas s vozíkem (jedna náprava). Vždy aspoň jedno podhuštěné kolo.
 */
export function noveAuto(rng: () => number = Math.random): NoveAuto {
  const disk = (): Disk => DISKY[Math.floor(rng() * DISKY.length)] ?? 'cerveny';
  const naprava = (ids: readonly KoloId[]): NoveAuto['kola'] => {
    const d = disk();
    return ids.map((id) => ({ id, stav: { podhustene: rng() < 0.5, disk: d } }));
  };
  const kola = [...naprava(['LP', 'PP']), ...naprava(['LZ', 'PZ'])];
  const vozik = rng() < SANCE_VOZIKU;
  if (vozik) kola.push(...naprava(KOLA_VOZIKU));
  if (!kola.some((k) => k.stav.podhustene)) {
    const k = kola[Math.floor(rng() * kola.length)] ?? kola[0];
    if (k) k.stav.podhustene = true;
  }
  return { vozik, kola };
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
