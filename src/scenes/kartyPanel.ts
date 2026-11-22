// Peněžní karty na obrazovce (obchod, vzduch) a jejich malý přehled (stojan). Hra je hratelná i bez čtečky:
// karta se aktivuje klepnutím nebo pípnutím (`K001`…). Zůstatek je společný pro celý herní den (penezenka.ts).

import type Phaser from 'phaser';
import * as beep from '../services/beep.ts';
import { PENEZNI_KARTY, type PenezniKarta, penezenka } from '../services/penezenka.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const ZLUTA = 0xf1c40f;

/** Karty vpravo pod sebou; tečky po 10 v řadě (karta 20 = dvě plné řady). */
export const KARTY = { x: 1068, y0: 140, dy: 84, sirka: 370, vyska: 74, x0: -84, d: 21, r: 8, vRade: 10 } as const;

/** Barva karty podle hodnoty (hráč pozná hodnotu podle barvy; skutečné barvy karet zatím neznáme). */
export const BARVA_KARTY: Readonly<Record<number, number>> = { 20: 0x9a7d0a, 15: 0x1e8449, 10: 0x1f4f8f };

function barva(k: PenezniKarta): number {
  return BARVA_KARTY[k.hodnota] ?? 0x1f4f8f;
}

export interface KartaNaObrazovce {
  karta: PenezniKarta;
  obal: Phaser.GameObjects.Container;
  pozadi: Phaser.GameObjects.Rectangle;
  cislo: Phaser.GameObjects.Text;
  tecky: Phaser.GameObjects.Arc[];
}

/** Sloupec všech peněžních karet se zůstatkem; klepnutí na kartu zavolá `priKlepnuti`. */
export class PanelKaret {
  readonly karty: KartaNaObrazovce[];
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, priKlepnuti: (kn: KartaNaObrazovce) => void) {
    this.scene = scene;
    this.karty = PENEZNI_KARTY.map((k, i) => this.vytvor(k, KARTY.x, KARTY.y0 + i * KARTY.dy, priKlepnuti));
  }

  najdi(kod: string): KartaNaObrazovce | undefined {
    const k = kod.trim().toUpperCase();
    return this.karty.find((kn) => kn.karta.kod === k);
  }

  private vytvor(
    karta: PenezniKarta,
    x: number,
    y: number,
    priKlepnuti: (kn: KartaNaObrazovce) => void,
  ): KartaNaObrazovce {
    const s = this.scene;
    const pozadi = s.add.rectangle(0, 0, KARTY.sirka, KARTY.vyska, barva(karta)).setStrokeStyle(4, 0xd4ac0d);
    const cislo = s.add
      .text(-KARTY.sirka / 2 + 16, 0, '', { fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#f1c40f' })
      .setOrigin(0, 0.5);
    const radku = Math.ceil(karta.hodnota / KARTY.vRade);
    const tecky = Array.from({ length: karta.hodnota }, (_, i) =>
      s.add
        .circle(
          KARTY.x0 + (i % KARTY.vRade) * KARTY.d,
          (Math.floor(i / KARTY.vRade) - (radku - 1) / 2) * KARTY.d,
          KARTY.r,
          ZLUTA,
        )
        .setStrokeStyle(2, 0xfef9e7)
        .setName(`${karta.kod}_tecka_${i + 1}`),
    );
    const obal = s.add.container(x, y, [pozadi, cislo, ...tecky]).setName(`karta_${karta.kod}`);
    pozadi.setInteractive({ useHandCursor: true });
    const kn: KartaNaObrazovce = { karta, obal, pozadi, cislo, tecky };
    pozadi.on('pointerdown', () => priKlepnuti(kn));
    this.prekresli(kn);
    return kn;
  }

  /** Zůstatek karty: plné tečky = zbývá, prázdná kolečka = utraceno dnes. */
  prekresli(kn: KartaNaObrazovce): void {
    const zbyva = penezenka().zustatek(kn.karta.kod) ?? 0;
    kn.cislo.setText(String(zbyva));
    kn.tecky.forEach((t, i) => t.setFillStyle(ZLUTA, i < zbyva ? 1 : 0));
  }

  /**
   * Vyprázdní tečky, které se právě platí (od konce zůstatku `pred`), a vrátí jejich pozice ve scéně –
   * odtud tečky odletí. Číslo zůstatku se překreslí až po doletu (`prekresli`).
   */
  odeberTecky(kn: KartaNaObrazovce, pred: number, cena: number): { x: number; y: number }[] {
    const pozice: { x: number; y: number }[] = [];
    for (let i = 0; i < cena; i++) {
      const t = kn.tecky[pred - 1 - i];
      if (!t) continue;
      t.setFillStyle(ZLUTA, 0);
      pozice.push({ x: kn.obal.x + t.x, y: kn.obal.y + t.y });
    }
    return pozice;
  }

  /** Na kartě není dost: zčervená, zatřese se a ❌. */
  odmitni(kn: KartaNaObrazovce): void {
    const s = this.scene;
    beep.error();
    kn.pozadi.setFillStyle(0xc0392b);
    const x = KARTY.x;
    s.tweens.add({
      targets: kn.obal,
      x: { from: x - 14, to: x + 14 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        kn.obal.x = x;
        kn.pozadi.setFillStyle(barva(kn.karta));
      },
    });
    const krizek = s.add
      .text(x, kn.obal.y, '❌', { fontSize: '80px', padding: { x: 10, y: 20 } })
      .setOrigin(0.5)
      .setDepth(30)
      .setName('odmitnuto');
    s.tweens.add({ targets: krizek, alpha: { from: 1, to: 0 }, delay: 700, duration: 400, onComplete: () => krizek.destroy() });
  }
}

/** Malý přehled zůstatků (u stojanu): kolik zbývá na nákupy – barevná karta s číslem. */
export function prehledKaret(scene: Phaser.Scene, x0: number, y: number): void {
  const sirka = 62;
  const mezera = 6;
  PENEZNI_KARTY.forEach((k, i) => {
    const zbyva = penezenka().zustatek(k.kod) ?? 0;
    const x = x0 + i * (sirka + mezera) + sirka / 2;
    const pozadi = scene.add.rectangle(0, 0, sirka, 52, barva(k)).setStrokeStyle(3, 0xd4ac0d);
    const cislo = scene.add
      .text(0, 0, String(zbyva), { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#f1c40f' })
      .setOrigin(0.5);
    // Podíl zůstatku jako proužek dole (plná karta = celý).
    const prouzek = scene.add
      .rectangle(-sirka / 2 + 4, 20, (sirka - 8) * (zbyva / k.hodnota), 5, ZLUTA)
      .setOrigin(0, 0.5);
    scene.add
      .container(x, y, [pozadi, cislo, prouzek])
      .setName(`prehled_${k.kod}`)
      .setAlpha(zbyva > 0 ? 1 : 0.4);
  });
}
