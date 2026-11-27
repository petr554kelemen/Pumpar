// Výsledková listina 🏆 (rozhodnutí rodiče 2026-11-27): jedna společná listina za herní den, žádné dělení
// na LA / KE. Hodnotí se práce pokladního, ne utrácení zákazníka:
// - ⭐ hvězdy za výběr karty – čím víc se muselo přemýšlet, jak kartu dočerpat, tím víc. Rozhoduje zůstatek
//   karty PO platbě. Nejvíc dostane dočerpání karty platbou jedné tečky (hráč sám objevil, že 1 tečku stojí
//   kontrola kola 🛞 a 1 litr benzínu ⛽). Vyčerpaná karta 10 víc než 15, ta víc než 20.
// - ❤️ srdíčka za snahu ve všech částech hry: zboží podle katalogu (drahé zboží rychle čerpá kartu, má se
//   vyplatit), benzín a vzduch podle teček; benzín jen od poloviny předvolby (proti „crknutí“).
// Počty jsou návrh do dílny ✏️ – mění se jen v tabulce PRAVIDLA_BODU (a srdíčka zboží v katalogu).
// Bez závislosti na Phaseru.

import type { Zaznam } from './denik.ts';
import { najdiZbozi } from './katalog.ts';

export const PRAVIDLA_BODU = {
  /** Platba 1 tečkou, po které je karta prázdná – nejlepší tah. */
  docerpaniJednouTeckou: 6,
  /** Karta vyčerpaná na 0 podle hodnoty karty. */
  vycerpanaKarta: { 10: 5, 15: 4, 20: 3 } as Readonly<Record<number, number>>,
  /** Vyčerpaná karta jiné hodnoty (sada je jen 10/15/20 – pojistka). */
  vycerpanaJina: 3,
  /** Zbytek na kartě po platbě: do kolika teček kolik hvězd (vzestupně); víc = 0. */
  zbytek: [
    { nejvys: 2, hvezdy: 2 },
    { nejvys: 5, hvezdy: 1 },
  ] as const,
  /** Benzín a vzduch: 1 ❤️ za každé započaté 3 tečky. */
  teckyNaSrdicko: 3,
} as const;

/** Hvězdy pokladního za jednu platbu podle stavu karty po ní. */
export function hvezdyZaPlatbu(hodnotaKarty: number, zbytek: number, cena: number): number {
  const p = PRAVIDLA_BODU;
  if (zbytek <= 0) {
    if (cena === 1) return p.docerpaniJednouTeckou;
    return p.vycerpanaKarta[hodnotaKarty] ?? p.vycerpanaJina;
  }
  return p.zbytek.find((z) => zbytek <= z.nejvys)?.hvezdy ?? 0;
}

/** Srdíčka za benzín / vzduch podle teček (aspoň 1 za každou placenou práci). */
export function srdickaZaTecky(tecky: number): number {
  return tecky > 0 ? Math.ceil(tecky / PRAVIDLA_BODU.teckyNaSrdicko) : 0;
}

/** Srdíčka za nákup v obchodě: zboží z katalogu + benzín (jen platný, tj. aspoň polovina předvolby). */
export function srdickaZaNakup(zbozi: readonly string[], benzinTecky = 0, benzinPlatny = false): number {
  const zaZbozi = zbozi.reduce((s, kod) => s + (najdiZbozi(kod)?.srdicka ?? 0), 0);
  return zaZbozi + (benzinPlatny ? srdickaZaTecky(benzinTecky) : 0);
}

/** Jeden řádek listiny = jedna platba. */
export interface RadekListiny {
  misto: 'obchod' | 'vzduch';
  /** Co se platilo: emoji zboží, ⛽ za benzín, 🛞 za kola. */
  co: string[];
  karta: string;
  hodnotaKarty: number;
  zbytek: number;
  tecky: number;
  hvezdy: number;
  srdicka: number;
}

export interface VysledkyDne {
  hvezdy: number;
  srdicka: number;
  /** Nejnovější první. */
  radky: RadekListiny[];
}

/** Body za jeden záznam deníku (stejný výpočet pro listinu i odměnu hned po platbě). */
export function radekZeZaznamu(z: Zaznam): RadekListiny {
  // Starší záznamy (před listinou) nemají hodnotu karty a zbytek → 0 ⭐.
  const maKartu = z.hodnotaKarty !== undefined && z.zbytek !== undefined;
  const hodnotaKarty = z.hodnotaKarty ?? 0;
  const zbytek = z.zbytek ?? 0;
  const hvezdy = maKartu ? hvezdyZaPlatbu(hodnotaKarty, zbytek, z.tecky) : 0;
  if (z.druh === 'vzduch') {
    return {
      misto: 'vzduch',
      co: Array.from({ length: Math.max(1, z.kol) }, () => '🛞'),
      karta: z.karta,
      hodnotaKarty,
      zbytek,
      tecky: z.tecky,
      hvezdy,
      srdicka: srdickaZaTecky(z.tecky),
    };
  }
  const co = [...(z.benzin ? ['⛽'] : []), ...z.zbozi.map((kod) => najdiZbozi(kod)?.emoji ?? '❓')];
  return {
    misto: 'obchod',
    co,
    karta: z.karta,
    hodnotaKarty,
    zbytek,
    tecky: z.tecky,
    hvezdy,
    srdicka: srdickaZaNakup(z.zbozi, z.benzinTecky ?? 0, z.benzinPlatny ?? false),
  };
}

/** Listina jednoho herního dne (podle ID dne; záznamy bez ID patří starším dnům). */
export function vysledkyDne(zaznamy: readonly Zaznam[], denId: number): VysledkyDne {
  const radky = zaznamy
    .filter((z) => z.denId === denId)
    .map(radekZeZaznamu)
    .reverse();
  return {
    hvezdy: radky.reduce((s, r) => s + r.hvezdy, 0),
    srdicka: radky.reduce((s, r) => s + r.srdicka, 0),
    radky,
  };
}
