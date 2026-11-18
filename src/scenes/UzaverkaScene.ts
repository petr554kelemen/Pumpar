import Phaser from 'phaser';
import * as beep from '../services/beep.ts';
import { den, novyDen } from '../services/den.ts';
import { formatCas } from '../services/lock.ts';
import { kresliRucicky, velkeHodiny } from './hodiny.ts';
import type { SceneKey } from './nav.ts';

const FONT = 'Arial, Helvetica, sans-serif';

// Konec herního dne: odpočet doběhl (nebo obsluha zavřela 🔒). Hodiny ukazují zavírací dobu (20:00 / 21:00),
// benzínka je zavřená. ☀️ = hraje se dál → nový den (nová otevírací doba) → zamčené dveře.
// Sem později přijde uzávěrka: výsledky obsluhy za den (Dev_notes → Výsledky obsluhy).
export class UzaverkaScene extends Phaser.Scene {
  constructor() {
    super('Uzaverka' satisfies SceneKey);
  }

  create(): void {
    const d = den();
    d.ukonci(); // i když sem hra přišla po doběhnutí odpočtu – den je u konce
    const cas = d.cas(Date.now());

    this.add.rectangle(0, 0, 1280, 720, 0x0b1426).setOrigin(0).setName('noc');
    this.add.text(1130, 110, '🌙', { fontSize: '110px', padding: { x: 10, y: 10 } }).setOrigin(0.5).setName('mesic');

    // Zavřená benzínka (zhasnutá) se zámkem.
    this.add.rectangle(120, 250, 440, 380, 0x262d38).setOrigin(0).setName('budova');
    this.add.rectangle(95, 225, 490, 30, 0x343c48).setOrigin(0).setName('strecha');
    this.add
      .text(340, 175, '⛽ BENZÍNKA', { fontFamily: FONT, fontSize: '50px', fontStyle: 'bold', color: '#3d4652', padding: { x: 8, y: 8 } })
      .setOrigin(0.5)
      .setName('napis');
    this.add.rectangle(270, 380, 140, 250, 0x161b22).setOrigin(0).setStrokeStyle(6, 0x4a5563).setName('dvere');
    this.add.text(340, 470, '🔒', { fontSize: '80px', padding: { x: 8, y: 8 } }).setOrigin(0.5).setName('zamek');

    // Hodiny se zavírací dobou.
    const hodiny = velkeHodiny(this, 820, 330, 150);
    hodiny.obal.setName('hodiny');
    kresliRucicky(hodiny.rucicky, 150, cas, true);
    this.add
      .text(820, 515, formatCas(cas), { fontFamily: FONT, fontSize: '48px', fontStyle: 'bold', color: '#ecf0f1' })
      .setOrigin(0.5)
      .setName('zaviraci_cas');

    // ☀️ = nový den.
    const pozadi = this.add.rectangle(0, 0, 220, 130, 0xf1c40f).setStrokeStyle(6, 0xffffff).setInteractive({ useHandCursor: true });
    const ikona = this.add.text(0, 0, '☀️ ➡️', { fontSize: '64px', padding: { x: 8, y: 8 } }).setOrigin(0.5);
    const tlacitko = this.add.container(1110, 620, [pozadi, ikona]).setName('novy_den');
    pozadi.on('pointerdown', () => {
      beep.tick(700, 0.08);
      tlacitko.setScale(0.95);
      novyDen();
      this.time.delayedCall(150, () => this.scene.start('Lock' satisfies SceneKey));
    });

    beep.gong(true);
  }
}
