import Phaser from 'phaser';
import { bus, type GameEvents } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import { CENA_KOLA, KOLA, type KoloId, cenaKol, noveAuto, zaplat } from '../services/air.ts';
import { addNav, type SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const NOMINALY = [10, 15, 20] as const;
const ZLUTA = 0xf1c40f;

/** Plánek auta: střed karoserie a rozmístění kol (kola vytočená ven jako nohy „přejeté žáby“). */
const AUTO = { x: 430, y: 400 };
const KOLO_POZICE: Readonly<Record<KoloId, { x: number; y: number; uhel: number }>> = {
  LP: { x: -145, y: -105, uhel: -25 },
  PP: { x: 145, y: -105, uhel: 25 },
  LZ: { x: -145, y: 105, uhel: 25 },
  PZ: { x: 145, y: 105, uhel: -25 },
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
  obal: Phaser.GameObjects.Container;
  pozadi: Phaser.GameObjects.Rectangle;
  tecky: Phaser.GameObjects.Arc[];
}

type Stav = 'vyber' | 'placeni' | 'hotovo';

// Nápověda (3 tečky u vybraného kola) – přepíná rodič; pamatuje se mezi auty.
let napovedaZapnuta = true;

// Dofukování kol (nápad hráče): auto jako plánek ze shora, podhuštěná kola rozplácnutá.
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
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.dalsiAuto.on('pointerdown', () => this.odjed());

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
    // „Nohy“ – nápravy ke kolům
    g.lineStyle(10, 0x5d6d7e);
    for (const id of KOLA) g.lineBetween(0, KOLO_POZICE[id].y, KOLO_POZICE[id].x * 0.8, KOLO_POZICE[id].y);
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
    const obal = this.add.container(p.x, p.y, [ramecek, g]).setAngle(p.uhel).setName(`kolo_${id}`);
    obal.setSize(90, 100).setInteractive({ useHandCursor: true });
    const kolo: Kolo = { id, obal, g, ramecek, podhustene, vybrane: false, plnost: podhustene ? 0 : 1, napoveda: [] };
    obal.on('pointerdown', () => this.klepniNaKolo(kolo));
    this.auto.add(obal);
    this.kresliKolo(kolo);
    return kolo;
  }

  private kresliKolo(k: Kolo): void {
    const t = k.plnost;
    const w = Phaser.Math.Linear(84, 38, t); // splasklé = široké, rozplácnuté
    const h = Phaser.Math.Linear(50, 76, t);
    const g = k.g;
    g.clear();
    if (t < 1) {
      // Vyboulené boky splasklé pneumatiky („přejetá žába“) – světlejší, čím víc je splasklá.
      const boule = (1 - t) * 26;
      g.fillStyle(0x4d4d4d);
      g.fillEllipse(0, 0, w + boule, h * 0.8);
    }
    g.fillStyle(0x1b1b1b);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.3);
    g.lineStyle(3, 0x4a4a4a);
    for (let i = 1; i < 5; i++) {
      const y = -h / 2 + (i * h) / 5;
      g.lineBetween(-w / 2 + 6, y, w / 2 - 6, y);
    }

    k.ramecek.clear();
    if (k.vybrane) {
      k.ramecek.lineStyle(5, ZLUTA);
      k.ramecek.strokeRoundedRect(-w / 2 - 9, -h / 2 - 9, w + 18, h + 18, 16);
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
        .circle(p.x + smer * 78, p.y + (i - 1) * 26, 10, ZLUTA)
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
    const karta: Karta = { hodnota, obal, pozadi, tecky };
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

    const platba = zaplat(karta.hodnota, cenaKol(vybrana.length));
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
    for (let i = 0; i < cena; i++) {
      const zdroj = karta.tecky[i];
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

  private hotovo(): void {
    this.stav = 'hotovo';
    beep.win();
    this.dalsiAuto.setVisible(true);
    this.tweens.add({ targets: this.dalsiAuto, scale: { from: 0.6, to: 1 }, duration: 300, ease: 'Back.Out' });
  }

  private odjed(): void {
    if (this.stav !== 'hotovo') return;
    this.dalsiAuto.setVisible(false);
    beep.tick(500, 0.1);
    const stare = this.auto;
    this.tweens.add({ targets: stare, y: -400, duration: 900, ease: 'Quad.In', onComplete: () => stare.destroy() });

    // Karty znovu plné, dočasná karta pryč.
    this.docasnaKarta?.obal.destroy();
    this.docasnaKarta = null;
    this.karty.forEach((k) => k.tecky.forEach((t) => t.setFillStyle(ZLUTA, 1)));

    this.time.delayedCall(700, () => {
      this.vytvorAuto(1100);
      this.tweens.add({
        targets: this.auto,
        y: AUTO.y,
        duration: 1000,
        ease: 'Quad.Out',
        onComplete: () => {
          this.stav = 'vyber';
        },
      });
    });
  }

  private svetovaPozice(k: Kolo): { x: number; y: number } {
    const p = KOLO_POZICE[k.id];
    return { x: this.auto.x + p.x, y: this.auto.y + p.y };
  }
}
