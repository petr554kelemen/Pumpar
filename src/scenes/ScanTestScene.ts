import Phaser from 'phaser';
import { bus, type GameEvents } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import type { CodeInfo } from '../services/codes.ts';
import type { SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
// Emoji ve velké velikosti přesahují rámeček textu – okraj zabrání oříznutí.
const EMOJI_PAD = { x: 10, y: 30 };

type PismenoInfo = Extract<CodeInfo, { druh: 'zbozi' | 'karta' }>;
type BankovkaInfo = Extract<CodeInfo, { druh: 'bankovka' }>;
type AutoInfo = Extract<CodeInfo, { druh: 'auto' }>;

// Fáze 2: „Pípni něco“ – ukáže, co čtečka (zatím klávesnice) přečetla.
// Zboží: velké písmeno kategorie + obrázek. Bankovka: číslo + stejný počet teček.
// Auto (SPZ): obrázek auta + SPZ jako tabulka.
// Chyba: velký ❌ (hráč zná jako „chyba“).
// Jen pro rodiče (zkoušení nových štítků): v navigaci není, otevře se Ctrl+F2 (main.ts). Navigaci nemá –
// ↩️ nebo Esc vrátí do scény, odkud rodič přišel (i ke dveřím, aby test neobešel zamčenou benzínku).
export interface ScanTestData {
  zpet?: SceneKey;
}

export class ScanTestScene extends Phaser.Scene {
  private vysledek!: Phaser.GameObjects.Container;

  constructor() {
    super('ScanTest' satisfies SceneKey);
  }

  create(data: ScanTestData = {}): void {
    const { width, height } = this.scale;
    const zpet = data.zpet ?? 'Lock';
    const odejdi = (): void => {
      beep.tick(500, 0.06);
      this.scene.start(zpet);
    };
    this.add
      .text(20, 16, '↩️', { fontSize: '56px', backgroundColor: '#37404c', padding: { x: 6, y: 4 } })
      .setName('zpet')
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', odejdi);
    this.input.keyboard?.once('keydown-ESC', odejdi);

    // Popisek jen pro rodiče.
    this.add
      .text(width / 2 + 40, 40, 'Zkouška čtečky – pípni, nebo napiš kód a Enter (P001, K001, LA01…) · Esc = zpět', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#95a5a6',
      })
      .setName('napoveda')
      .setOrigin(0.5);

    // Výsledek posledního pípnutí – kontejner se při každém skenu vymění.
    this.vysledek = this.add.container(width / 2, height / 2).setName('vysledek');
    this.ukazCekani();

    // Ladění: co právě přichází z klávesnice/čtečky (jen pro rodiče, nenápadně dole).
    const psani = this.add
      .text(width / 2, height - 30, '', { fontFamily: FONT, fontSize: '24px', color: '#95a5a6' })
      .setName('psani')
      .setOrigin(0.5);

    const odhlasit = [
      bus.on('scan', (data) => this.onScan(data)),
      bus.on('psani', ({ text }) => psani.setText(text ? `⌨ ${text}` : '')),
    ];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => odhlasit.forEach((f) => f()));
  }

  private ukazCekani(): void {
    this.vysledek.removeAll(true);
    this.vysledek.add(this.emoji(0, 0, '📟', 200).setName('cekani'));
  }

  private onScan({ kod, info }: GameEvents['scan']): void {
    this.vysledek.removeAll(true);

    switch (info.druh) {
      case 'zbozi':
      case 'karta':
        this.ukazPismeno(info);
        beep.tick(880, 0.12);
        break;
      case 'bankovka':
        this.ukazBankovku(info);
        beep.win();
        break;
      case 'auto':
        this.ukazAuto(info);
        beep.tick(660, 0.1);
        setTimeout(() => beep.tick(990, 0.15), 120);
        break;
      case 'rodic':
        this.vysledek.add([this.emoji(0, -40, '⚙️', 160), this.popisek(0, 110, kod)]);
        beep.tick(400, 0.08);
        break;
      case 'chyba':
        this.vysledek.add([this.emoji(0, -30, '❌', 240).setName('chyba'), this.popisek(0, 150, kod)]);
        beep.error();
        break;
      default: {
        // Nový druh kódu bez zobrazení → chyba kontroly typů (TS hlídá úplnost výčtu).
        const neosetreno: never = info;
        throw new Error(`Neošetřený druh kódu: ${JSON.stringify(neosetreno)}`);
      }
    }

    this.tweens.add({
      targets: this.vysledek,
      scale: { from: 0.6, to: 1 },
      duration: 250,
      ease: 'Back.Out',
    });
  }

  private ukazPismeno(info: PismenoInfo): void {
    this.vysledek.add([
      this.add
        .text(-170, -20, info.pismeno, {
          fontFamily: FONT,
          fontSize: '260px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setName('pismeno'),
      this.emoji(170, -20, info.kategorie.emoji, 220).setName('obrazek'),
      this.popisek(0, 170, `${info.kod} – ${info.kategorie.nazev}`),
    ]);
  }

  private ukazBankovku(info: BankovkaInfo): void {
    const naRadek = 15;
    const mezera = 40;
    const tecky: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < info.hodnota; i++) {
      const radek = Math.floor(i / naRadek);
      const sloupec = i % naRadek;
      const x = (sloupec - (naRadek - 1) / 2) * mezera;
      tecky.push(
        this.add
          .circle(x, 90 + radek * mezera, 15, 0xf1c40f)
          .setStrokeStyle(3, 0xfef9e7)
          .setName(`tecka_${i + 1}`),
      );
    }

    this.vysledek.add([
      this.emoji(-130, -110, '💵', 150).setName('obrazek'),
      this.add
        .text(130, -110, String(info.hodnota), {
          fontFamily: FONT,
          fontSize: '150px',
          fontStyle: 'bold',
          color: '#f1c40f',
        })
        .setOrigin(0.5)
        .setName('hodnota'),
      ...tecky,
    ]);
  }

  /** Auto u stojanu: obrázek auta + SPZ jako skutečná tabulka (bílá, modrý pruh vlevo). */
  private ukazAuto(info: AutoInfo): void {
    const sirka = 560;
    const vyska = 130;
    const y = 130;
    const pruh = 60;

    this.vysledek.add([
      this.emoji(0, -110, info.majitel === 'hrac' ? '🚙' : '🚗', 200).setName('auto'),
      this.add.rectangle(0, y, sirka, vyska, 0xffffff).setStrokeStyle(6, 0x111111).setName('spz_tabulka'),
      this.add.rectangle(-sirka / 2 + pruh / 2 + 3, y, pruh, vyska - 6, 0x1f4fbf).setName('spz_pruh'),
      this.add
        .text(-sirka / 2 + pruh / 2 + 3, y + 30, 'CZ', { fontFamily: FONT, fontSize: '26px', color: '#ffffff' })
        .setOrigin(0.5),
      this.add
        .text(pruh / 2, y, info.spz, {
          fontFamily: FONT,
          fontSize: '96px',
          fontStyle: 'bold',
          color: '#111111',
        })
        .setOrigin(0.5)
        .setName('spz'),
    ]);
  }

  private emoji(x: number, y: number, znak: string, velikost: number): Phaser.GameObjects.Text {
    return this.add.text(x, y, znak, { fontSize: `${velikost}px`, padding: EMOJI_PAD }).setOrigin(0.5);
  }

  private popisek(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, { fontFamily: FONT, fontSize: '28px', color: '#95a5a6' })
      .setOrigin(0.5)
      .setName('kod');
  }
}
