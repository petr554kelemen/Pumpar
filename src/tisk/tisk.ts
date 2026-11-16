// Stránka pro tisk visaček (jen pro rodiče). Zatím technický test: různé velikosti Code128 a QR,
// aby se ověřilo, co spolehlivě čte čtečka i telefon. Herní visačky přijdou po dílně s hráčem.

import JsBarcode from 'jsbarcode';
import { toString as qrSvg } from 'qrcode';
import { VISACKA, rozlozeniListu, sirkaCode128Mm } from './layout.ts';

type Varianta =
  | { kod: string; typ: 'code128'; modulMm: number }
  | { kod: string; typ: 'qr'; velikostMm: number };

const VYSKA_CAR_MM = 10;

// Technický test: 25 visaček = 5 × 5 na A4.
const TEST: Varianta[] = [
  // Code128 – čtyři šířky modulu pro zboží a SPZ
  ...[0.2, 0.25, 0.3, 0.33].flatMap((modulMm): Varianta[] => [
    { kod: 'P001', typ: 'code128', modulMm },
    { kod: 'LA01', typ: 'code128', modulMm },
  ]),
  // QR – čtyři velikosti pro zboží a SPZ
  ...[10, 13, 16, 20].flatMap((velikostMm): Varianta[] => [
    { kod: 'P001', typ: 'qr', velikostMm },
    { kod: 'LA01', typ: 'qr', velikostMm },
  ]),
  // Další kódy pro vyzkoušení všech druhů ve hře (včetně chybného X001 → ❌)
  { kod: 'S002', typ: 'code128', modulMm: 0.25 },
  { kod: 'B020', typ: 'code128', modulMm: 0.25 },
  { kod: 'A001', typ: 'code128', modulMm: 0.3 },
  { kod: 'LA10', typ: 'code128', modulMm: 0.3 },
  { kod: 'X001', typ: 'code128', modulMm: 0.25 },
  { kod: 'K001', typ: 'qr', velikostMm: 13 },
  { kod: 'KE01', typ: 'qr', velikostMm: 13 },
  { kod: 'KE03', typ: 'qr', velikostMm: 10 },
  { kod: '9001', typ: 'qr', velikostMm: 13 },
];

/** Velké písmeno / slabika z kódu (P001 → P, LA01 → LA, 9001 → ⚙). */
function pismenoZKodu(kod: string): string {
  if (/^\d/.test(kod)) return '⚙';
  return /^[A-Z]{2}\d{2}$/.test(kod) ? kod.slice(0, 2) : kod.slice(0, 1);
}

function popisVarianty(v: Varianta): string {
  return v.typ === 'code128'
    ? `C128 ${v.modulMm.toLocaleString('cs-CZ')} mm · ${v.kod}`
    : `QR ${v.velikostMm} mm · ${v.kod}`;
}

function vytvorCode128(kod: string, modulMm: number): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  // width 1 = 1 jednotka na modul; tichá zóna 10 modulů; velikost pak přepíšeme na mm.
  JsBarcode(svg, kod, { format: 'CODE128', width: 1, height: 50, margin: 10, displayValue: false });
  svg.setAttribute('width', `${sirkaCode128Mm(kod, modulMm)}mm`);
  svg.setAttribute('height', `${VYSKA_CAR_MM}mm`);
  svg.setAttribute('preserveAspectRatio', 'none');
  return svg;
}

async function vytvorQr(kod: string, velikostMm: number): Promise<HTMLElement> {
  const obal = document.createElement('div');
  obal.className = 'qr';
  obal.style.width = obal.style.height = `${velikostMm}mm`;
  obal.innerHTML = await qrSvg(kod, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  return obal;
}

async function vytvorVisacku(v: Varianta, x: number, y: number): Promise<HTMLElement> {
  const el = document.createElement('div');
  el.className = 'visacka';
  Object.assign(el.style, {
    left: `${x}mm`,
    top: `${y}mm`,
    width: `${VISACKA.sirka}mm`,
    height: `${VISACKA.vyska}mm`,
    paddingTop: `${VISACKA.zonaDirky}mm`,
  });

  const dirka = document.createElement('div');
  dirka.className = 'dirka';

  const pismeno = document.createElement('div');
  pismeno.className = 'pismeno';
  pismeno.textContent = pismenoZKodu(v.kod);

  const kod = document.createElement('div');
  kod.className = 'kod';
  kod.append(v.typ === 'code128' ? vytvorCode128(v.kod, v.modulMm) : await vytvorQr(v.kod, v.velikostMm));

  const popis = document.createElement('div');
  popis.className = 'popis';
  popis.textContent = popisVarianty(v);

  el.append(dirka, pismeno, kod, popis);
  return el;
}

function meritko(okrajY: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'meritko';
  el.style.bottom = `${okrajY / 2 - 2}mm`;
  el.innerHTML = '<span class="cara"></span><span>50 mm (kontrola měřítka)</span>';
  return el;
}

async function vykresli(): Promise<void> {
  const stranky = document.getElementById('stranky');
  if (!stranky) throw new Error('Chybí #stranky');

  const r = rozlozeniListu();
  const list = document.createElement('section');
  list.className = 'list';

  const visacky = await Promise.all(
    TEST.slice(0, r.pozice.length).map((v, i) => {
      const p = r.pozice[i];
      if (!p) throw new Error(`Chybí pozice pro visačku ${i}`);
      return vytvorVisacku(v, p.x, p.y);
    }),
  );
  list.append(...visacky, meritko(r.okrajY));
  stranky.append(list);
}

document.getElementById('tisknout')?.addEventListener('click', () => window.print());
void vykresli();
