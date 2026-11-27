import Phaser from 'phaser';
import * as beep from '../services/beep.ts';
import { type Auto, garaz, jePrazdne, litryNaObrazovce, naRezerve, stavNadrzeAuta } from '../services/auta.ts';
import { den } from '../services/den.ts';
import { hlas } from '../services/voice.ts';
import { bus, type GameEvents } from '../services/eventBus.ts';
import { addNav, type SceneKey } from './nav.ts';
import { tabulkaSpz } from './spz.ts';

const FONT = 'Arial, Helvetica, sans-serif';

/** Rodičovský kód: smazat všechna auta (nové rozdělení SPZ). */
export const KOD_SMAZAT_AUTA = '9200';

/** Dva sloupce po 10 řádcích; sloupec nádrže 20 L = 300 px (délka podle kapacity). */
const MRIZKA = { x: [20, 650], y0: 128, dy: 58, naSloupec: 10, sirkaSloupce: 610 } as const;
const PRUH = { dx: 238, vyska: 26, pxNaSetinu: 300 / 2000 } as const;
const BARVA = {
  zelena: 0x2ecc71,
  oranzova: 0xf39c12,
  cervena: 0xe74c3c,
  pozadi: 0x111111,
  radek: 0x2c3540,
} as const;

interface Radek {
  auto: Auto;
  obal: Phaser.GameObjects.Container;
  ramecek: Phaser.GameObjects.Rectangle;
  ikona: Phaser.GameObjects.Text;
  pruh: Phaser.GameObjects.Rectangle;
  litry: Phaser.GameObjects.Text;
}

// Parkoviště 🅿️ (vylepšení 2): seznam aut jako sloupce nádrže s výraznou SPZ. Nádrže živě ubývají (jen během
// směny); rezerva bliká červeně, prázdné auto je šedé s 🪫 (žádné ❌ – pojede s vlečkou). Neřadí se – najít,
// komu dochází, je hráčova práce. Pípnutí SPZ = auto se zvýrazní, nové se přidá.
export class ParkovisteScene extends Phaser.Scene {
  private radky: Radek[] = [];
  private prazdno: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('Parkoviste' satisfies SceneKey);
  }

  create(): void {
    this.radky = [];
    this.prazdno = null;
    addNav(this);
    this.add
      .text(1260, 704, 'Pípni SPZ auta – přidá se / zvýrazní · 9200 = smazat auta (rodič)', {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#5d6d7e',
      })
      .setOrigin(1, 1);
    this.prekresliSeznam();
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.aktualizuj() });

    const odhlasit = bus.on('scan', (d) => this.onScan(d));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, odhlasit);
  }

  private onScan({ kod, info }: GameEvents['scan']): void {
    switch (info.druh) {
      case 'auto': {
        const { auto, nove } = garaz().pridej(info.kod, Date.now());
        if (nove) {
          beep.tick(660, 0.1);
          this.time.delayedCall(120, () => beep.tick(990, 0.15));
          this.prekresliSeznam();
        } else {
          beep.tick(880, 0.08);
        }
        this.zvyrazni(auto.spz);
        return;
      }
      case 'vlecka': {
        beep.tick(330, 0.12);
        hlas().rekni('vlecka_vyjizdi');
        const t = this.add.text(640, 400, '🚛', { fontSize: '120px', padding: { x: 10, y: 10 } }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: t, x: 1400, duration: 1200, ease: 'Quad.In', onComplete: () => t.destroy() });
        return;
      }
      case 'rodic':
        if (kod === KOD_SMAZAT_AUTA) {
          garaz().smazVse();
          beep.tick(400, 0.15);
          this.prekresliSeznam();
        }
        return;
      case 'chyba':
        beep.error();
        return;
      case 'zbozi':
      case 'karta':
      case 'bankovka':
        return;
    }
  }

  private prekresliSeznam(): void {
    this.radky.forEach((r) => r.obal.destroy());
    this.radky = [];
    this.prazdno?.destroy();
    this.prazdno = null;

    const auta = garaz().vsechna().slice(0, MRIZKA.naSloupec * 2);
    if (auta.length === 0) {
      this.prazdno = this.add
        .text(640, 400, '🚗 ➡️ 📟', { fontSize: '110px', padding: { x: 10, y: 14 } })
        .setOrigin(0.5)
        .setAlpha(0.3)
        .setName('parkoviste_prazdne');
      return;
    }
    auta.forEach((a, i) => this.radky.push(this.vytvorRadek(a, i)));
    this.aktualizuj();
  }

  private vytvorRadek(auto: Auto, i: number): Radek {
    const x = MRIZKA.x[Math.floor(i / MRIZKA.naSloupec)] ?? MRIZKA.x[0];
    const y = MRIZKA.y0 + (i % MRIZKA.naSloupec) * MRIZKA.dy;
    const ramecek = this.add
      .rectangle(MRIZKA.sirkaSloupce / 2, 0, MRIZKA.sirkaSloupce, MRIZKA.dy - 6, BARVA.radek)
      .setStrokeStyle(4, 0xf1c40f, 0);
    const spz = tabulkaSpz(this, 100, 0, auto.spz, 46);
    const ikona = this.add
      .text(212, 0, auto.spz.startsWith('LA') ? '🚙' : '🚗', { fontSize: '32px', padding: { x: 4, y: 8 } })
      .setOrigin(0.5);
    const delka = auto.kapacita * PRUH.pxNaSetinu;
    const nadrz = this.add.rectangle(PRUH.dx, 0, delka, PRUH.vyska, BARVA.pozadi).setOrigin(0, 0.5).setStrokeStyle(2, 0x5d6d7e);
    const pruh = this.add.rectangle(PRUH.dx, 0, 0, PRUH.vyska - 4, BARVA.zelena).setOrigin(0, 0.5);
    const ryska = this.add.rectangle(PRUH.dx + delka / 2, 0, 3, PRUH.vyska + 8, 0xffffff);
    const litry = this.add
      .text(PRUH.dx + 300 + 18, 0, '', { fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#ecf0f1' })
      .setOrigin(0, 0.5);
    const obal = this.add
      .container(x, y, [ramecek, spz, ikona, nadrz, pruh, ryska, litry])
      .setName(`auto_${auto.spz}`);
    return { auto, obal, ramecek, ikona, pruh, litry };
  }

  /** Živé ubývání: délka a barva sloupce, rezerva bliká červeně, prázdné šedé s 🪫. */
  private aktualizuj(): void {
    const ted = Date.now();
    const d = den();
    const blik = Math.floor(ted / 400) % 2 === 0;
    for (const r of this.radky) {
      const stav = stavNadrzeAuta(r.auto, ted, d);
      const prazdne = jePrazdne(r.auto, ted, d);
      const rezerva = naRezerve(r.auto, ted, d);
      r.pruh.width = stav * PRUH.pxNaSetinu;
      r.pruh.fillColor = rezerva ? BARVA.cervena : stav * 2 >= r.auto.kapacita ? BARVA.zelena : BARVA.oranzova;
      r.pruh.setAlpha(rezerva && !blik ? 0.25 : 1);
      r.litry.setText(String(litryNaObrazovce(stav))).setColor(rezerva ? '#e74c3c' : '#ecf0f1');
      r.ikona.setText(prazdne ? '🪫' : r.auto.spz.startsWith('LA') ? '🚙' : '🚗');
      r.obal.setAlpha(prazdne ? 0.45 : 1);
    }
  }

  /** Najdi auto: žlutý rámeček a krátké pulzování řádku. */
  private zvyrazni(spz: string): void {
    const r = this.radky.find((x) => x.auto.spz === spz);
    if (!r) return;
    this.radky.forEach((x) => x.ramecek.setStrokeStyle(4, 0xf1c40f, 0));
    r.ramecek.setStrokeStyle(4, 0xf1c40f, 1);
    this.tweens.add({ targets: r.obal, scale: { from: 1.06, to: 1 }, duration: 300, ease: 'Back.Out' });
  }
}
