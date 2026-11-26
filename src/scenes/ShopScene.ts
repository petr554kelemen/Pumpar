import Phaser from 'phaser';
import { bus, type GameEvents } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import { den } from '../services/den.ts';
import { denik } from '../services/denik.ts';
import { ZBOZI, type Zbozi, najdiZbozi, utrata, vejdeSe } from '../services/katalog.ts';
import { SLUZEBNI_KARTA } from '../services/lock.ts';
import { PENEZNI_KARTY, penezenka } from '../services/penezenka.ts';
import { teckyZaBenzin, ucet } from '../services/ucet.ts';
import { KARTY, type KartaNaObrazovce, PanelKaret, krizek } from './kartyPanel.ts';
import { addNav, type SceneKey } from './nav.ts';
import type { StationData } from './StationScene.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const ZLUTA = 0xf1c40f;
const ZELENA = 0x2ecc71;
/** Tečky za benzín jsou modré (stará verze: „1 litr benzínu = 1 modrá tečka“). */
const MODRA = 0x3498db;

/** Regál: 3 × 2 políčka se zbožím. */
const REGAL = { x0: 165, y0: 200, dx: 260, dy: 150, sirka: 240, vyska: 136, sloupcu: 3 } as const;
/** Košík dole: zboží v řadách po 8, útrata = číslo + tečky po 10 v řadě (do 30 = max. 3 řady). */
const KOSIK = { x: 425, y: 580, sirka: 790, vyska: 250 } as const;
const POLOZKY = { x0: 135, y0: 525, dx: 56, dy: 62, vRade: 8 } as const;
const UTRATA = { cisloX: 640, x0: 662, y0: 505, d: 19, r: 7, vRade: 10 } as const;
type Stav = 'nakup' | 'placeni';

// Obchod (fáze 4): hráč vybírá zboží klepnutím na regál nebo pípnutím visačky, útrata v košíku roste
// viditelně (číslo + tečky). Pak sám zvolí kartu, kterou zaplatí – pípne ji (nebo na ni klepne). Stačí-li
// zůstatek, tečky z karty odletí do košíku a nákup se zapíše do deníku; jinak ❌ a hráč ubere zboží nebo
// zkusí jinou kartu. Karty drží zůstatek po celý herní den.
// Přišel-li hráč od stojanu („🛒 Jít platit“), je v košíku napřed benzín ⛽ (modré tečky, nedá se vrátit)
// a po zaplacení se hra vrátí ke stojanu. Bez zaplacení se odejít nedá (rodič: „to se nedělá“) – navigace je
// zamčená, hráč ubere zboží, aby nákup zaplatil. Nestačí-li na samotný benzín žádná karta, obsluha pípne
// služební kartu K000 = restart (karty plné, hráč je vybere znovu, čas běží dál); jinak K000 v obchodě neplatí.
export class ShopScene extends Phaser.Scene {
  private stav: Stav = 'nakup';
  private kosik: Zbozi[] = [];
  private kosikObjekty: Phaser.GameObjects.GameObject[] = [];
  private policka = new Map<string, Phaser.GameObjects.Container>();
  private panel!: PanelKaret;
  private kosikIkona!: Phaser.GameObjects.Text;
  /** Benzín na účtu (setiny litru) a jeho cena v tečkách; 0 = obchod bez benzínu. */
  private benzinSetin = 0;
  private benzin = 0;

  constructor() {
    super('Shop' satisfies SceneKey);
  }

  create(): void {
    this.stav = 'nakup';
    this.kosik = [];
    this.kosikObjekty = [];
    this.policka.clear();
    this.benzinSetin = ucet().benzin ?? 0;
    this.benzin = this.benzinSetin > 0 ? teckyZaBenzin(this.benzinSetin) : 0;
    addNav(this, { zamceno: () => this.benzin > 0, priPokusu: () => this.nezaplaceno() });

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

    this.panel = new PanelKaret(this, (kn) => this.zaplat(kn));

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
        const k = this.panel.najdi(info.kod);
        if (k) this.zaplat(k);
        else if (info.kod === SLUZEBNI_KARTA && this.lzeStornovat()) this.stornoBenzinu();
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
    if (!vejdeSe(this.kosik, z, this.benzin)) {
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

    // Benzín je první položka (nedá se vrátit), zboží za ním.
    const posun = this.benzin > 0 ? 1 : 0;
    const pozice = (i: number) => ({
      x: POLOZKY.x0 + (i % POLOZKY.vRade) * POLOZKY.dx,
      y: POLOZKY.y0 + Math.floor(i / POLOZKY.vRade) * POLOZKY.dy,
    });
    if (posun) {
      const p = pozice(0);
      this.kosikObjekty.push(
        this.add.text(p.x, p.y, '⛽', { fontSize: '46px', padding: { x: 4, y: 8 } }).setOrigin(0.5).setName('v_kosiku_benzin'),
      );
    }
    this.kosik.forEach((z, i) => {
      const p = pozice(i + posun);
      const t = this.add
        .text(p.x, p.y, z.emoji, { fontSize: '46px', padding: { x: 4, y: 8 } })
        .setOrigin(0.5)
        .setName(`v_kosiku_${i + 1}`)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => this.odeber(i));
      this.kosikObjekty.push(t);
    });

    const castka = utrata(this.kosik, this.benzin);
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
        this.add
          .circle(p.x, p.y, UTRATA.r, i < this.benzin ? MODRA : ZLUTA)
          .setStrokeStyle(2, 0xfef9e7)
          .setName(`utrata_tecka_${i + 1}`),
      );
    }
  }

  // ---------- Placení ----------

  private zaplat(kn: KartaNaObrazovce): void {
    if (this.stav !== 'nakup') return;
    if (this.kosik.length === 0 && this.benzin === 0) {
      // Nejdřív vybrat zboží.
      beep.tick(300, 0.08);
      this.tweens.add({ targets: this.kosikIkona, scale: { from: 1.3, to: 1 }, duration: 300 });
      return;
    }

    const cena = utrata(this.kosik, this.benzin);
    const pred = penezenka().zustatek(kn.karta.kod) ?? 0;
    const platba = penezenka().zaplat(kn.karta.kod, cena);
    if (!platba.ok) {
      this.panel.odmitni(kn);
      return;
    }

    this.stav = 'placeni';
    beep.tick(880, 0.1);
    denik.zapis({
      druh: 'prodej',
      cas: new Date().toISOString(),
      den: den().cislo,
      zbozi: this.kosik.map((z) => z.kod),
      ...(this.benzinSetin > 0 ? { benzin: this.benzinSetin } : {}),
      tecky: cena,
      karta: kn.karta.kod,
    });

    // Tečky z karty odletí jedna po druhé na tečky útraty v košíku (odečítání viditelně).
    this.panel.odeberTecky(kn, pred, cena).forEach((start, i) => {
      const cil = this.teckaUtraty(cena - 1 - i);
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
    });
    // Číslo zůstatku se změní, až tečky doletí.
    this.time.delayedCall(cena * 110 + 550, () => {
      this.panel.prekresli(kn);
      this.hotovo();
    });
  }

  /** Pokus odejít s nezaplaceným benzínem: chyba a zatřesení ⛽ v košíku (napřed zaplatit). */
  private nezaplaceno(): void {
    beep.error();
    const benzin = this.children.getByName('v_kosiku_benzin');
    if (benzin) this.tweens.add({ targets: benzin, scale: { from: 1.6, to: 1 }, duration: 400, ease: 'Back.Out' });
    this.tweens.add({ targets: this.kosikIkona, scale: { from: 1.3, to: 1 }, duration: 300 });
  }

  /** Storno benzínu jen tehdy, když ho nezaplatí žádná karta (karty jsou za den vyčerpané). */
  private lzeStornovat(): boolean {
    if (this.benzin === 0) return false;
    return PENEZNI_KARTY.every((k) => (penezenka().zustatek(k.kod) ?? 0) < this.benzin);
  }

  /**
   * Storno služební kartou = hra jako na začátku (rozhodnutí rodiče): karty zase plné a neaktivní, účet prázdný,
   * hráč si karty vybere znovu a jde ke stojanu. Čas dne běží dál a deník zůstává – hráč má hlídat, aby restart potřeba nebyl.
   */
  private stornoBenzinu(): void {
    if (this.stav !== 'nakup') return;
    this.stav = 'placeni';
    beep.tick(500, 0.1);
    penezenka().naplnVse();
    ucet().vyprazdni();
    this.scene.start('Banka' satisfies SceneKey);
  }

  private hotovo(): void {
    beep.win();
    const fajfka = this.add
      .text(KOSIK.x, KOSIK.y, '✅', { fontSize: '130px', padding: { x: 10, y: 20 } })
      .setOrigin(0.5)
      .setDepth(30)
      .setName('zaplaceno');
    this.tweens.add({ targets: fajfka, scale: { from: 0, to: 1 }, duration: 300, ease: 'Back.Out' });
    const sBenzinem = this.benzin > 0;
    if (sBenzinem) ucet().benzin = null;
    this.time.delayedCall(1400, () => {
      if (sBenzinem) {
        // Benzín zaplacen → zpět ke stojanu (v režimu „+ Obchod“ s novou předvolbou).
        this.scene.start('Station' satisfies SceneKey, { poPlatbe: true } satisfies StationData);
        return;
      }
      fajfka.destroy();
      this.kosik = [];
      this.prekresliKosik();
      this.stav = 'nakup';
    });
  }

  /** Chyba (neznámý kód, plný košík): chybový zvuk a ❌. */
  private chyba(x: number, y: number): void {
    krizek(this, x, y);
  }
}

