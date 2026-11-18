// Rozvržení visaček na listu A4 (vše v milimetrech). Bez závislosti na prohlížeči – testovatelné.
//
// Visačky se tisknou těsně vedle sebe (jeden střih oddělí dvě visačky). Mezery pro zatavení
// fólie vzniknou až v laminovací kapse A5: vystřižené visačky se do ní rozloží 3 × 3 s rozestupy.

export const LIST = { sirka: 210, vyska: 297 } as const;

export const VISACKA = {
  sirka: 38,
  vyska: 52,
  /** Volné místo nahoře na dírku z děrovačky. */
  zonaDirky: 10,
} as const;

/**
 * Štítek na starou platební kartu: jen QR + drobný kód pro rodiče (hodnotu hráč pozná podle barvy karty).
 * Tiskne se 2 × 4 na A4 těsně vedle sebe (jeden střih oddělí dva štítky).
 */
export const KARTA_STITEK = { sirka: 26, vyska: 29 } as const;

/** Minimální okraj listu – většina tiskáren netiskne úplně ke kraji. */
export const MIN_OKRAJ = 6;

export interface Pozice {
  x: number;
  y: number;
}

export interface Rozlozeni {
  sloupce: number;
  radky: number;
  /** Levý horní roh každé visačky, po řádcích. */
  pozice: Pozice[];
  okrajX: number;
  okrajY: number;
}

export function rozlozeniListu(
  sloupce = 5,
  radky = 5,
  rozmer: { sirka: number; vyska: number } = VISACKA,
): Rozlozeni {
  const sirkaMrizky = sloupce * rozmer.sirka;
  const vyskaMrizky = radky * rozmer.vyska;
  const okrajX = (LIST.sirka - sirkaMrizky) / 2;
  const okrajY = (LIST.vyska - vyskaMrizky) / 2;

  if (okrajX < MIN_OKRAJ || okrajY < MIN_OKRAJ) {
    throw new Error(`Visačky se na list nevejdou (okraj ${okrajX} × ${okrajY} mm, minimum ${MIN_OKRAJ} mm).`);
  }

  const pozice: Pozice[] = [];
  for (let r = 0; r < radky; r++) {
    for (let s = 0; s < sloupce; s++) {
      pozice.push({ x: okrajX + s * rozmer.sirka, y: okrajY + r * rozmer.vyska });
    }
  }
  return { sloupce, radky, pozice, okrajX, okrajY };
}

/** Code128: počet modulů pro kód sady B (start + znaky + kontrolní + stop). Tichá zóna se počítá zvlášť. */
export function moduluCode128B(kod: string): number {
  return 11 + kod.length * 11 + 11 + 13;
}

/** Celková šířka Code128 včetně tiché zóny (10 modulů z každé strany) v mm. */
export function sirkaCode128Mm(kod: string, modulMm: number): number {
  return (moduluCode128B(kod) + 20) * modulMm;
}
