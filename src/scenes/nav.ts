// Přepínání scén velkými ikonami vlevo nahoře (hráč nečte → jen obrázky).

import type Phaser from 'phaser';

export type SceneKey = 'Station' | 'Air' | 'ScanTest';

const SCENES: ReadonlyArray<{ key: SceneKey; ikona: string }> = [
  { key: 'Station', ikona: '⛽' },
  { key: 'Air', ikona: '🛞' },
  { key: 'ScanTest', ikona: '📟' },
];

export function addNav(scene: Phaser.Scene): void {
  SCENES.forEach(({ key, ikona }, i) => {
    const aktivni = scene.scene.key === key;
    const tlacitko = scene.add
      .text(20 + i * 90, 16, ikona, {
        fontSize: '56px',
        ...(aktivni ? { backgroundColor: '#37404c' } : {}),
        padding: { x: 6, y: 4 },
      })
      .setName(`nav_${key}`)
      .setAlpha(aktivni ? 1 : 0.55)
      .setInteractive({ useHandCursor: true });

    if (!aktivni) tlacitko.on('pointerdown', () => scene.scene.start(key));
  });
}
