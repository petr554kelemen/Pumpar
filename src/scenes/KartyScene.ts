import Phaser from 'phaser';
import { bus, type GameEvents } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import { PENEZNI_KARTY, type PenezniKarta, penezenka } from '../services/penezenka.ts';
import { barva } from './kartyPanel.ts';
import type { SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const ZLUTA = 0xf1c40f;
const ZELENA = 0x2ecc71;

// Výběr karet na začátku kola (rozhodnutí rodiče 2026-11-24): po odemčení benzínky a po restartu `K000`
// si hráč aktivuje karty klepnutím nebo pípnutím → tím si určí strop teček na celé kolo, který pak hlídá.
// Neaktivní karta je bledá, aktivní svítí a má zelené ✔. Pípnutí už aktivní karty = jen chybový zvuk
// a zatřesení (bez ❌ – to je vyhrazené pro kritičtější chyby). ✅ ➡️ ⛽ se ukáže po první kartě.

/** Rozložení: nahoře 20 + 15 + 15, dole čtyři desítky. */
const KARTA = { sirka: 270, vyska: 150, d: 22, r: 9, vRade: 10 } as const;
const POZICE: readonly { x: number; y: number }[] = [
  { x: 340, y: 250 },
  { x: 640, y: 250 },
  { x: 940, y: 250 },
  { x: 190, y: 450 },
  { x: 490, y: 450 },
  { x: 790, y: 450 },
  { x: 1090, y: 450 },
];
const NEAKTIVNI_ALFA = 0.35;

interface VybiranaKarta {
  karta: PenezniKarta;
  obal: Phaser.GameObjects.Container;
  pozadi: Phaser.GameObjects.Rectangle;
  fajfka: Phaser.GameObjects.Container;
  x: number;
}

export class KartyScene extends Phaser.Scene {
  private karty: VybiranaKarta[] = [];
  private stropText!: Phaser.GameObjects.Text;
  private hotovo!: Phaser.GameObjects.Container;
  private odchazim = false;

  constructor() {
    super('Karty' satisfies SceneKey);
  }

  create(): void {
    this.odchazim = false;
    this.add.text(60, 60, '💳', { fontSize: '90px', padding: { x: 8, y: 12 } }).setOrigin(0.5).setName('titulek');

    // Strop kola: součet aktivních karet.
    this.add.rectangle(640, 80, 300, 110, 0x2c3540).setStrokeStyle(4, 0x4a5563).setName('strop_ramecek');
    this.add.circle(540, 80, 26, ZLUTA).setStrokeStyle(3, 0xfef9e7).setName('strop_tecka');
    this.stropText = this.add
      .text(660, 80, '0', { fontFamily: FONT, fontSize: '80px', fontStyle: 'bold', color: '#f1c40f' })
      .setOrigin(0.5)
      .setName('strop');

    this.karty = PENEZNI_KARTY.map((k, i) => this.vytvor(k, POZICE[i] ?? { x: 640, y: 360 }));

    const pozadi = this.add.rectangle(0, 0, 300, 110, ZELENA).setStrokeStyle(6, 0xffffff).setInteractive({ useHandCursor: true });
    const ikona = this.add.text(0, 0, '✅ ➡️ ⛽', { fontSize: '50px', padding: { x: 8, y: 10 } }).setOrigin(0.5);
    this.hotovo = this.add.container(1090, 640, [pozadi, ikona]).setName('hotovo');
    pozadi.on('pointerdown', () => this.pokracuj());

    this.prekresli();
    const odhlasit = bus.on('scan', (d) => this.onScan(d));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, odhlasit);
  }

  private vytvor(karta: PenezniKarta, { x, y }: { x: number; y: number }): VybiranaKarta {
    const pozadi = this.add.rectangle(0, 0, KARTA.sirka, KARTA.vyska, barva(karta)).setStrokeStyle(4, 0xd4ac0d);
    const cislo = this.add
      .text(-KARTA.sirka / 2 + 14, -KARTA.vyska / 2 + 8, String(karta.hodnota), {
        fontFamily: FONT,
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#f1c40f',
      })
      .setName(`${karta.kod}_hodnota`);
    const radku = Math.ceil(karta.hodnota / KARTA.vRade);
    const x0 = -((KARTA.vRade - 1) * KARTA.d) / 2;
    const tecky = Array.from({ length: karta.hodnota }, (_, i) =>
      this.add
        .circle(
          x0 + (i % KARTA.vRade) * KARTA.d,
          28 + (Math.floor(i / KARTA.vRade) - (radku - 1) / 2) * KARTA.d,
          KARTA.r,
          ZLUTA,
        )
        .setStrokeStyle(2, 0xfef9e7),
    );
    const fajfka = this.add
      .container(KARTA.sirka / 2 - 10, -KARTA.vyska / 2 + 10, [
        this.add.circle(0, 0, 30, ZELENA).setStrokeStyle(4, 0xffffff),
        this.add
          .text(0, 2, '✔', { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#ffffff' })
          .setOrigin(0.5),
      ])
      .setName(`${karta.kod}_aktivni`);
    const obal = this.add.container(x, y, [pozadi, cislo, ...tecky, fajfka]).setName(`vyber_${karta.kod}`);
    pozadi.setInteractive({ useHandCursor: true });
    const vk: VybiranaKarta = { karta, obal, pozadi, fajfka, x };
    pozadi.on('pointerdown', () => this.aktivuj(vk.karta.kod));
    return vk;
  }

  private onScan({ info }: GameEvents['scan']): void {
    if (info.druh === 'karta') this.aktivuj(info.kod);
  }

  private aktivuj(kod: string): void {
    if (this.odchazim) return;
    const vysledek = penezenka().aktivuj(kod);
    const vk = this.karty.find((k) => k.karta.kod === kod.trim().toUpperCase());
    if (vysledek === 'neznama' || !vk) {
      beep.error(); // služební nebo neznámá karta – není co zatřást
      return;
    }
    if (vysledek === 'uz_aktivni') {
      this.zatres(vk);
      return;
    }
    beep.tick(880, 0.1);
    this.prekresli();
    this.tweens.add({ targets: vk.obal, scale: { from: 1.12, to: 1 }, duration: 250, ease: 'Back.Out' });
    this.tweens.add({ targets: vk.fajfka, scale: { from: 0, to: 1 }, duration: 300, ease: 'Back.Out' });
    this.tweens.add({ targets: this.stropText, scale: { from: 1.3, to: 1 }, duration: 300 });
  }

  /** Karta už je aktivní: chybový zvuk a zatřesení (bez ❌). */
  private zatres(vk: VybiranaKarta): void {
    beep.error();
    this.tweens.killTweensOf(vk.obal);
    vk.obal.setScale(1);
    this.tweens.add({
      targets: vk.obal,
      x: { from: vk.x - 14, to: vk.x + 14 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        vk.obal.x = vk.x;
      },
    });
  }

  private prekresli(): void {
    const p = penezenka();
    for (const vk of this.karty) {
      const aktivni = p.jeAktivni(vk.karta.kod);
      vk.obal.setAlpha(aktivni ? 1 : NEAKTIVNI_ALFA);
      vk.pozadi.setStrokeStyle(aktivni ? 6 : 4, aktivni ? 0xffffff : 0xd4ac0d);
      vk.fajfka.setVisible(aktivni);
    }
    this.stropText.setText(String(p.strop()));
    this.hotovo.setVisible(p.aktivniKarty().length > 0);
  }

  private pokracuj(): void {
    if (this.odchazim || penezenka().aktivniKarty().length === 0) return;
    this.odchazim = true;
    beep.win();
    this.hotovo.setScale(0.95);
    this.time.delayedCall(400, () => this.scene.start('Station' satisfies SceneKey));
  }
}
