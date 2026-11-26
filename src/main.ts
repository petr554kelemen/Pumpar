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

// Vstupní bod hry. Scény jen zobrazují; logika a hardware jsou ve službách (src/services).

// Klávesnice / USB čtečka → událost 'scan' ve sběrnici (běží nezávisle na scénách).
startKeyboardScanner(bus);

new Phaser.Game({
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
  scene: [LockScene, BankaScene, StationScene, AirScene, ShopScene, ScanTestScene, UzaverkaScene],
});
