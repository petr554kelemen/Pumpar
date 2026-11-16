// Vykreslení štítku D30 do obrázku 1:1 v bodech tiskárny (čistě černobíle, bez šedi).

import JsBarcode from 'jsbarcode';
import { create as qrCreate } from 'qrcode';
import {
  CODE128_TICHA_ZONA,
  type D30Delka,
  type D30Varianta,
  rozmerStitku,
  sirkaKoduBody,
  vejdeSe,
} from './d30.ts';

const FONT = 'Arial, Helvetica, sans-serif';

/** Text pod/vedle kódu: SPZ s pomlčkou (LA01 → LA-01), jinak kód beze změny. */
export function textStitku(kod: string): string {
  return /^[A-Z]{2}\d{2}$/.test(kod) ? `${kod.slice(0, 2)}-${kod.slice(2)}` : kod;
}

function kontext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D není k dispozici');
  return ctx;
}

/** Převede obrázek na čistě černobílý (termotisk jinak šedé okraje písma rozmaže). */
function naCernobile(ctx: CanvasRenderingContext2D, sirka: number, vyska: number): void {
  const data = ctx.getImageData(0, 0, sirka, vyska);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const jas = ((px[i] ?? 255) + (px[i + 1] ?? 255) + (px[i + 2] ?? 255)) / 3;
    const v = jas < 140 ? 0 : 255;
    px[i] = px[i + 1] = px[i + 2] = v;
    px[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
}

/** Vrací šířku vykreslených čar (bez tiché zóny) v bodech. */
function kresliCode128(ctx: CanvasRenderingContext2D, kod: string, bodyNaModul: number, sirka: number): number {
  const vyskaCar = 58;
  const tmp = document.createElement('canvas');
  JsBarcode(tmp, kod, {
    format: 'CODE128',
    width: bodyNaModul,
    height: vyskaCar,
    margin: 0,
    displayValue: false,
    background: '#ffffff',
    lineColor: '#000000',
  });
  const x = Math.floor((sirka - tmp.width) / 2);
  ctx.drawImage(tmp, x, 4);

  ctx.fillStyle = '#000';
  ctx.font = `bold 28px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(textStitku(kod), sirka / 2, 92);
  return tmp.width;
}

function kresliQr(
  ctx: CanvasRenderingContext2D,
  kod: string,
  bodyNaModul: number,
  tichaZona: number,
  stitek: { sirka: number; vyska: number },
): void {
  const qr = qrCreate(kod, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  const strana = (n + 2 * tichaZona) * bodyNaModul;
  const x0 = 2 + tichaZona * bodyNaModul;
  const y0 = Math.floor((stitek.vyska - strana) / 2) + tichaZona * bodyNaModul;

  ctx.fillStyle = '#000';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.modules.get(r, c)) ctx.fillRect(x0 + c * bodyNaModul, y0 + r * bodyNaModul, bodyNaModul, bodyNaModul);
    }
  }

  // Text vpravo od QR, co největší.
  const zbyva = stitek.sirka - (2 + strana);
  const text = textStitku(kod);
  let velikost = 56;
  ctx.font = `bold ${velikost}px ${FONT}`;
  while (velikost > 16 && ctx.measureText(text).width > zbyva - 8) {
    velikost -= 2;
    ctx.font = `bold ${velikost}px ${FONT}`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 2 + strana + zbyva / 2, stitek.vyska / 2 + 2);
}

/** Vykreslí štítek, nebo vrátí null, pokud se varianta na štítek nevejde. */
export function vykresliStitekD30(kod: string, v: D30Varianta, delkaMm: D30Delka): HTMLCanvasElement | null {
  if (!vejdeSe(kod, v, delkaMm)) return null;

  const stitek = rozmerStitku(delkaMm);
  const canvas = document.createElement('canvas');
  canvas.width = stitek.sirka;
  canvas.height = stitek.vyska;
  const ctx = kontext(canvas);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, stitek.sirka, stitek.vyska);

  if (v.typ === 'code128') {
    const sirkaCar = kresliCode128(ctx, kod, v.bodyNaModul, stitek.sirka);
    // Kontrola: JsBarcode musí dát stejnou šířku, jakou počítáme (jinak nesedí výpočet „vejde se“).
    const ocekavano = sirkaKoduBody(kod, v) - 2 * CODE128_TICHA_ZONA * v.bodyNaModul;
    if (sirkaCar !== ocekavano) console.warn(`Code128 ${kod}: šířka ${sirkaCar} b, očekáváno ${ocekavano} b`);
  } else {
    kresliQr(ctx, kod, v.bodyNaModul, v.tichaZona, stitek);
  }

  naCernobile(ctx, stitek.sirka, stitek.vyska);
  return canvas;
}

export function stahniPng(canvas: HTMLCanvasElement, nazev: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nazev;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
}
