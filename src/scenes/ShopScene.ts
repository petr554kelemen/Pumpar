import Phaser from 'phaser';
import { bus, type GameEvents } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import { den } from '../services/den.ts';
import { denik } from '../services/denik.ts';
import { ZBOZI, type Zbozi, najdiZbozi, utrata, vejdeSe } from '../services/katalog.ts';
import { PENEZNI_KARTY, type PenezniKarta, penezenka } from '../services/penezenka.ts';
import { addNav, type SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const ZLUTA = 0xf1c40f;
const ZELENA = 0x2ecc71;

/** Regál: 3 × 2 políčka se zbožím. */
const REGAL = { x0: 165, y0: 200, dx: 260, dy: 150, sirka: 240, vyska: 136, sloupcu: 3 } as const;
/** Košík dole: zboží v řadách po 8, útrata = číslo + tečky po 10 v řadě (do 30 = max. 3 řady). */
const KOSIK = { x: 425, y: 580, sirka: 790, vyska: 250 } as const;
const POLOZKY = { x0: 135, y0: 525, dx: 56, dy: 62, vRade: 8 } as const;
const UTRATA = { cisloX: 640, x0: 662, y0: 505, d: 19, r: 7, vRade: 10 } as const;
/** Karty vpravo pod sebou. */
/** Tečky karty po 10 v řadě (jako útrata v košíku) – karta 20 = dvě plné řady. */
const KARTY = { x: 1068, y0: 140, dy: 84, sirka: 370, vyska: 74, x0: -84, d: 21, r: 8, vRade: 10 } as const;

/** Barva karty podle hodnoty (hráč pozná hodnotu podle barvy; skutečné barvy karet zatím neznáme). */
const BARVA_KARTY: Readonly<Record<number, number>> = { 20: 0x9a7d0a, 15: 0x1e8449, 10: 0x1f4f8f };

interface KartaNaObrazovce {
  karta: PenezniKarta;
  obal: Phaser.GameObjects.Container;
  pozadi: Phaser.GameObjects.Rectangle;
  cislo: Phaser.GameObjects.Text;
  tecky: Phaser.GameObjects.Arc[];
}

type Stav = 'nakup' | 'placeni';

// Obchod (fáze 4, zatím bez benzínu): hráč vybírá zboží klepnutím na regál nebo pípnutím visačky,
// útrata v košíku roste viditelně (číslo + tečky). Pak sám zvolí kartu, kterou zaplatí – pípne ji
// (nebo na ni klepne). Stačí-li zůstatek, tečky z karty odletí do košíku a nákup se zapíše do deníku;
// jinak ❌ a hráč ubere zboží nebo zkusí jinou kartu. Karty drží zůstatek po celý herní den.
export class ShopScene extends Phaser.Scene {
  private stav: Stav = 'nakup';
  private kosik: Zbozi[] = [];
  private kosikObjekty: Phaser.GameObjects.GameObject[] = [];
  private policka = new Map<string, Phaser.GameObjects.Container>();
  private karty: KartaNaObrazovce[] = [];
  private kosikIkona!: Phaser.GameObjects.Text;

  constructor() {
    super('Shop' satisfies SceneKey);
  }

  create(): void {
    this.stav = 'nakup';
    this.kosik = [];
    this.kosikObjekty = [];
    this.policka.clear();
    this.karty = [];
    addNav(this);

    ZBOZI.forEach((z, i) => this.vytvorPolicko(z, i));

    this.add
      .rectangle(KOSIK.x, KOSIK.y, KOSIK.sirka, KOSIK.vyska, 0x2c3540)
      .setStrokeStyle(4, 0x4a5563)
      .setName('kosik');
    this.kosikIkona = this.add
      .text(70, KOSIK.y - 20, '🛒', { fontSize: '72px', padding: { x: 6, y: 10 } })
      .setOrigin(0.5)
      .setName('kosik_ikona');
    const vysypat = this.add
      .text(70, KOSIK.y + 75, '🗑️', { fontSize: '52px', backgroundColor: '#37404c', padding: { x: 10, y: 6 } })
      .setOrigin(0.5)
      .setName('vysypat')
      .setInteractive({ useHandCursor: true });
    vysypat.on('pointerdown', () => this.vysypej());

    PENEZNI_KARTY.forEach((k, i) => this.karty.push(this.vytvorKartu(k, KARTY.x, KARTY.y0 + i * KARTY.dy)));

    this.prekresliKosik();
    const odhlasit = bus.on('scan', (d) => this.onScan(d));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, odhlasit);
  }

  // ---------- Regál ----------

  private vytvorPolicko(z: Zbozi, i: number): void {
    const x = REGAL.x0 + (i % REGAL.sloupcu) * REGAL.dx;
    const y = REGAL.y0 + Math.floor(i / REGAL.sloupcu) * REGAL.dy;
    const pozadi = this.add.rectangle(0, 0, REGAL.sirka, REGAL.vyska, 0x34495e).setStrokeStyle(4, 0x5d6d7e);
    const emoji = this.add.text(-58, -8, z.emoji, { fontSize: '76px', padding: { x: 6, y: 12 } }).setOrigin(0.5);
    const cislo = this.add
      .text(30, -34, String(z.cena), { fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#f1c40f' })
      .setOrigin(0, 0.5);
    // Cena tečkami (po 5 v řadě).
    const tecky = Array.from({ length: z.cena }, (_, t) =>
      this.add.circle(18 + (t % 5) * 20, 12 + Math.floor(t / 5) * 20, 7, ZLUTA).setStrokeStyle(2, 0xfef9e7),
    );
    const obal = this.add.container(x, y, [pozadi, emoji, cislo, ...tecky]).setName(`zbozi_${z.kod}`);
    pozadi.setInteractive({ useHandCursor: true });
    pozadi.on('pointerdown', () => this.pridej(z));
    this.policka.set(z.kod, obal);
  }

  private onScan({ info }: GameEvents['scan']): void {
    if (this.stav !== 'nakup') return;
    switch (info.druh) {
      case 'zbozi': {
        const z = najdiZbozi(info.kod);
        if (z) this.pridej(z);
        else this.chyba(KOSIK.x, KOSIK.y); // zboží, které obchod nezná
        return;
      }
      case 'karta': {
        const k = this.karty.find((kn) => kn.karta.kod === info.kod);
        if (k) this.zaplat(k);
        else this.chyba(KARTY.x, 360); // služební nebo neznámá karta neplatí
        return;
      }
      case 'chyba':
        this.chyba(KOSIK.x, KOSIK.y);
        return;
      case 'bankovka':
      case 'auto':
      case 'rodic':
        return; // v obchodě nic nedělají
    }
  }

  // ---------- Košík ----------

  private pridej(z: Zbozi): void {
    if (this.stav !== 'nakup') return;
    const policko = this.policka.get(z.kod);
    if (!vejdeSe(this.kosik, z)) {
      // Víc než 30 teček se do košíku nevejde.
      if (policko) this.chyba(policko.x, policko.y);
      return;
    }
    this.kosik.push(z);
    beep.tick(880, 0.06);
    if (policko) this.tweens.add({ targets: policko, scale: { from: 1.08, to: 1 }, duration: 160 });
    this.prekresliKosik();
  }

  private odeber(index: number): void {
    if (this.stav !== 'nakup') return;
    this.kosik.splice(index, 1);
    beep.tick(520, 0.06);
    this.prekresliKosik();
  }

  private vysypej(): void {
    if (this.stav !== 'nakup' || this.kosik.length === 0) return;
    beep.tick(400, 0.08);
    this.kosik = [];
    this.prekresliKosik();
  }

  /** Pozice i-té tečky útraty v košíku. */
  private teckaUtraty(i: number): { x: number; y: number } {
    return {
      x: UTRATA.x0 + (i % UTRATA.vRade) * UTRATA.d,
      y: UTRATA.y0 + Math.floor(i / UTRATA.vRade) * UTRATA.d,
    };
  }

  /** Zboží v košíku (klepnutím se vrátí na regál) a útrata: číslo + tečky. */
  private prekresliKosik(): void {
    this.kosikObjekty.forEach((o) => o.destroy());
    this.kosikObjekty = [];

    this.kosik.forEach((z, i) => {
      const t = this.add
        .text(
          POLOZKY.x0 + (i % POLOZKY.vRade) * POLOZKY.dx,
          POLOZKY.y0 + Math.floor(i / POLOZKY.vRade) * POLOZKY.dy,
          z.emoji,
          { fontSize: '46px', padding: { x: 4, y: 8 } },
        )
        .setOrigin(0.5)
        .setName(`v_kosiku_${i + 1}`)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.odeber(i));
      this.kosikObjekty.push(t);
    });

    const castka = utrata(this.kosik);
    if (castka > 0) {
      this.kosikObjekty.push(
        this.add
          .text(UTRATA.cisloX, UTRATA.y0 + UTRATA.d, String(castka), {
            fontFamily: FONT,
            fontSize: '56px',
            fontStyle: 'bold',
            color: '#f1c40f',
          })
          .setOrigin(1, 0.5)
          .setName('utrata_cislo'),
      );
    }
    for (let i = 0; i < castka; i++) {
      const p = this.teckaUtraty(i);
      this.kosikObjekty.push(
        this.add.circle(p.x, p.y, UTRATA.r, ZLUTA).setStrokeStyle(2, 0xfef9e7).setName(`utrata_tecka_${i + 1}`),
      );
    }
  }

  // ---------- Karty ----------

  private vytvorKartu(karta: PenezniKarta, x: number, y: number): KartaNaObrazovce {
    const pozadi = this.add
      .rectangle(0, 0, KARTY.sirka, KARTY.vyska, BARVA_KARTY[karta.hodnota] ?? 0x1f4f8f)
      .setStrokeStyle(4, 0xd4ac0d);
    const cislo = this.add
      .text(-KARTY.sirka / 2 + 16, 0, '', { fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#f1c40f' })
      .setOrigin(0, 0.5);
    // Tečky karty po 10 v řadě, vpravo od čísla.
    const radku = Math.ceil(karta.hodnota / KARTY.vRade);
    const tecky = Array.from({ length: karta.hodnota }, (_, i) =>
      this.add
        .circle(
          KARTY.x0 + (i % KARTY.vRade) * KARTY.d,
          (Math.floor(i / KARTY.vRade) - (radku - 1) / 2) * KARTY.d,
          KARTY.r,
          ZLUTA,
        )
        .setStrokeStyle(2, 0xfef9e7)
        .setName(`${karta.kod}_tecka_${i + 1}`),
    );
    const obal = this.add.container(x, y, [pozadi, cislo, ...tecky]).setName(`karta_${karta.kod}`);
    pozadi.setInteractive({ useHandCursor: true });
    const kn: KartaNaObrazovce = { karta, obal, pozadi, cislo, tecky };
    pozadi.on('pointerdown', () => this.zaplat(kn));
    this.prekresliKartu(kn);
    return kn;
  }

  /** Zůstatek karty: plné tečky = zbývá, prázdná kolečka = utraceno dnes. */
  private prekresliKartu(kn: KartaNaObrazovce): void {
    const zbyva = penezenka().zustatek(kn.karta.kod) ?? 0;
    kn.cislo.setText(String(zbyva));
    kn.tecky.forEach((t, i) => t.setFillStyle(ZLUTA, i < zbyva ? 1 : 0));
  }

  // ---------- Placení ----------

  private zaplat(kn: KartaNaObrazovce): void {
    if (this.stav !== 'nakup') return;
    if (this.kosik.length === 0) {
      // Nejdřív vybrat zboží.
      beep.tick(300, 0.08);
      this.tweens.add({ targets: this.kosikIkona, scale: { from: 1.3, to: 1 }, duration: 300 });
      return;
    }

    const cena = utrata(this.kosik);
    const pred = penezenka().zustatek(kn.karta.kod) ?? 0;
    const platba = penezenka().zaplat(kn.karta.kod, cena);
    if (!platba.ok) {
      this.odmitni(kn);
      return;
    }

    this.stav = 'placeni';
    beep.tick(880, 0.1);
    denik.zapis({
      druh: 'prodej',
      cas: new Date().toISOString(),
      den: den().cislo,
      zbozi: this.kosik.map((z) => z.kod),
      tecky: cena,
      karta: kn.karta.kod,
    });

    // Tečky z karty odletí jedna po druhé na tečky útraty v košíku (odečítání viditelně).
    for (let i = 0; i < cena; i++) {
      const zdroj = kn.tecky[pred - 1 - i];
      if (!zdroj) continue;
      const start = { x: kn.obal.x + zdroj.x, y: kn.obal.y + zdroj.y };
      const cil = this.teckaUtraty(cena - 1 - i);
      zdroj.setFillStyle(ZLUTA, 0);
      const letici = this.add.circle(start.x, start.y, KARTY.r + 1, ZLUTA).setDepth(20);
      this.tweens.add({
        targets: letici,
        x: cil.x,
        y: cil.y,
        duration: 450,
        delay: i * 110,
        ease: 'Quad.InOut',
        onComplete: () => {
          beep.tick(600 + (i % 3) * 120, 0.05);
          letici.destroy();
          // Zaplacená tečka v košíku zezelená.
          const tecka = this.children.getByName(`utrata_tecka_${cena - i}`);
          if (tecka instanceof Phaser.GameObjects.Arc) tecka.setFillStyle(ZELENA);
        },
      });
    }
    // Číslo zůstatku se změní, až tečky doletí.
    this.time.delayedCall(cena * 110 + 550, () => {
      this.prekresliKartu(kn);
      this.hotovo();
    });
  }

  private hotovo(): void {
    beep.win();
    const fajfka = this.add
      .text(KOSIK.x, KOSIK.y, '✅', { fontSize: '130px', padding: { x: 10, y: 20 } })
      .setOrigin(0.5)
      .setDepth(30)
      .setName('zaplaceno');
    this.tweens.add({ targets: fajfka, scale: { from: 0, to: 1 }, duration: 300, ease: 'Back.Out' });
    this.time.delayedCall(1400, () => {
      fajfka.destroy();
      this.kosik = [];
      this.prekresliKosik();
      this.stav = 'nakup';
    });
  }

  private odmitni(kn: KartaNaObrazovce): void {
    beep.error();
    kn.pozadi.setFillStyle(0xc0392b);
    const x = kn.obal.x;
    this.tweens.add({
      targets: kn.obal,
      x: { from: x - 14, to: x + 14 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        kn.obal.x = x;
        kn.pozadi.setFillStyle(BARVA_KARTY[kn.karta.hodnota] ?? 0x1f4f8f);
      },
    });
    this.krizek(kn.obal.x, kn.obal.y, 80);
  }

  /** Chyba (neznámý kód, plný košík): chybový zvuk a ❌. */
  private chyba(x: number, y: number): void {
    beep.error();
    this.krizek(x, y, 110);
  }

  private krizek(x: number, y: number, velikost: number): void {
    const krizek = this.add
      .text(x, y, '❌', { fontSize: `${velikost}px`, padding: { x: 10, y: 20 } })
      .setOrigin(0.5)
      .setDepth(30)
      .setName('odmitnuto');
    this.tweens.add({ targets: krizek, alpha: { from: 1, to: 0 }, delay: 700, duration: 400, onComplete: () => krizek.destroy() });
  }
}

