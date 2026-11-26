import Phaser from 'phaser';
import { bus, type GameEvents } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import { PENEZNI_KARTY, type PenezniKarta, penezenka } from '../services/penezenka.ts';
import { barva } from './kartyPanel.ts';
import type { SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const ZLUTA = 0xf1c40f;
const ZELENA = 0x2ecc71;

// Banka – výběr karet na začátku kola (rozhodnutí rodiče 2026-11-24, prostředí banky 2026-11-26):
// po odemčení benzínky a po restartu `K000` hráč zajede autem do banky a aktivuje si tam karty klepnutím
// nebo pípnutím → tím si určí strop teček na celé kolo, který pak hlídá. Neaktivní karta je bledá, aktivní
// svítí a má zelené ✔. Pípnutí už aktivní karty = jen chybový zvuk a zatřesení (bez ❌ – to je vyhrazené
// pro kritičtější chyby). ✅ ➡️ ⛽ se ukáže po první kartě; auto pak odjede z banky ke stojanu.

const BARVA = {
  fasada: 0x3a4350,
  kamen: 0x8a96a3,
  kamenSvetly: 0xaab4be,
  okno: 0x1b2027,
  chodnik: 0x55606e,
  silnice: 0x2c3036,
  cara: 0xd5d8dc,
} as const;

/** Rozložení karet na fasádě banky: nahoře 20 + 15 + 15, dole čtyři desítky. */
const KARTA = { sirka: 270, vyska: 150, d: 22, r: 9, vRade: 10 } as const;
const POZICE: readonly { x: number; y: number }[] = [
  { x: 340, y: 262 },
  { x: 640, y: 262 },
  { x: 940, y: 262 },
  { x: 190, y: 452 },
  { x: 490, y: 452 },
  { x: 790, y: 452 },
  { x: 1090, y: 452 },
];
const NEAKTIVNI_ALFA = 0.35;

/** Auto hráče na silnici před bankou: přijede zleva, zastaví u vchodu, odjede doprava (k ⛽). */
const AUTO = { y: 652, start: -140, stani: 420, cil: 1480 } as const;

interface VybiranaKarta {
  karta: PenezniKarta;
  obal: Phaser.GameObjects.Container;
  pozadi: Phaser.GameObjects.Rectangle;
  fajfka: Phaser.GameObjects.Container;
  x: number;
}

export class BankaScene extends Phaser.Scene {
  private karty: VybiranaKarta[] = [];
  private stropText!: Phaser.GameObjects.Text;
  private hotovo!: Phaser.GameObjects.Container;
  private auto!: Phaser.GameObjects.Text;
  private odchazim = false;

  constructor() {
    super('Banka' satisfies SceneKey);
  }

  create(): void {
    this.odchazim = false;
    this.kresliBanku();

    // Strop kola: součet aktivních karet (tabule vlevo nahoře).
    this.add.rectangle(175, 66, 290, 100, 0x2c3540).setStrokeStyle(4, 0x4a5563).setName('strop_ramecek');
    this.add.circle(80, 66, 26, ZLUTA).setStrokeStyle(3, 0xfef9e7).setName('strop_tecka');
    this.stropText = this.add
      .text(195, 66, '0', { fontFamily: FONT, fontSize: '76px', fontStyle: 'bold', color: '#f1c40f' })
      .setOrigin(0.5)
      .setName('strop');

    this.karty = PENEZNI_KARTY.map((k, i) => this.vytvor(k, POZICE[i] ?? { x: 640, y: 360 }));

    const pozadi = this.add.rectangle(0, 0, 300, 100, ZELENA).setStrokeStyle(6, 0xffffff).setInteractive({ useHandCursor: true });
    const ikona = this.add.text(0, 0, '✅ ➡️ ⛽', { fontSize: '50px', padding: { x: 8, y: 10 } }).setOrigin(0.5);
    this.hotovo = this.add.container(1090, 655, [pozadi, ikona]).setName('hotovo');
    pozadi.on('pointerdown', () => this.pokracuj());

    // Auto hráče přijede k bance (karty jdou aktivovat hned – příjezd jen dokresluje příběh).
    this.auto = this.add
      .text(AUTO.start, AUTO.y, '🚙', { fontSize: '110px', padding: { x: 10, y: 10 } })
      .setOrigin(0.5)
      .setFlipX(true) // emoji auta jede doleva → otočit, ať jede doprava
      .setDepth(5)
      .setName('auto');
    this.tweens.add({ targets: this.auto, x: AUTO.stani, duration: 1200, ease: 'Quad.Out' });
    beep.tick(220, 0.25);

    this.prekresli();
    const odhlasit = bus.on('scan', (d) => this.onScan(d));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, odhlasit);
  }

  // ---------- Prostředí: budova banky a silnice ----------

  private kresliBanku(): void {
    // Fasáda přes celou šířku, nahoře štít s 🏦 (jako sloupová budova banky).
    this.add.rectangle(30, 128, 1220, 464, BARVA.fasada).setOrigin(0).setName('banka');
    this.add.rectangle(20, 116, 1240, 22, BARVA.kamenSvetly).setOrigin(0).setName('rimsa');
    const stit = this.add.graphics().setName('stit');
    stit.fillStyle(BARVA.kamen).fillTriangle(640, 8, 340, 116, 940, 116);
    stit.lineStyle(4, BARVA.kamenSvetly).strokeTriangle(640, 8, 340, 116, 940, 116);
    this.add
      .text(640, 82, '🏦 BANKA', { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#1e242b', padding: { x: 6, y: 8 } })
      .setOrigin(0.5)
      .setName('napis');
    // Chodník, silnice s přerušovanou čarou.
    this.add.rectangle(0, 592, 1280, 14, BARVA.chodnik).setOrigin(0).setName('chodnik');
    this.add.rectangle(0, 606, 1280, 114, BARVA.silnice).setOrigin(0).setName('silnice');
    for (let x = 20; x < 1280; x += 120) this.add.rectangle(x, 704, 60, 6, BARVA.cara).setOrigin(0);
  }

  // ---------- Karty ----------

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

  /** ✅ ➡️ ⛽: auto odjede z banky doprava a hra pokračuje u stojanu. */
  private pokracuj(): void {
    if (this.odchazim || penezenka().aktivniKarty().length === 0) return;
    this.odchazim = true;
    beep.win();
    this.tweens.killTweensOf(this.auto);
    this.tweens.add({ targets: this.hotovo, alpha: 0, scale: 0.9, duration: 300 });
    this.tweens.add({
      targets: this.auto,
      x: AUTO.cil,
      duration: 1100,
      ease: 'Quad.In',
      onComplete: () => this.scene.start('Station' satisfies SceneKey),
    });
  }
}
