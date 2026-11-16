// Přepínání scén velkými ikonami vlevo nahoře (hráč nečte → jen obrázky).

const SCENES = [
  { key: 'Station', ikona: '⛽' },
  { key: 'ScanTest', ikona: '📟' },
];

export function addNav(scene) {
  SCENES.forEach(({ key, ikona }, i) => {
    const aktivni = scene.scene.key === key;
    const tlacitko = scene.add
      .text(20 + i * 90, 16, ikona, {
        fontSize: '56px',
        backgroundColor: aktivni ? '#37404c' : undefined,
        padding: { x: 6, y: 4 },
      })
      .setName(`nav_${key}`)
      .setAlpha(aktivni ? 1 : 0.55)
      .setInteractive({ useHandCursor: true });

    if (!aktivni) tlacitko.on('pointerdown', () => scene.scene.start(key));
  });
}
