// Stránka pro tisk štítků na staré platební karty (jen pro rodiče). Sada v karty.ts.
// Jen QR s opravou chyb H + drobný kód pod ním (aby rodič věděl, na kterou kartu který štítek patří).
// Hodnotu karty hráč pozná podle její barvy.

import { toString as qrSvg } from 'qrcode';
import { QR_KARTA_MM, SADA_KARET, type StitekKarty } from './karty.ts';
import { KARTA_STITEK, rozlozeniListu } from './layout.ts';

async function vytvorStitek(k: StitekKarty, x: number, y: number): Promise<HTMLElement> {
  const el = document.createElement('div');
  el.className = 'karta-stitek';
  Object.assign(el.style, { left: `${x}mm`, top: `${y}mm`, width: `${KARTA_STITEK.sirka}mm`, height: `${KARTA_STITEK.vyska}mm` });

  const qr = document.createElement('div');
  qr.className = 'qr';
  qr.style.width = qr.style.height = `${QR_KARTA_MM}mm`;
  qr.innerHTML = await qrSvg(k.kod, { type: 'svg', margin: 0, errorCorrectionLevel: 'H' });
  const kod = document.createElement('div');
  kod.className = 'popis';
  kod.textContent = k.kod;
  el.append(qr, kod);
  return el;
}

async function vykresli(): Promise<void> {
  const stranky = document.getElementById('stranky');
  if (!stranky) throw new Error('Chybí #stranky');
  const r = rozlozeniListu(2, 4, KARTA_STITEK);
  const list = document.createElement('section');
  list.className = 'list';
  const stitky = await Promise.all(
    SADA_KARET.map((k, i) => {
      const p = r.pozice[i];
      if (!p) throw new Error(`Chybí pozice pro kartu ${i}`);
      return vytvorStitek(k, p.x, p.y);
    }),
  );
  const meritko = document.createElement('div');
  meritko.className = 'meritko';
  meritko.style.bottom = `${r.okrajY / 2 - 2}mm`;
  meritko.innerHTML = '<span class="cara"></span><span>50 mm (kontrola měřítka)</span>';
  list.append(...stitky, meritko);
  stranky.append(list);
}

document.getElementById('tisknout')?.addEventListener('click', () => window.print());
void vykresli();
