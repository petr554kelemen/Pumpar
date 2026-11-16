import Phaser from 'phaser';
import { bus } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import { addNav, type SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const MAX_DOTS = 30;
const DOTS_PER_ROW = 10;

// Fáze 0: zkušební scéna kostry.
// Klepnutí na stojan (nebo mezerník) vyšle do sběrnice 'pip';
// scéna na 'pip' reaguje přidáním tečky + číslice (zásada „číslo vždy dvakrát“).
// Enter se zde nepoužívá – ukončuje kód ze čtečky.
export class StationScene extends Phaser.Scene {
  private count = 0;
  private dots: Phaser.GameObjects.Arc[] = [];
  private pumpa!: Phaser.GameObjects.Text;
  private pocitadlo!: Phaser.GameObjects.Text;

  constructor() {
    super('Station' satisfies SceneKey);
  }

  create(): void {
    const { width } = this.scale;
    // Stav se nastavuje při každém spuštění scény (návrat z jiné scény začíná od nuly).
    this.count = 0;
    this.dots = [];
    addNav(this);

    // Malý popisek jen pro rodiče (hráč nečte).
    this.add
      .text(width / 2, 30, 'Čerpací stanice – kostra (fáze 0)', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#95a5a6',
      })
      .setOrigin(0.5);

    // Velký stojan – klepací tlačítko.
    this.pumpa = this.add
      .text(width / 2, 220, '⛽', { fontSize: '200px' })
      .setName('pumpa')
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.pumpa.on('pointerdown', () => bus.emit('pip', {}));

    this.input.keyboard?.on('keydown-SPACE', () => bus.emit('pip', {}));

    // Číslice (číslo vždy dvakrát: číslice + stejný počet teček).
    this.pocitadlo = this.add
      .text(width / 2, 420, '0', {
        fontFamily: FONT,
        fontSize: '96px',
        fontStyle: 'bold',
        color: '#f1c40f',
      })
      .setName('pocitadlo')
      .setOrigin(0.5);

    // Sběrnice: posluchač se při ukončení scény odhlásí.
    const unsubscribe = bus.on('pip', () => this.onPip());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
  }

  private onPip(): void {
    if (this.count >= MAX_DOTS) {
      this.resetDots();
      return;
    }

    this.count += 1;
    this.addDot(this.count - 1);
    this.pocitadlo.setText(String(this.count));
    beep.tick(520 + this.count * 15, 0.08);

    this.tweens.add({
      targets: this.pumpa,
      scale: { from: 1.15, to: 1 },
      duration: 180,
      ease: 'Back.Out',
    });

    if (this.count === MAX_DOTS) beep.win();
  }

  private addDot(index: number): void {
    const { width } = this.scale;
    const gap = 46;
    const row = Math.floor(index / DOTS_PER_ROW);
    const col = index % DOTS_PER_ROW;
    const startX = width / 2 - ((DOTS_PER_ROW - 1) * gap) / 2;

    const dot = this.add.circle(startX + col * gap, 530 + row * gap, 17, 0xf1c40f);
    dot.setName(`tecka_${index + 1}`);
    dot.setStrokeStyle(3, 0xfef9e7);
    this.tweens.add({ targets: dot, scale: { from: 0, to: 1 }, duration: 200, ease: 'Back.Out' });
    this.dots.push(dot);
  }

  private resetDots(): void {
    this.dots.forEach((d) => d.destroy());
    this.dots = [];
    this.count = 0;
    this.pocitadlo.setText('0');
    beep.tick(400, 0.1);
  }
}
