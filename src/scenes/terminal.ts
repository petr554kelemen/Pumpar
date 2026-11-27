// Číselná klávesnice (dveře benzínky, PIN karty) a platební terminál s PINem (obchod 🛒, vzduch 🛞).
// Platba se potvrzuje PINem jako při skutečném nákupu (rozhodnutí rodiče 2026-11-27): pokladní (hráč) vybere
// kartu, zákazník (rodič) zadá PIN. Terminál nic nestornuje a nemá tlačítko storna – storno je jen služební
// karta K000. Vzhledem se liší od dveří benzínky (modrý rám, 💳 a částka v tečkách nahoře, žádný 🔒).

import Phaser from 'phaser';
import * as beep from '../services/beep.ts';
import { bus } from '../services/eventBus.ts';
import { KodovaKlavesnice } from '../services/lock.ts';
import { spravnyPin } from '../services/penezenka.ts';
import { krizek } from './kartyPanel.ts';

const FONT = 'Arial, Helvetica, sans-serif';
export const LCD_FONT = '"Courier New", Courier, monospace';
const ZLUTA = 0xf1c40f;

export const BARVA_KLAVES = { klavesa: 0xe8ebee, zelena: 0x2ecc71, cervena: 0xe74c3c } as const;

/** Rozměry kláves: šířka, výška, mezera. */
export interface RozmerKlaves {
  kw: number;
  kh: number;
  mezera: number;
}

/**
 * Klávesnice 1–9 / C / 0 / ✅ (3 sloupce) vystředěná v šířce `sirka`, horní okraj `y0` – souřadnice uvnitř
 * kontejneru volajícího. Objekty se jmenují `klavesa_1` … `klavesa_C`, `klavesa_ok`.
 */
export function klavesnice(
  scene: Phaser.Scene,
  sirka: number,
  y0: number,
  priStisku: (k: string) => void,
  { kw, kh, mezera }: RozmerKlaves = { kw: 120, kh: 82, mezera: 15 },
): Phaser.GameObjects.Container[] {
  const klavesy = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✅'];
  const x0 = (sirka - (3 * kw + 2 * mezera)) / 2;
  return klavesy.map((k, i) => {
    const x = x0 + (i % 3) * (kw + mezera);
    const y = y0 + Math.floor(i / 3) * (kh + mezera);
    const barva = k === 'C' ? BARVA_KLAVES.cervena : k === '✅' ? BARVA_KLAVES.zelena : BARVA_KLAVES.klavesa;
    const pozadi = scene.add.rectangle(0, 0, kw, kh, barva).setInteractive({ useHandCursor: true });
    const popis = scene.add
      .text(0, 0, k, {
        fontFamily: FONT,
        fontSize: `${Math.round(kh * 0.48)}px`,
        fontStyle: 'bold',
        color: k === 'C' ? '#ffffff' : '#1e242b',
        padding: { x: 4, y: 4 },
      })
      .setOrigin(0.5);
    const obal = scene.add.container(x + kw / 2, y + kh / 2, [pozadi, popis]).setName(k === '✅' ? 'klavesa_ok' : `klavesa_${k}`);
    pozadi.on('pointerdown', () => {
      obal.setScale(0.94);
      scene.time.delayedCall(90, () => obal.setScale(1));
      priStisku(k);
    });
    return obal;
  });
}

const PIN = {
  sirka: 440,
  vyska: 600,
  ram: 0x1a5276,
  ramSvetly: 0x5dade2,
  lcd: 0xa9cce3,
  lcdChyba: 0xe8a39b,
} as const;

/**
 * Platební terminál: nahoře 💳 a částka (číslo + tečky po 10), displej s hvězdičkami, klávesnice.
 * Číslice jdou psát i na klávesnici počítače (událost `psani`); PIN + Enter přijde jako `scan` – scéna ho
 * předá do `zkus`. Správný PIN → `priSpravnem`, terminál zmizí. ↩️ = zavřít bez placení.
 */
export class PinTerminal {
  private readonly scene: Phaser.Scene;
  private readonly obal: Phaser.GameObjects.Container;
  private readonly lcd: Phaser.GameObjects.Rectangle;
  private readonly displej: Phaser.GameObjects.Text;
  private readonly kod = new KodovaKlavesnice(spravnyPin);
  private readonly priSpravnem: () => void;
  private readonly odhlasit: () => void;
  private zavreny = false;
  private readonly x0: number;

  constructor(scene: Phaser.Scene, x: number, y: number, cena: number, barvaKarty: number, priSpravnem: () => void) {
    this.scene = scene;
    this.priSpravnem = priSpravnem;
    const w = PIN.sirka;
    const prvky: Phaser.GameObjects.GameObject[] = [];

    // Pozadí zachytí klepnutí (pod terminálem se nic nevybírá).
    prvky.push(
      scene.add.rectangle(0, 0, w, PIN.vyska, 0x152a3a).setOrigin(0).setStrokeStyle(8, PIN.ramSvetly).setInteractive(),
      scene.add.rectangle(0, 0, w, 96, PIN.ram).setOrigin(0),
    );

    // Hlavička: karta (barvou hodnoty) + 💳 a částka.
    prvky.push(
      scene.add.rectangle(46, 48, 64, 44, barvaKarty).setStrokeStyle(3, 0xd4ac0d),
      scene.add.text(46, 48, '💳', { fontSize: '34px', padding: { x: 4, y: 6 } }).setOrigin(0.5),
      scene.add
        .text(170, 48, String(cena), { fontFamily: FONT, fontSize: '50px', fontStyle: 'bold', color: '#f1c40f' })
        .setOrigin(1, 0.5)
        .setName('pin_castka'),
    );
    const d = 17;
    const radku = Math.ceil(cena / 10);
    for (let i = 0; i < cena; i++) {
      prvky.push(
        scene.add
          .circle(192 + (i % 10) * d, 48 + (Math.floor(i / 10) - (radku - 1) / 2) * d, 6, ZLUTA)
          .setStrokeStyle(2, 0xfef9e7),
      );
    }

    // ↩️ zavřít bez placení (žádné storno – nákup zůstane v košíku).
    const zpet = scene.add
      .text(w - 8, 8, '↩️', { fontSize: '40px', backgroundColor: '#37404c', padding: { x: 6, y: 4 } })
      .setOrigin(1, 0)
      .setName('pin_zpet')
      .setInteractive({ useHandCursor: true });
    zpet.on('pointerdown', () => {
      beep.tick(400, 0.06);
      this.zavri();
    });
    prvky.push(zpet); // tečky končí na x ≈ 192 + 9 · 17 + 6 = 351, ↩️ začíná až za nimi (≈ 366)

    this.lcd = scene.add.rectangle(30, 116, w - 60, 84, PIN.lcd).setOrigin(0).setName('pin_lcd');
    this.displej = scene.add
      .text(w / 2, 158, '', { fontFamily: LCD_FONT, fontSize: '64px', fontStyle: 'bold', color: '#142214' })
      .setOrigin(0.5)
      .setName('pin_displej');
    prvky.push(this.lcd, this.displej);
    prvky.push(...klavesnice(scene, w, 222, (k) => this.stisk(k), { kw: 112, kh: 76, mezera: 14 }));

    this.x0 = x - w / 2;
    this.obal = scene.add.container(this.x0, y - PIN.vyska / 2, prvky).setDepth(25).setName('pin_terminal');
    this.obal.setScale(0.8).setAlpha(0);
    scene.tweens.add({ targets: this.obal, scale: 1, alpha: 1, duration: 180, ease: 'Back.Out' });

    // Číslice z klávesnice počítače (rozepsané) ukazuje jako hvězdičky.
    this.odhlasit = bus.on('psani', ({ text }) => {
      if (/^\d+$/.test(text)) {
        this.kod.nastav(text);
        this.prekresli();
      }
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.zavri());
    beep.tick(990, 0.06);
  }

  get otevreny(): boolean {
    return !this.zavreny;
  }

  /** Celý PIN najednou (z klávesnice počítače + Enter, přijde jako `scan`). */
  zkus(pin: string): void {
    if (this.zavreny) return;
    this.kod.nastav(pin);
    this.vyhodnot();
  }

  /** Zavře terminál bez placení. */
  zavri(): void {
    if (this.zavreny) return;
    this.zavreny = true;
    this.odhlasit();
    this.obal.destroy();
  }

  private stisk(k: string): void {
    if (this.zavreny) return;
    if (k === '✅') {
      this.vyhodnot();
      return;
    }
    beep.tick(k === 'C' ? 400 : 700, 0.05);
    if (k === 'C') this.kod.vymaz();
    else this.kod.stiskni(k);
    this.prekresli();
  }

  private vyhodnot(): void {
    const ok = this.kod.potvrd();
    this.prekresli();
    if (ok) {
      beep.tick(1180, 0.1);
      this.zavri();
      this.priSpravnem();
      return;
    }
    // Špatný PIN: ❌, displej zčervená a vymaže se; zkouší se znovu (bez blokace).
    krizek(this.scene, this.obal.x + PIN.sirka / 2, this.obal.y + 158, 90);
    this.lcd.setFillStyle(PIN.lcdChyba);
    this.scene.tweens.killTweensOf(this.obal);
    const x = this.x0;
    this.scene.tweens.add({
      targets: this.obal,
      x: { from: x - 10, to: x + 10 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (this.zavreny) return;
        this.obal.x = x;
        this.lcd.setFillStyle(PIN.lcd);
      },
    });
  }

  private prekresli(): void {
    if (!this.zavreny) this.displej.setText(this.kod.hvezdicky);
  }
}
