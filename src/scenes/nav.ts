// Přepínání scén velkými ikonami vlevo nahoře (hráč nečte → jen obrázky) a odpočet směny vpravo nahoře.

import type Phaser from 'phaser';
import * as beep from '../services/beep.ts';
import { den } from '../services/den.ts';

export type SceneKey = 'Lock' | 'Karty' | 'Station' | 'Air' | 'Shop' | 'ScanTest' | 'Uzaverka';

// 🔒 = zavřít benzínku (konec směny) → konec dne. Zamčená scéna a konec dne navigaci nemají.
const SCENES: ReadonlyArray<{ key: SceneKey; ikona: string }> = [
  { key: 'Station', ikona: '⛽' },
  { key: 'Air', ikona: '🛞' },
  { key: 'Shop', ikona: '🛒' },
  { key: 'ScanTest', ikona: '📟' },
  { key: 'Uzaverka', ikona: '🔒' },
];

/** Zámek navigace: dokud platí, ze scény se odejít nedá (obchod s nezaplaceným benzínem). */
export interface ZamekNavigace {
  zamceno: () => boolean;
  /** Hráč zkusil odejít – scéna mu ukáže proč ne. */
  priPokusu: () => void;
}

export function addNav(scene: Phaser.Scene, zamek?: ZamekNavigace): void {
  const zamceno = zamek?.zamceno() ?? false;
  SCENES.forEach(({ key, ikona }, i) => {
    const aktivni = scene.scene.key === key;
    const tlacitko = scene.add
      .text(20 + i * 90, 16, ikona, {
        fontSize: '56px',
        ...(aktivni ? { backgroundColor: '#37404c' } : {}),
        padding: { x: 6, y: 4 },
      })
      .setName(`nav_${key}`)
      .setAlpha(aktivni ? 1 : zamceno ? 0.2 : 0.55)
      .setInteractive({ useHandCursor: true });

    if (aktivni) return;
    tlacitko.on('pointerdown', () => {
      if (zamek?.zamceno()) {
        zamek.priPokusu();
        return;
      }
      if (key === 'Uzaverka') den().ukonci();
      scene.scene.start(key);
    });
  });
  addOdpocet(scene);
}

const ODPOCET = { x: 1222, y: 50, r: 36 } as const;
const BARVA_OTEVRENO = 0x2ecc71;
const BARVA_ZAVIRANI = 0xf39c12;

/**
 * Odpočet směny (nápad rodiče): ubývající výseč jako kuchyňská minutka + zbývající minuty číslem.
 * Hlídá i konec dne: hlášení „pokladny se budou uzavírat“ a po doběhnutí přechod na konec dne.
 */
function addOdpocet(scene: Phaser.Scene): void {
  const { x, y, r } = ODPOCET;
  scene.add.circle(x, y, r + 5, 0x11161b).setStrokeStyle(3, 0x4a5563).setName('odpocet');
  const vysec = scene.add.graphics().setName('odpocet_vysec');
  const minuty = scene.add
    .text(x - r - 16, y, '', { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#ecf0f1' })
    .setOrigin(1, 0.5)
    .setName('odpocet_minuty');
  const hlaseni = scene.add
    .text(x - r - 80, y + 4, '📢🛒', { fontSize: '48px', padding: { x: 6, y: 6 } })
    .setOrigin(1, 0.5)
    .setVisible(false)
    .setName('hlaseni_zavirani');

  let konec = false;
  const tik = (): void => {
    if (konec) return;
    const d = den();
    const ted = Date.now();
    const stav = d.stav(ted);
    if (stav === 'zavreno') {
      konec = true;
      scene.scene.start('Uzaverka' satisfies SceneKey);
      return;
    }
    const zavirani = stav === 'zavirani';
    vysec.clear();
    vysec.fillStyle(zavirani ? BARVA_ZAVIRANI : BARVA_OTEVRENO);
    vysec.slice(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * d.podil(ted), false).fillPath();
    minuty.setText(String(d.zbyvaMinut(ted))).setColor(zavirani ? '#f39c12' : '#ecf0f1');
    hlaseni.setVisible(zavirani);

    // Hlášení zazní jednou za den, ať je hráč v kterékoli scéně.
    if (zavirani && !d.ohlaseno) {
      d.ohlaseno = true;
      beep.gong();
      scene.tweens.add({ targets: hlaseni, scale: 1.3, duration: 300, yoyo: true, repeat: 5 });
    }
  };
  tik();
  scene.time.addEvent({ delay: 250, loop: true, callback: tik });
}
