// Štítky pro termotiskárnu Phomemo D30 (výška 12 mm, délka 30 nebo 40 mm, 203 dpi).
// Výpočty v bodech tiskárny – čáry kódu musí mít celý počet bodů, jinak se rozmažou.
// Bez závislosti na prohlížeči – testovatelné.

import { moduluCode128B } from './layout.ts';

export const D30_DPI = 203;
export const D30_VYSKA_MM = 12;
export const D30_DELKY_MM = [30, 40] as const;
export type D30Delka = (typeof D30_DELKY_MM)[number];

/** Tichá zóna Code128 v modulech (z každé strany). */
export const CODE128_TICHA_ZONA = 10;

/** QR verze 1 (21 × 21 modulů) – stačí pro naše 4znakové kódy i při opravě chyb H (30 %). */
export const QR_MODULU = 21;

export type D30Varianta =
  | { typ: 'code128'; bodyNaModul: number }
  | { typ: 'qr'; bodyNaModul: number; tichaZona: number };

export const D30_VARIANTY: readonly D30Varianta[] = [
  { typ: 'code128', bodyNaModul: 2 },
  { typ: 'code128', bodyNaModul: 3 },
  { typ: 'qr', bodyNaModul: 3, tichaZona: 2 },
  { typ: 'qr', bodyNaModul: 4, tichaZona: 1 },
];

export function mmNaBody(mm: number): number {
  return Math.round((mm / 25.4) * D30_DPI);
}

export function bodyNaMm(body: number): number {
  return (body / D30_DPI) * 25.4;
}

export interface RozmerStitku {
  sirka: number;
  vyska: number;
}

export function rozmerStitku(delkaMm: D30Delka): RozmerStitku {
  return { sirka: mmNaBody(delkaMm), vyska: mmNaBody(D30_VYSKA_MM) };
}

/** Šířka kódu v bodech včetně tiché zóny. */
export function sirkaKoduBody(kod: string, v: D30Varianta): number {
  return v.typ === 'code128'
    ? (moduluCode128B(kod) + 2 * CODE128_TICHA_ZONA) * v.bodyNaModul
    : (QR_MODULU + 2 * v.tichaZona) * v.bodyNaModul;
}

/** Vejde se varianta na štítek? Code128 se měří na délku, QR na výšku (je čtvercový). */
export function vejdeSe(kod: string, v: D30Varianta, delkaMm: D30Delka): boolean {
  const stitek = rozmerStitku(delkaMm);
  const sirka = sirkaKoduBody(kod, v);
  return v.typ === 'code128' ? sirka <= stitek.sirka : sirka <= stitek.vyska && sirka <= stitek.sirka;
}

export function popisVarianty(v: D30Varianta): string {
  const modulMm = bodyNaMm(v.bodyNaModul).toLocaleString('cs-CZ', { maximumFractionDigits: 3 });
  return v.typ === 'code128'
    ? `Code128 · ${v.bodyNaModul} body/modul (${modulMm} mm)`
    : `QR H · ${v.bodyNaModul} body/modul (${modulMm} mm), tichá zóna ${v.tichaZona}`;
}
