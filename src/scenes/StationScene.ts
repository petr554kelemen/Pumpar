import Phaser from 'phaser';
import * as beep from '../services/beep.ts';
import {
  CENA_LITRU_KC,
  Predvolba,
  RYCHLE_PREDVOLBY,
  RYCHLOST,
  type RezimTankovani,
  Stojan,
  type Vysledek,
  formatLitry,
  tecky,
} from '../services/pump.ts';
import { addNav, type SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const LCD_FONT = '"Courier New", Courier, monospace';

// Barvy ze staré verze.
const BARVA = {
  panel: 0x2b323b,
  lcd: 0x9eb398,
  lcdText: '#142214',
  klavesa: 0xe8ebee,
  predvolba: 0x3d4856,
  zelena: 0x2ecc71,
  oranzova: 0xf39c12,
  cervena: 0xe74c3c,
  zluta: 0xf1c40f,
} as const;

interface Tlacitko {
  obal: Phaser.GameObjects.Container;
  pozadi: Phaser.GameObjects.Rectangle;
}

// Fáze 4 (začátek): výdejní stojan převedený ze staré verze – předvolba, rychlé/pomalé tankování,
// vyhodnocení. Obchod zatím ne (přijde s placením). Pravidla beze změny – hráč je zná.
export class StationScene extends Phaser.Scene {
  private predvolba!: Predvolba;
  private stojan!: Stojan;
  private rezim: RezimTankovani | null = null;
  private casovac: Phaser.Time.TimerEvent | null = null;

  private predvolbaText!: Phaser.GameObjects.Text;
  private predvolbaPopis!: Phaser.GameObjects.Text;
  private natankovanoText!: Phaser.GameObjects.Text;
  private cenaText!: Phaser.GameObjects.Text;
  private zbyvaText!: Phaser.GameObjects.Text;
  private pistole!: Phaser.GameObjects.Text;
  private prutokText!: Phaser.GameObjects.Text;
  private prutokPruh!: Phaser.GameObjects.Rectangle;
  private tlacitkoRychle!: Tlacitko;
  private tlacitkoPomalu!: Tlacitko;
  private vysledek!: Phaser.GameObjects.Container;
  private vysledekPozadi!: Phaser.GameObjects.Rectangle;
  private vysledekTitulek!: Phaser.GameObjects.Text;
  private vysledekPopis!: Phaser.GameObjects.Text;

  constructor() {
    super('Station' satisfies SceneKey);
  }

  create(): void {
    // Stav se nastavuje při každém spuštění scény (návrat z jiné scény začíná od nuly).
    this.predvolba = new Predvolba();
    this.stojan = new Stojan();
    this.rezim = null;
    this.casovac = null;

    addNav(this);
    this.vytvorLevyPanel();
    this.vytvorPravyPanel();
    this.ovladaniKlavesnici();
    this.prekresli();
  }

  // ---------- Levý panel: předvolba ----------

  private vytvorLevyPanel(): void {
    const x = 20;
    const y = 96;
    const w = 610;
    this.add.rectangle(x, y, w, 610, BARVA.panel).setOrigin(0).setName('panel_predvolba');

    this.add.rectangle(x + 15, y + 15, w - 30, 150, BARVA.lcd).setOrigin(0).setName('lcd_predvolba');
    this.lcdPopisek(x + 30, y + 25, 'PŘEDVOLBA LITRŮ');
    this.lcdPopisek(x + w - 30, y + 25, 'NATURAL 95').setOrigin(1, 0);
    this.predvolbaText = this.lcdCislo(x + w - 30, y + 95).setName('predvolba_displej');
    this.predvolbaPopis = this.lcdPopisek(x + w - 30, y + 140, '', '20px').setOrigin(1, 0.5).setName('predvolba_cena');

    // Rychlé předvolby
    const py = y + 200;
    const sirka = (w - 30 - 3 * 12) / 4;
    [...RYCHLE_PREDVOLBY, null].forEach((litry, i) => {
      const bx = x + 15 + i * (sirka + 12);
      const popis = litry === null ? '🎲 Náhoda' : `${litry} L`;
      const nazev = litry === null ? 'predvolba_nahoda' : `predvolba_${litry}L`;
      this.tlacitko(bx, py, sirka, 56, popis, BARVA.predvolba, '#ffffff', '24px', nazev).pozadi.on('pointerdown', () => {
        beep.tick(820, 0.05);
        this.zastav(false);
        if (litry === null) this.predvolba.nahodna();
        else this.predvolba.nastavLitry(litry);
        this.vynuluj(false);
      });
    });

    // Číselná klávesnice
    const ky = y + 275;
    const kw = (w - 30 - 2 * 12) / 3;
    const kh = 70;
    const klavesy = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'VYNULOVAT'];
    klavesy.forEach((k, i) => {
      const bx = x + 15 + (i % 3) * (kw + 12);
      const by = ky + Math.floor(i / 3) * (kh + 10);
      const barva = k === 'C' ? BARVA.cervena : k === 'VYNULOVAT' ? BARVA.zelena : BARVA.klavesa;
      const text = k === 'C' || k === 'VYNULOVAT' ? '#ffffff' : '#2c3e50';
      const nazev = k === 'VYNULOVAT' ? 'klavesa_vynulovat' : `klavesa_${k}`;
      const velikost = k === 'VYNULOVAT' ? '24px' : '36px';
      this.tlacitko(bx, by, kw, kh, k, barva, text, velikost, nazev).pozadi.on('pointerdown', () => this.klavesa(k));
    });
  }

  private klavesa(k: string): void {
    if (k === 'VYNULOVAT') {
      this.vynuluj(true);
      return;
    }
    if (k === 'C') {
      beep.tick(400, 0.06);
      this.predvolba.vymaz();
      this.vynuluj(false);
      return;
    }
    beep.tick(750, 0.04);
    if (this.rezim) return;
    if (this.stojan.natankovano > 0) this.vynuluj(false);
    this.predvolba.stiskni(k);
    this.prekresli();
  }

  // ---------- Pravý panel: výdejní stojan ----------

  private vytvorPravyPanel(): void {
    const x = 650;
    const y = 96;
    const w = 610;
    this.add.rectangle(x, y, w, 610, BARVA.panel).setOrigin(0).setName('panel_stojan');

    this.add.rectangle(x + 15, y + 15, w - 30, 150, BARVA.lcd).setOrigin(0).setName('lcd_natankovano');
    this.lcdPopisek(x + 30, y + 25, 'NATANKOVÁNO LITRŮ');
    this.zbyvaText = this.lcdPopisek(x + w - 30, y + 25, '').setOrigin(1, 0).setName('zbyva');
    this.natankovanoText = this.lcdCislo(x + w - 30, y + 95).setName('natankovano_displej');
    this.cenaText = this.lcdPopisek(x + w - 30, y + 140, '', '20px').setOrigin(1, 0.5).setName('cena');

    // Pistole + průtok
    const ny = y + 185;
    this.add.rectangle(x + 15, ny, w - 30, 80, 0x232a32).setOrigin(0);
    this.pistole = this.add
      .text(x + 60, ny + 40, '⛽', { fontSize: '52px', padding: { x: 6, y: 10 } })
      .setOrigin(0.5)
      .setName('pistole');
    this.prutokText = this.add
      .text(x + 110, ny + 22, '', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#ecf0f1' })
      .setName('prutok_text');
    this.add.rectangle(x + 110, ny + 50, 300, 12, 0x111111).setOrigin(0, 0.5);
    this.prutokPruh = this.add.rectangle(x + 110, ny + 50, 0, 12, BARVA.zelena).setOrigin(0, 0.5).setName('prutok_pruh');
    this.add
      .text(x + w - 30, ny + 40, 'Klávesnice:\n⬆️ Rychle | ⬇️ Pomalu', {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#95a5a6',
        align: 'right',
      })
      .setOrigin(1, 0.5);

    // Tlačítka tankování (držet)
    const ty = y + 285;
    const tw = (w - 30 - 15) / 2;
    this.tlacitkoRychle = this.tlacitkoTankovani(x + 15, ty, tw, '⬆️\nRYCHLE TANKOVAT\nDrž šipku NAHORU', BARVA.zelena, 'tlacitko_rychle', 'rychle');
    this.tlacitkoPomalu = this.tlacitkoTankovani(x + 30 + tw, ty, tw, '⬇️\nPOMALU DOTOČIT\nDrž šipku DOLŮ', BARVA.oranzova, 'tlacitko_pomalu', 'pomalu');

    // Výsledek
    const vy = y + 455;
    this.vysledekPozadi = this.add.rectangle(0, 0, w - 30, 140, BARVA.zelena).setOrigin(0);
    this.vysledekTitulek = this.add
      .text((w - 30) / 2, 30, '', { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#ffffff' })
      .setOrigin(0.5);
    this.vysledekPopis = this.add
      .text((w - 30) / 2, 66, '', { fontFamily: FONT, fontSize: '18px', color: '#ffffff' })
      .setOrigin(0.5);
    const nove = this.tlacitko((w - 30) / 2 - 130, 90, 260, 40, '🔄 Nové tankování', 0x34495e, '#ffffff', '20px', 'nove_tankovani');
    nove.pozadi.on('pointerdown', () => this.vynuluj(true));
    this.vysledek = this.add
      .container(x + 15, vy, [this.vysledekPozadi, this.vysledekTitulek, this.vysledekPopis, nove.obal])
      .setName('vysledek')
      .setVisible(false);
  }

  private tlacitkoTankovani(
    x: number,
    y: number,
    w: number,
    text: string,
    barva: number,
    nazev: string,
    rezim: RezimTankovani,
  ): Tlacitko {
    const t = this.tlacitko(x, y, w, 150, text, barva, '#ffffff', '24px', nazev);
    t.pozadi.on('pointerdown', () => this.spust(rezim));
    t.pozadi.on('pointerup', () => this.zastav(true));
    t.pozadi.on('pointerout', () => this.zastav(true));
    return t;
  }

  private ovladaniKlavesnici(): void {
    const kb = this.input.keyboard;
    if (!kb) return;
    kb.on('keydown-UP', (e: KeyboardEvent) => {
      if (!e.repeat) this.spust('rychle');
    });
    kb.on('keydown-DOWN', (e: KeyboardEvent) => {
      if (!e.repeat) this.spust('pomalu');
    });
    kb.on('keyup-UP', () => this.zastav(true));
    kb.on('keyup-DOWN', () => this.zastav(true));
    // Puštění myši/prstu kdekoli zastaví tankování (jako onmouseup ve staré verzi).
    this.input.on('pointerup', () => this.zastav(true));
  }

  // ---------- Tankování ----------

  private spust(rezim: RezimTankovani): void {
    if (this.predvolba.setiny <= 0 || this.rezim) return;
    this.rezim = rezim;
    this.vysledek.setVisible(false);

    const rychle = rezim === 'rychle';
    (rychle ? this.tlacitkoRychle : this.tlacitkoPomalu).obal.setScale(0.96);
    this.prutokText.setText(rychle ? 'Plný proud paliva...' : 'Jemné dotočení...');
    this.prutokPruh.width = rychle ? 300 : 84;
    this.prutokPruh.fillColor = rychle ? BARVA.zelena : BARVA.oranzova;
    this.tweens.add({ targets: this.pistole, angle: { from: -6, to: 6 }, duration: 120, yoyo: true, repeat: -1 });

    this.casovac = this.time.addEvent({
      delay: RYCHLOST[rezim].intervalMs,
      loop: true,
      callback: () => {
        if (this.stojan.krok(rezim)) beep.tick(rychle ? 520 : 680, 0.025);
        this.prekresli();
      },
    });
  }

  private zastav(vyhodnotit: boolean): void {
    if (!this.rezim) return;
    this.rezim = null;
    this.casovac?.remove();
    this.casovac = null;

    this.tlacitkoRychle.obal.setScale(1);
    this.tlacitkoPomalu.obal.setScale(1);
    this.tweens.killTweensOf(this.pistole);
    this.pistole.setAngle(0);
    this.prutokText.setText('Pistole zastavena');
    this.prutokPruh.width = 0;

    if (vyhodnotit) this.ukazVysledek(this.stojan.vyhodnot(this.predvolba.setiny));
  }

  private vynuluj(sezvukem: boolean): void {
    if (sezvukem) beep.tick(500, 0.05);
    this.zastav(false);
    this.stojan.vynuluj();
    this.vysledek.setVisible(false);
    this.prutokText.setText('Pistole připravena');
    this.prekresli();
  }

  private ukazVysledek(v: Vysledek | null): void {
    if (!v) return;
    switch (v.druh) {
      case 'presne':
        this.vysledekPozadi.fillColor = 0x27ae60;
        this.vysledekTitulek.setText('🏆 NAPROSTO PŘESNÁ TREFA!');
        this.vysledekPopis.setText(`Trefil jsi přesně ${formatLitry(this.predvolba.setiny)} L!`);
        beep.win();
        break;
      case 'malo':
        this.vysledekPozadi.fillColor = 0xb9770e;
        this.vysledekTitulek.setText('⛽ STOPNUTO PŘED CÍLEM');
        this.vysledekPopis.setText(`Chybí ${formatLitry(v.chybi)} L – můžeš ještě dotankovat.`);
        beep.tick(620, 0.1);
        break;
      case 'preteklo':
        this.vysledekPozadi.fillColor = 0xc0392b;
        this.vysledekTitulek.setText('💦 TROCHU PŘETEKLO!');
        this.vysledekPopis.setText(`Přeteklo o +${formatLitry(v.navic)} L nad předvolbu.`);
        beep.error();
        break;
      default: {
        const neosetreno: never = v;
        throw new Error(`Neošetřený výsledek: ${JSON.stringify(neosetreno)}`);
      }
    }
    this.vysledek.setVisible(true);
    this.tweens.add({ targets: this.vysledek, alpha: { from: 0, to: 1 }, duration: 200 });
  }

  // ---------- Zobrazení ----------

  private prekresli(): void {
    const cil = this.predvolba.setiny;
    const ted = this.stojan.natankovano;
    this.predvolbaText.setText(formatLitry(cil));
    const cilTecky = Math.max(1, tecky(cil));
    this.predvolbaPopis.setText(cilTecky <= 22 ? `Cena v obchodě: ${cilTecky} zlatých teček` : 'Velké tankování (bez obchodu)');

    this.natankovanoText.setText(formatLitry(ted));
    this.cenaText.setText(`${((ted / 100) * CENA_LITRU_KC).toFixed(2)} Kč  |  (${tecky(ted)} teček)`);
    this.zbyvaText.setText(ted > cil ? `PŘESAH: +${formatLitry(ted - cil)} L` : `ZBÝVÁ: ${formatLitry(cil - ted)} L`);
  }

  private lcdPopisek(x: number, y: number, text: string, velikost = '16px'): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, { fontFamily: FONT, fontSize: velikost, fontStyle: 'bold', color: BARVA.lcdText });
  }

  private lcdCislo(x: number, y: number): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, '', { fontFamily: LCD_FONT, fontSize: '72px', color: BARVA.lcdText })
      .setOrigin(1, 0.5);
  }

  private tlacitko(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    barva: number,
    barvaTextu: string,
    velikost: string,
    nazev: string,
  ): Tlacitko {
    const pozadi = this.add.rectangle(0, 0, w, h, barva).setInteractive({ useHandCursor: true });
    const popis = this.add
      .text(0, 0, text, { fontFamily: FONT, fontSize: velikost, fontStyle: 'bold', color: barvaTextu, align: 'center' })
      .setOrigin(0.5);
    const obal = this.add.container(x + w / 2, y + h / 2, [pozadi, popis]).setName(nazev);
    return { obal, pozadi };
  }
}
