import Phaser from 'phaser';
import { bus, type GameEvents } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import type { CodeInfo } from '../services/codes.ts';
import { addNav, type SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
// Emoji ve velké velikosti přesahují rámeček textu – okraj zabrání oříznutí.
const EMOJI_PAD = { x: 10, y: 30 };

type PismenoInfo = Extract<CodeInfo, { druh: 'zbozi' | 'karta' }>;
type BankovkaInfo = Extract<CodeInfo, { druh: 'bankovka' }>;

// Fáze 2: „Pípni něco“ – ukáže, co čtečka (zatím klávesnice) přečetla.
// Zboží: velké písmeno kategorie + obrázek. Bankovka: číslo + stejný počet teček.
// Chyba: velký ❌ (hráč zná jako „chyba“).
export class ScanTestScene extends Phaser.Scene {
  private vysledek!: Phaser.GameObjects.Container;

  constructor() {
    super('ScanTest' satisfies SceneKey);
  }

  create(): void {
    const { width, height } = this.scale;
    addNav(this);

    // Popisek jen pro rodiče.
    this.add
      .text(width / 2, 40, 'Zkouška čtečky – napiš kód a Enter (např. P001, S002, B020, K001)', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#95a5a6',
      })
      .setName('napoveda')
      .setOrigin(0.5);

    // Výsledek posledního pípnutí – kontejner se při každém skenu vymění.
    this.vysledek = this.add.container(width / 2, height / 2).setName('vysledek');
    this.ukazCekani();

    const unsubscribe = bus.on('scan', (data) => this.onScan(data));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
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
      case 'rodic':
        this.vysledek.add([this.emoji(0, -40, '⚙️', 160), this.popisek(0, 110, kod)]);
        beep.tick(400, 0.08);
        break;
      case 'chyba':
        this.vysledek.add([this.emoji(0, -30, '❌', 240).setName('chyba'), this.popisek(0, 150, kod)]);
        beep.error();
        break;
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
