import Phaser from 'phaser';
import { bus, type GameEvents } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import { CENA_KOLA, KOLA, type KoloId, cenaKol, noveAuto, zaplat } from '../services/air.ts';
import { addNav, type SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const NOMINALY = [10, 15, 20] as const;
const ZLUTA = 0xf1c40f;

/** Plánek auta ze shora; kola v rozích nakreslená z boku (kulatá s ráfkem), aby bylo vidět splasknutí. */
const AUTO = { x: 430, y: 400 };
const R_KOLA = 42;
const KOLO_POZICE: Readonly<Record<KoloId, { x: number; y: number }>> = {
  LP: { x: -138, y: -105 },
  PP: { x: 138, y: -105 },
  LZ: { x: -138, y: 105 },
  PZ: { x: 138, y: 105 },
};

interface Kolo {
  id: KoloId;
  obal: Phaser.GameObjects.Container;
  g: Phaser.GameObjects.Graphics;
  ramecek: Phaser.GameObjects.Graphics;
  podhustene: boolean;
  vybrane: boolean;
  /** 0 = splasklé (rozplácnuté), 1 = plné. */
  plnost: number;
  napoveda: Phaser.GameObjects.Arc[];
}

interface Karta {
  hodnota: number;
  /** Kolik teček na kartě ještě zbývá (u jednoho auta lze platit vícekrát). */
  zbyva: number;
  obal: Phaser.GameObjects.Container;
  pozadi: Phaser.GameObjects.Rectangle;
  tecky: Phaser.GameObjects.Arc[];
}

type Stav = 'vyber' | 'placeni' | 'odjezd';

// Nápověda (3 tečky u vybraného kola) – přepíná rodič; pamatuje se mezi auty.
let napovedaZapnuta = true;

// Dofukování kol (nápad hráče): auto jako plánek ze shora, kola z boku – splasklé má dole plošku.
// Hráč vybere kola, zaplatí jednou kartou (10/15/20 klepnutím, nebo pípnutím bankovky B…).
// Málo teček = odmítnuto. Tečky z karty odletí ke kolům, zbytek zůstane na kartě.
export class AirScene extends Phaser.Scene {
  private stav: Stav = 'vyber';
  private auto!: Phaser.GameObjects.Container;
  private kola: Kolo[] = [];
  private karty: Karta[] = [];
  private docasnaKarta: Karta | null = null;
  private dalsiAuto!: Phaser.GameObjects.Text;
  private napovedaTlacitko!: Phaser.GameObjects.Text;

  constructor() {
    super('Air' satisfies SceneKey);
  }

  create(): void {
    this.stav = 'vyber';
    this.kola = [];
    this.karty = [];
    this.docasnaKarta = null;
    addNav(this);

    NOMINALY.forEach((h, i) => this.karty.push(this.vytvorKartu(h, 1010, 175 + i * 185)));
    this.vytvorAuto(AUTO.y);

    this.dalsiAuto = this.add
      .text(AUTO.x, 680, '🚗 ➡️', { fontSize: '56px', backgroundColor: '#37404c', padding: { x: 18, y: 4 } })
      .setOrigin(0.5)
      .setName('dalsi_auto')
      .setInteractive({ useHandCursor: true });
    this.dalsiAuto.on('pointerdown', () => this.zkusOdjet());

    // Přepínač nápovědy – nenápadně pro rodiče.
    this.napovedaTlacitko = this.add
      .text(20, 690, '', { fontFamily: FONT, fontSize: '18px', color: '#95a5a6' })
      .setOrigin(0, 0.5)
      .setName('napoveda_prepinac')
      .setInteractive({ useHandCursor: true });
    this.napovedaTlacitko.on('pointerdown', () => {
      napovedaZapnuta = !napovedaZapnuta;
      this.ukazNapovedu();
    });
    this.ukazNapovedu();

    const odhlasit = bus.on('scan', (d) => this.onScan(d));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, odhlasit);
  }

  // ---------- Auto ----------

  private vytvorAuto(y: number): void {
    this.auto = this.add.container(AUTO.x, y).setName('auto');
    const g = this.add.graphics().setName('auto_karoserie');
    // Karoserie ze shora
    g.fillStyle(0xc0392b);
    g.fillRoundedRect(-85, -165, 170, 330, 45);
    g.fillStyle(0x85c1e9);
    g.fillRoundedRect(-62, -95, 124, 50, 12); // přední sklo
    g.fillRoundedRect(-58, 70, 116, 36, 10); // zadní sklo
    g.fillStyle(0xa93226);
    g.fillRoundedRect(-62, -40, 124, 105, 14); // střecha
    g.fillStyle(0xf9e79f);
    g.fillCircle(-55, -152, 10); // světla
    g.fillCircle(55, -152, 10);
    this.auto.add(g);

    const stav = noveAuto();
    this.kola = KOLA.map((id) => this.vytvorKolo(id, stav[id]));
  }

  private vytvorKolo(id: KoloId, podhustene: boolean): Kolo {
    const p = KOLO_POZICE[id];
    const g = this.add.graphics();
    const ramecek = this.add.graphics();
    const obal = this.add.container(p.x, p.y, [ramecek, g]).setName(`kolo_${id}`);
    obal.setSize(R_KOLA * 2.6, R_KOLA * 2.4).setInteractive({ useHandCursor: true });
    const kolo: Kolo = { id, obal, g, ramecek, podhustene, vybrane: false, plnost: podhustene ? 0 : 1, napoveda: [] };
    obal.on('pointerdown', () => this.klepniNaKolo(kolo));
    this.auto.add(obal);
    this.kresliKolo(kolo);
    return kolo;
  }

  /** Kolo z boku. Splasklé (plnost 0) má dole plošku a boky vyboulené do stran; ráfek klesne níž. */
  private kresliKolo(k: Kolo): void {
    const t = k.plnost;
    const R = R_KOLA;
    const ploska = R * Phaser.Math.Linear(0.66, 1, t); // y spodní plošky (1 = žádná ploška)
    const boule = (1 - t) * 0.4; // vyboulení boků u země
    const body: Phaser.Math.Vector2[] = [];
    for (let a = 0; a < 360; a += 5) {
      const rad = Phaser.Math.DegToRad(a);
      const y = Math.min(Math.sin(rad) * R, ploska);
      const dole = Math.max(0, y / R); // 0 nahoře/uprostřed, 1 u země
      body.push(new Phaser.Math.Vector2(Math.cos(rad) * R * (1 + boule * dole * dole), y));
    }

    const g = k.g;
    g.clear();
    g.fillStyle(0x1b1b1b);
    g.fillPoints(body, true);
    // Ráfek s paprsky (jako 🛞); u splasklého kola klesne k zemi.
    const ry = (1 - t) * R * 0.05;
    g.fillStyle(0xaab7c4);
    g.fillCircle(0, ry, R * 0.52);
    g.lineStyle(5, 0x5d6d7e);
    for (let i = 0; i < 5; i++) {
      const rad = Phaser.Math.DegToRad(-90 + i * 72);
      g.lineBetween(0, ry, Math.cos(rad) * R * 0.46, ry + Math.sin(rad) * R * 0.46);
    }
    g.fillStyle(0x34495e);
    g.fillCircle(0, ry, R * 0.16);

    k.ramecek.clear();
    if (k.vybrane) {
      k.ramecek.lineStyle(5, ZLUTA);
      k.ramecek.strokeCircle(0, 0, R * (1 + boule) + 10);
    }
  }

  private klepniNaKolo(k: Kolo): void {
    if (this.stav !== 'vyber') return;
    if (!k.podhustene) {
      // Plné kolo – není co foukat.
      beep.tick(260, 0.08);
      this.tweens.add({ targets: k.obal, scale: { from: 1.08, to: 1 }, duration: 150 });
      return;
    }
    k.vybrane = !k.vybrane;
    beep.tick(k.vybrane ? 760 : 520, 0.06);
    this.kresliKolo(k);
    this.prekresliNapovedu(k);
  }

  /** 3 tečky vedle vybraného kola (jen se zapnutou nápovědou). */
  private prekresliNapovedu(k: Kolo): void {
    k.napoveda.forEach((t) => t.destroy());
    k.napoveda = [];
    if (!k.vybrane || !napovedaZapnuta) return;
    const p = KOLO_POZICE[k.id];
    const smer = Math.sign(p.x);
    for (let i = 0; i < CENA_KOLA; i++) {
      const t = this.add
        .circle(p.x + smer * (R_KOLA * 1.5 + 22), p.y + (i - 1) * 26, 10, ZLUTA)
        .setStrokeStyle(2, 0xfef9e7)
        .setName(`napoveda_${k.id}_${i + 1}`);
      this.auto.add(t);
      this.tweens.add({ targets: t, scale: { from: 0, to: 1 }, duration: 180, delay: i * 60, ease: 'Back.Out' });
      k.napoveda.push(t);
    }
  }

  private ukazNapovedu(): void {
    this.napovedaTlacitko.setText(napovedaZapnuta ? '💡 nápověda: zapnuto' : '💡 nápověda: vypnuto');
    this.kola.forEach((k) => this.prekresliNapovedu(k));
  }

  // ---------- Karty ----------

  private vytvorKartu(hodnota: number, x: number, y: number): Karta {
    const sirka = 300;
    const vyska = 165;
    const pozadi = this.add.rectangle(0, 0, sirka, vyska, 0x1f4f8f).setStrokeStyle(4, 0xd4ac0d);
    const cislo = this.add
      .text(-sirka / 2 + 22, 0, String(hodnota), { fontFamily: FONT, fontSize: '64px', fontStyle: 'bold', color: '#f1c40f' })
      .setOrigin(0, 0.5);
    const tecky: Phaser.GameObjects.Arc[] = [];
    const radku = Math.ceil(hodnota / 5);
    for (let i = 0; i < hodnota; i++) {
      const r = Math.floor(i / 5);
      const s = i % 5;
      tecky.push(
        this.add
          .circle(10 + s * 26, (r - (radku - 1) / 2) * 26, 10, ZLUTA)
          .setStrokeStyle(2, 0xfef9e7)
          .setName(`karta_${hodnota}_tecka_${i + 1}`),
      );
    }
    const obal = this.add.container(x, y, [pozadi, cislo, ...tecky]).setName(`karta_${hodnota}`);
    pozadi.setInteractive({ useHandCursor: true });
    const karta: Karta = { hodnota, zbyva: hodnota, obal, pozadi, tecky };
    pozadi.on('pointerdown', () => this.plat(karta));
    return karta;
  }

  private onScan({ info }: GameEvents['scan']): void {
    if (info.druh !== 'bankovka' || this.stav !== 'vyber') return;
    // Pípnutá bankovka: použije se karta na obrazovce se stejnou hodnotou, jinak dočasná karta.
    const karta = this.karty.find((k) => k.hodnota === info.hodnota) ?? this.vytvorDocasnouKartu(info.hodnota);
    this.plat(karta);
  }

  private vytvorDocasnouKartu(hodnota: number): Karta {
    this.docasnaKarta?.obal.destroy();
    const karta = this.vytvorKartu(hodnota, 1010, 360);
    karta.obal.setDepth(10);
    this.docasnaKarta = karta;
    return karta;
  }

  private plat(karta: Karta): void {
    if (this.stav !== 'vyber') return;
    const vybrana = this.kola.filter((k) => k.vybrane);
    if (vybrana.length === 0) {
      // Nejdřív vybrat kola.
      beep.tick(300, 0.08);
      this.kola.filter((k) => k.podhustene).forEach((k) =>
        this.tweens.add({ targets: k.obal, scale: { from: 1.15, to: 1 }, duration: 250 }),
      );
      return;
    }

    const platba = zaplat(karta.zbyva, cenaKol(vybrana.length));
    if (!platba.ok) {
      this.odmitni(karta);
      return;
    }

    this.stav = 'placeni';
    beep.tick(880, 0.1);
    vybrana.forEach((k) => {
      k.napoveda.forEach((t) => t.destroy());
      k.napoveda = [];
    });

    // Tečky z karty odletí ke kolům (odečítání viditelně): 3 na každé kolo.
    const cena = cenaKol(vybrana.length);
    const prvni = karta.hodnota - karta.zbyva; // dřív utracené tečky jsou na začátku
    karta.zbyva -= cena;
    for (let i = 0; i < cena; i++) {
      const zdroj = karta.tecky[prvni + i];
      const kolo = vybrana[Math.floor(i / CENA_KOLA)];
      if (!zdroj || !kolo) continue;
      const start = { x: karta.obal.x + zdroj.x, y: karta.obal.y + zdroj.y };
      zdroj.setFillStyle(ZLUTA, 0); // na kartě zůstane prázdné kolečko
      const cil = this.svetovaPozice(kolo);
      const letici = this.add.circle(start.x, start.y, 10, ZLUTA).setDepth(20);
      this.tweens.add({
        targets: letici,
        x: cil.x,
        y: cil.y,
        duration: 450,
        delay: i * 140,
        ease: 'Quad.InOut',
        onComplete: () => {
          beep.tick(600 + (i % CENA_KOLA) * 120, 0.05);
          letici.destroy();
        },
      });
    }

    // Po doletu teček foukání kol jedno po druhém.
    this.time.delayedCall(cena * 140 + 500, () => this.nafoukni(vybrana, 0));
  }

  private odmitni(karta: Karta): void {
    beep.error();
    karta.pozadi.setFillStyle(0xc0392b);
    const x = karta.obal.x;
    this.tweens.add({
      targets: karta.obal,
      x: { from: x - 14, to: x + 14 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        karta.obal.x = x;
        karta.pozadi.setFillStyle(0x1f4f8f);
        // Odmítnutá pípnutá bankovka zmizí.
        if (karta === this.docasnaKarta) {
          this.tweens.add({ targets: karta.obal, alpha: 0, delay: 500, duration: 300, onComplete: () => karta.obal.destroy() });
          this.docasnaKarta = null;
        }
      },
    });
    const krizek = this.add
      .text(karta.obal.x, karta.obal.y, '❌', { fontSize: '110px', padding: { x: 10, y: 20 } })
      .setOrigin(0.5)
      .setDepth(30)
      .setName('odmitnuto');
    this.tweens.add({ targets: krizek, alpha: { from: 1, to: 0 }, delay: 700, duration: 400, onComplete: () => krizek.destroy() });
  }

  private nafoukni(kola: Kolo[], index: number): void {
    const k = kola[index];
    if (!k) {
      this.hotovo();
      return;
    }
    const stav = { t: k.plnost };
    this.tweens.add({
      targets: stav,
      t: 1,
      duration: 1300,
      ease: 'Sine.Out',
      onUpdate: () => {
        k.plnost = stav.t;
        this.kresliKolo(k);
      },
      onComplete: () => {
        k.podhustene = false;
        k.vybrane = false;
        k.plnost = 1;
        this.kresliKolo(k);
        beep.tick(1320, 0.18); // cink
        this.nafoukni(kola, index + 1);
      },
    });
    // Syčení vzduchu – rychlé tiché cvakání
    this.time.addEvent({ delay: 90, repeat: 13, callback: () => beep.tick(2400 + Math.random() * 600, 0.02) });
  }

  /** Po nafouknutí: zbývají-li prázdná kola, dá se doplatit; jinak oslava. */
  private hotovo(): void {
    this.stav = 'vyber';
    if (this.kola.some((k) => k.podhustene)) {
      beep.tick(700, 0.08);
      return;
    }
    beep.win();
    this.tweens.add({ targets: this.dalsiAuto, scale: { from: 0.6, to: 1 }, duration: 300, ease: 'Back.Out' });
  }

  /** S prázdným kolem se nejezdí: nad prázdnými koly zabliká ❗ a auto zůstane. */
  private zkusOdjet(): void {
    if (this.stav !== 'vyber') return;
    const prazdna = this.kola.filter((k) => k.podhustene);
    if (prazdna.length === 0) {
      this.odjed();
      return;
    }
    beep.error();
    this.tweens.add({
      targets: this.auto,
      x: { from: AUTO.x - 8, to: AUTO.x + 8 },
      duration: 70,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.auto.setX(AUTO.x),
    });
    for (const k of prazdna) {
      const p = KOLO_POZICE[k.id];
      const vykricnik = this.add
        .text(p.x, p.y - R_KOLA - 38, '❗', { fontSize: '64px', padding: { x: 8, y: 14 } })
        .setOrigin(0.5)
        .setName(`varovani_${k.id}`);
      this.auto.add(vykricnik);
      this.tweens.add({
        targets: vykricnik,
        alpha: { from: 1, to: 0.1 },
        duration: 220,
        yoyo: true,
        repeat: 3,
        onComplete: () => vykricnik.destroy(),
      });
    }
  }

  private odjed(): void {
    this.stav = 'odjezd';
    this.dalsiAuto.setVisible(false);
    beep.tick(500, 0.1);
    const stare = this.auto;
    this.tweens.add({ targets: stare, y: -400, duration: 900, ease: 'Quad.In', onComplete: () => stare.destroy() });

    // Karty znovu plné, dočasná karta pryč.
    this.docasnaKarta?.obal.destroy();
    this.docasnaKarta = null;
    this.karty.forEach((k) => {
      k.zbyva = k.hodnota;
      k.tecky.forEach((t) => t.setFillStyle(ZLUTA, 1));
    });

    this.time.delayedCall(700, () => {
      this.vytvorAuto(1100);
      this.tweens.add({
        targets: this.auto,
        y: AUTO.y,
        duration: 1000,
        ease: 'Quad.Out',
        onComplete: () => {
          this.stav = 'vyber';
          this.dalsiAuto.setVisible(true);
        },
      });
    });
  }

  private svetovaPozice(k: Kolo): { x: number; y: number } {
    const p = KOLO_POZICE[k.id];
    return { x: this.auto.x + p.x, y: this.auto.y + p.y };
  }
}
