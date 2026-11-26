import Phaser from 'phaser';
import * as beep from '../services/beep.ts';
import { bus } from '../services/eventBus.ts';
import { den } from '../services/den.ts';
import { KodovaKlavesnice, type Role, formatCas, odemyka } from '../services/lock.ts';
import { cifernik, kresliRucicky, velkeHodiny } from './hodiny.ts';
import type { SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const LCD_FONT = '"Courier New", Courier, monospace';

const BARVA = {
  zed: 0x3a4350,
  zedSvetla: 0x55606e,
  okno: 0x1b2027,
  oknoSvitici: 0xfff1a8,
  dvere: 0x26303a,
  panel: 0x2b323b,
  lcd: 0x9eb398,
  lcdChyba: 0xe8a39b,
  lcdText: '#142214',
  klavesa: 0xe8ebee,
  zelena: 0x2ecc71,
  cervena: 0xe74c3c,
  ctecka: 0x11161b,
  cedulkaOtevreno: 0xb8f5c9,
} as const;

/** Hodiny nad dveřmi. */
const HODINY = { x: 515, y: 232, r: 62 } as const;

/** Po odemčení přejde hra sem. */
const PO_ODEMCENI: SceneKey = 'Banka'; // v bance aktivace karet na kolo, pak stojan

// Zamčená benzínka (nápad hráče): bez benzináře je zavřeno. Na začátku volba, kdo přichází (lock.ts → Role):
// 🧑‍🔧 obsluha odemyká kódem na klávesnici u dveří (hvězdičky, ✅ / Enter) nebo služební kartou – kdykoli;
// 🚗 zákazník čeká na otevírací dobu (hodiny nad dveřmi + cedulka „otevřeno od“ = učení hodin), pak klepne na dveře.
// Hodiny ukazují herní čas (den.ts): otevírá se v 6:00–8:00, odemčením / vstupem začíná 20minutová směna.
// Prototyp do dílny ✏️ – kód a karta viz lock.ts.
export class LockScene extends Phaser.Scene {
  private klavesnice!: KodovaKlavesnice;
  private oteviram = false;
  private role: Role | null = null;
  private volba!: Phaser.GameObjects.Container;
  private zakaznik!: Phaser.GameObjects.Text;

  private lcd!: Phaser.GameObjects.Rectangle;
  private displej!: Phaser.GameObjects.Text;
  private terminal!: Phaser.GameObjects.Container;
  private napis!: Phaser.GameObjects.Text;
  private okno!: Phaser.GameObjects.Rectangle;
  private dvere!: Phaser.GameObjects.Rectangle;
  private zakaz!: Phaser.GameObjects.Text;
  private zamek!: Phaser.GameObjects.Text;
  private led!: Phaser.GameObjects.Arc;
  private hodiny!: Phaser.GameObjects.Container;
  private rucicky!: Phaser.GameObjects.Graphics;
  private cedulka!: Phaser.GameObjects.Rectangle;
  /** Otevírací doba herního dne (6:00–8:00). */
  private od!: Date;
  private otviraciDoba = false;

  constructor() {
    super('Lock' satisfies SceneKey);
  }

  create(): void {
    this.klavesnice = new KodovaKlavesnice();
    this.oteviram = false;
    this.od = den().otevirackaJakoCas;
    this.otviraciDoba = false;
    this.role = null;

    this.kresliBenzinku();
    this.kresliTerminal();
    this.terminal.setVisible(false);
    this.zakaznik = this.add.text(990, 520, '🚗', { fontSize: '150px', padding: { x: 12, y: 12 } }).setOrigin(0.5).setVisible(false).setName('zakaznik');
    this.dvere.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.klepnutiNaDvere());
    this.tik();
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.tik() });
    // Časové znamení před otevírací dobou (nostalgie rodiče – rozhlas): 3 pípnutí, poslední delší přesně v čas.
    const doOtevreni = den().otevreniV - Date.now();
    [2000, 1000, 0].forEach((pred) => {
      if (doOtevreni - pred > 0) this.time.delayedCall(doOtevreni - pred, () => beep.casoveZnameni(pred === 0));
    });
    this.kresliVolbu();

    const odhlasit = [
      bus.on('scan', ({ kod }) => {
        if (this.role === 'obsluha') this.zkus(odemyka(kod));
      }),
      // Číslice psané na klávesnici počítače se ukazují jako hvězdičky (Enter = potvrdit).
      bus.on('psani', ({ text }) => {
        if (this.role === 'obsluha' && !this.oteviram && /^\d+$/.test(text)) {
          this.klavesnice.nastav(text);
          this.prekresli();
        }
      }),
    ];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => odhlasit.forEach((f) => f()));
  }

  // ---------- Volba: kdo přichází ----------

  private kresliVolbu(): void {
    const prvky: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(0, 0, 1280, 720, 0x0d1117, 0.82).setOrigin(0).setInteractive(),
    ];
    const moznosti: { role: Role; ikona: string; pod: string; x: number; barva: number }[] = [
      { role: 'obsluha', ikona: '🧑‍🔧', pod: '🔑 💳', x: 400, barva: 0x2e86de },
      { role: 'zakaznik', ikona: '🚗', pod: '🕐', x: 880, barva: 0x27ae60 },
    ];
    for (const m of moznosti) {
      const pozadi = this.add.rectangle(0, 0, 380, 420, m.barva).setStrokeStyle(8, 0xffffff).setInteractive({ useHandCursor: true });
      const ikona = this.add.text(0, -50, m.ikona, { fontSize: '170px', padding: { x: 14, y: 14 } }).setOrigin(0.5);
      const pod = this.add.text(0, 140, m.pod, { fontSize: '64px', padding: { x: 8, y: 8 } }).setOrigin(0.5);
      const obal = this.add.container(m.x, 360, [pozadi, ikona, pod]).setName(`volba_${m.role}`);
      pozadi.on('pointerdown', () => this.zvol(m.role));
      prvky.push(obal);
    }
    this.volba = this.add.container(0, 0, prvky).setDepth(10).setName('volba');
  }

  private zvol(role: Role): void {
    beep.tick(700, 0.08);
    this.role = role;
    this.volba.destroy();
    if (role === 'obsluha') {
      this.terminal.setVisible(true);
    } else {
      this.zakaznik.setVisible(true);
      if (this.otviraciDoba) this.rozsvit();
    }
  }

  // ---------- Benzínka (vlevo) ----------

  private kresliBenzinku(): void {
    // Budova
    this.add.rectangle(70, 160, 580, 500, BARVA.zed).setOrigin(0).setName('budova');
    this.add.rectangle(40, 130, 640, 34, BARVA.zedSvetla).setOrigin(0).setName('strecha');
    this.napis = this.add
      .text(360, 72, '⛽ BENZÍNKA', { fontFamily: FONT, fontSize: '56px', fontStyle: 'bold', color: '#59636f', padding: { x: 8, y: 8 } })
      .setOrigin(0.5)
      .setName('napis');

    // Výloha
    this.okno = this.add.rectangle(100, 308, 280, 230, BARVA.okno).setOrigin(0).setStrokeStyle(8, 0x8a96a3).setName('okno');

    // Dveře se zámkem a zákazem
    this.add.rectangle(410, 300, 210, 360, 0x8a96a3).setOrigin(0).setName('zarubne');
    this.dvere = this.add.rectangle(418, 308, 194, 352, BARVA.dvere).setOrigin(0).setName('dvere');
    this.zakaz = this.add.text(515, 535, '🚫', { fontSize: '90px', padding: { x: 10, y: 10 } }).setOrigin(0.5).setName('zakaz');
    this.zamek = this.add.text(588, 615, '🔒', { fontSize: '36px', padding: { x: 6, y: 6 } }).setOrigin(0.5).setName('zamek');

    // Hodiny nad dveřmi (herní čas – den.ts) – učení hodin.
    const hodiny = velkeHodiny(this, HODINY.x, HODINY.y, HODINY.r);
    this.hodiny = hodiny.obal.setName('hodiny');
    this.rucicky = hodiny.rucicky;

    // Cedulka na dveřích: OTEVŘENO OD + stejné hodiny v malém + čas číslem.
    this.cedulka = this.add.rectangle(428, 320, 174, 130, 0xffffff).setOrigin(0).setStrokeStyle(4, 0x8a96a3).setName('cedulka');
    this.add.text(515, 336, 'OTEVŘENO OD', { fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#1e242b' }).setOrigin(0.5);
    const maleRucicky = this.add.graphics();
    kresliRucicky(maleRucicky, 38, this.od, false);
    this.add.container(472, 400, [cifernik(this, 38), maleRucicky]).setName('cedulka_hodiny');
    this.add
      .text(560, 400, formatCas(this.od), { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#1e242b' })
      .setOrigin(0.5)
      .setName('cedulka_cas');
  }

  // ---------- Hodiny ----------

  /** Každou čtvrtvteřinu: posunout ručičky; v otevírací době rozsvítit cedulku. */
  private tik(): void {
    const ted = Date.now();
    kresliRucicky(this.rucicky, HODINY.r, den().cas(ted), true);
    if (!this.otviraciDoba && den().jeOtviraciDoba(ted)) {
      this.otviraciDoba = true;
      this.cedulka.setFillStyle(BARVA.cedulkaOtevreno);
      this.tweens.add({ targets: this.cedulka, alpha: 0.5, duration: 200, yoyo: true, repeat: 2 });
      // Zákazníkovi benzínku „odemkl benzinář“ – rozsvítí se, dveře zvou dál.
      if (this.role === 'zakaznik') this.rozsvit();
    }
  }

  // ---------- Terminál u dveří (vpravo) ----------

  private kresliTerminal(): void {
    const x = 760;
    const y = 50;
    const w = 460;
    const prvky: Phaser.GameObjects.GameObject[] = [];

    prvky.push(this.add.rectangle(0, 0, w, 630, BARVA.panel).setOrigin(0).setStrokeStyle(4, 0x4a5563));
    this.lcd = this.add.rectangle(30, 25, w - 60, 100, BARVA.lcd).setOrigin(0).setName('lcd_kod');
    this.displej = this.add
      .text(w / 2, 77, '', { fontFamily: LCD_FONT, fontSize: '72px', fontStyle: 'bold', color: BARVA.lcdText })
      .setOrigin(0.5)
      .setName('displej_kod');
    prvky.push(this.lcd, this.displej);

    const klavesy = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✅'];
    const kw = 120;
    const kh = 82;
    const mezera = 15;
    const x0 = (w - (3 * kw + 2 * mezera)) / 2;
    klavesy.forEach((k, i) => {
      const kx = x0 + (i % 3) * (kw + mezera);
      const ky = 150 + Math.floor(i / 3) * (kh + mezera);
      const barva = k === 'C' ? BARVA.cervena : k === '✅' ? BARVA.zelena : BARVA.klavesa;
      const text = k === 'C' ? '#ffffff' : '#1e242b';
      const nazev = k === '✅' ? 'klavesa_ok' : `klavesa_${k}`;
      prvky.push(this.klavesa(kx, ky, kw, kh, k, barva, text, nazev));
    });

    // Čtečka karty: sem se přikládá (pípá) služební karta.
    const cy = 545;
    prvky.push(this.add.rectangle(30, cy, w - 60, 66, BARVA.ctecka).setOrigin(0).setStrokeStyle(3, 0x4a5563).setName('ctecka'));
    prvky.push(this.add.text(70, cy + 33, '💳 ➡️', { fontSize: '40px', padding: { x: 4, y: 4 } }).setOrigin(0, 0.5));
    this.led = this.add.circle(w - 70, cy + 33, 12, BARVA.cervena).setName('ctecka_led');
    prvky.push(this.led);

    this.terminal = this.add.container(x, y, prvky).setName('terminal');
  }

  private klavesa(
    x: number,
    y: number,
    w: number,
    h: number,
    k: string,
    barva: number,
    barvaTextu: string,
    nazev: string,
  ): Phaser.GameObjects.Container {
    const pozadi = this.add.rectangle(0, 0, w, h, barva).setInteractive({ useHandCursor: true });
    const popis = this.add
      .text(0, 0, k, { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: barvaTextu, padding: { x: 4, y: 4 } })
      .setOrigin(0.5);
    const obal = this.add.container(x + w / 2, y + h / 2, [pozadi, popis]).setName(nazev);
    pozadi.on('pointerdown', () => {
      obal.setScale(0.94);
      this.time.delayedCall(90, () => obal.setScale(1));
      this.stisk(k);
    });
    return obal;
  }

  private stisk(k: string): void {
    if (this.oteviram) return;
    if (k === '✅') {
      this.zkus(this.klavesnice.potvrd());
      return;
    }
    beep.tick(k === 'C' ? 400 : 700, 0.05);
    if (k === 'C') this.klavesnice.vymaz();
    else this.klavesnice.stiskni(k);
    this.prekresli();
  }

  private prekresli(): void {
    this.displej.setText(this.klavesnice.hvezdicky);
  }

  // ---------- Vyhodnocení ----------

  /** Obsluha: kód / karta – odemyká kdykoli. */
  private zkus(ok: boolean): void {
    if (this.oteviram) return;
    this.klavesnice.vymaz();
    this.prekresli();
    if (ok) this.otevri();
    else this.spatne();
  }

  /** Zákazník klepne na dveře: v otevírací době vejde, jinak ⏳ (dveře drží, hodiny se zahoupou). */
  private klepnutiNaDvere(): void {
    if (this.role !== 'zakaznik' || this.oteviram) return;
    if (this.otviraciDoba) {
      this.oteviram = true;
      den().otevri(Date.now());
      beep.win();
      this.tweens.add({ targets: this.zakaznik, x: 515, y: 560, scale: 0.4, alpha: 0, duration: 900, ease: 'Sine.easeIn' });
      this.time.delayedCall(1300, () => this.scene.start(PO_ODEMCENI));
      return;
    }
    beep.tick(300, 0.15);
    this.tweens.add({ targets: this.zamek, x: this.zamek.x + 6, duration: 50, yoyo: true, repeat: 3 });
    this.tweens.add({
      targets: this.hodiny,
      angle: { from: -5, to: 5 },
      duration: 90,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.hodiny.setAngle(0),
    });
  }

  private spatne(): void {
    beep.error();
    this.lcd.setFillStyle(BARVA.lcdChyba);
    this.displej.setText('❌').setPadding(4);
    this.tweens.add({ targets: this.terminal, x: this.terminal.x + 14, duration: 60, yoyo: true, repeat: 3 });
    this.time.delayedCall(900, () => {
      if (this.oteviram) return;
      this.lcd.setFillStyle(BARVA.lcd);
      this.prekresli();
    });
  }

  private otevri(): void {
    this.oteviram = true;
    den().otevri(Date.now());
    beep.win();
    this.lcd.setFillStyle(BARVA.lcd);
    this.displej.setText('✅').setPadding(4);
    this.led.setFillStyle(BARVA.zelena);
    this.rozsvit();
    this.time.delayedCall(1800, () => this.scene.start(PO_ODEMCENI));
  }

  /** Rozsvítí se nápis, výloha a dveře; zákaz zmizí, zámek se odemkne. */
  private rozsvit(): void {
    this.zamek.setText('🔓');
    this.napis.setColor('#ffd43b');
    this.okno.setFillStyle(BARVA.oknoSvitici);
    this.dvere.setFillStyle(BARVA.oknoSvitici);
    this.tweens.add({ targets: this.zakaz, alpha: 0, scale: 0.4, duration: 400 });
    this.tweens.add({ targets: this.napis, scale: 1.08, duration: 250, yoyo: true, repeat: 1 });
  }
}
