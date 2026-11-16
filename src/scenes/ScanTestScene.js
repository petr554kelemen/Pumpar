import Phaser from 'phaser';
import { bus } from '../services/eventBus.js';
import * as beep from '../services/beep.js';
import { addNav } from './nav.js';

const FONT = 'Arial, Helvetica, sans-serif';
// Emoji ve velké velikosti přesahují rámeček textu – okraj zabrání oříznutí.
const EMOJI_PAD = { x: 10, y: 30 };

// Fáze 2: „Pípni něco“ – ukáže, co čtečka (zatím klávesnice) přečetla.
// Zboží: velké písmeno kategorie + obrázek. Bankovka: číslo + stejný počet teček.
// Chyba: velký ❌ (hráč zná jako „chyba“).
export class ScanTestScene extends Phaser.Scene {
  constructor() {
    super('ScanTest');
  }

  create() {
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

  ukazCekani() {
    this.vysledek.removeAll(true);
    this.vysledek.add(this.add.text(0, 0, '📟', { fontSize: '200px', padding: EMOJI_PAD }).setOrigin(0.5).setName('cekani'));
  }

  onScan({ kod, info }) {
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
        this.vysledek.add([
          this.add.text(0, -40, '⚙️', { fontSize: '160px', padding: EMOJI_PAD }).setOrigin(0.5),
          this.popisek(0, 110, kod),
        ]);
        beep.tick(400, 0.08);
        break;
      default:
        this.vysledek.add([
          this.add.text(0, -30, '❌', { fontSize: '240px', padding: EMOJI_PAD }).setOrigin(0.5).setName('chyba'),
          this.popisek(0, 150, kod),
        ]);
        beep.error();
    }

    this.tweens.add({
      targets: this.vysledek,
      scale: { from: 0.6, to: 1 },
      duration: 250,
      ease: 'Back.Out',
    });
  }

  ukazPismeno(info) {
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
      this.add.text(170, -20, info.kategorie.emoji, { fontSize: '220px', padding: EMOJI_PAD }).setOrigin(0.5).setName('obrazek'),
      this.popisek(0, 170, `${info.kod} – ${info.kategorie.nazev}`),
    ]);
  }

  ukazBankovku(info) {
    const naRadek = 15;
    const mezera = 40;
    const tecky = [];
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
      this.add.text(-130, -110, '💵', { fontSize: '150px', padding: EMOJI_PAD }).setOrigin(0.5).setName('obrazek'),
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

  popisek(x, y, text) {
    return this.add
      .text(x, y, text, { fontFamily: FONT, fontSize: '28px', color: '#95a5a6' })
      .setOrigin(0.5)
      .setName('kod');
  }
}
