import Phaser from 'phaser';
import { bus } from './services/eventBus.ts';
import { startKeyboardScanner } from './services/scanInput.ts';
import { ScanTestScene } from './scenes/ScanTestScene.ts';
import { StationScene } from './scenes/StationScene.ts';
import { AirScene } from './scenes/AirScene.ts';
import { ShopScene } from './scenes/ShopScene.ts';
import { LockScene } from './scenes/LockScene.ts';
import { BankaScene } from './scenes/BankaScene.ts';
import { UzaverkaScene } from './scenes/UzaverkaScene.ts';
import { VysledkyScene } from './scenes/VysledkyScene.ts';
import { ParkovisteScene } from './scenes/ParkovisteScene.ts';
import { type SceneKey, navigaceZamcena } from './scenes/nav.ts';
import type { ScanTestData } from './scenes/ScanTestScene.ts';

// Vstupní bod hry. Scény jen zobrazují; logika a hardware jsou ve službách (src/services).

// Klávesnice / USB čtečka → událost 'scan' ve sběrnici (běží nezávisle na scénách).
startKeyboardScanner(bus);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1e242b',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  // První scéna je výchozí: zamčená benzínka (odemkne kód nebo služební karta) → banka (aktivace karet) → stojan.
  scene: [LockScene, BankaScene, StationScene, ParkovisteScene, AirScene, ShopScene, VysledkyScene, ScanTestScene, UzaverkaScene],
});

// Test čtečky jen pro rodiče: Ctrl+F2 odkudkoli (čtečka posílá jen znaky + Enter, F-klávesy nikdy; skener
// klávesy s Ctrl ignoruje). V obchodě s nezaplaceným benzínem nefunguje – bez zaplacení se neodchází.
window.addEventListener('keydown', (e) => {
  if (!e.ctrlKey || e.key !== 'F2') return;
  e.preventDefault();
  if (navigaceZamcena()) return;
  const aktivni = game.scene.getScenes(true)[0];
  if (!aktivni || aktivni.scene.key === 'ScanTest') return;
  aktivni.scene.start('ScanTest' satisfies SceneKey, { zpet: aktivni.scene.key as SceneKey } satisfies ScanTestData);
});
