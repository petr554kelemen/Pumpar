// Stránka pro tisk štítků na staré platební karty (jen pro rodiče). Sada v karty.ts.
// Černobíle pro laser: velké číslo + tečky (jako karty ve hře) + QR s opravou chyb H.

import { toString as qrSvg } from 'qrcode';
import { QR_KARTA_MM, SADA_KARET, type StitekKarty } from './karty.ts';
import { KARTA_STITEK, rozlozeniListu } from './layout.ts';

/** Tečky po pěti v řádku – stejně jako na kartách ve hře. */
function tecky(hodnota: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'karta-tecky';
  for (let i = 0; i < hodnota; i++) el.append(document.createElement('span'));
  return el;
}

/** Klíč jako černý piktogram s výraznými obrysy (barevné emoji by vyšlo šedé). */
function klic(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'karta-klic';
  el.innerHTML = `<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="25" r="17" fill="none" stroke="#000" stroke-width="7"/>
    <circle cx="22" cy="25" r="5" fill="#000"/>
    <rect x="38" y="21" width="58" height="8" fill="#000"/>
    <rect x="72" y="29" width="7" height="12" fill="#000"/>
    <rect x="86" y="29" width="7" height="16" fill="#000"/>
  </svg>`;
  return el;
}

async function vytvorStitek(k: StitekKarty, x: number, y: number): Promise<HTMLElement> {
  const el = document.createElement('div');
  el.className = 'karta-stitek';
  Object.assign(el.style, { left: `${x}mm`, top: `${y}mm`, width: `${KARTA_STITEK.sirka}mm`, height: `${KARTA_STITEK.vyska}mm` });

  const vlevo = document.createElement('div');
  vlevo.className = 'karta-vlevo';
  if (k.druh === 'penize') {
    const cislo = document.createElement('div');
    cislo.className = 'karta-cislo';
    cislo.textContent = String(k.hodnota);
    vlevo.append(cislo, tecky(k.hodnota));
  } else {
    vlevo.append(klic());
  }

  const vpravo = document.createElement('div');
  vpravo.className = 'karta-vpravo';
  const qr = document.createElement('div');
  qr.className = 'qr';
  qr.style.width = qr.style.height = `${QR_KARTA_MM}mm`;
  qr.innerHTML = await qrSvg(k.kod, { type: 'svg', margin: 0, errorCorrectionLevel: 'H' });
  const kod = document.createElement('div');
  kod.className = 'popis';
  kod.textContent = k.kod;
  vpravo.append(qr, kod);

  el.append(vlevo, vpravo);
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
