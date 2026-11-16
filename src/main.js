import Phaser from 'phaser';
import { StationScene } from './scenes/StationScene.js';

// Vstupní bod hry. Scény jen zobrazují; logika a hardware jsou ve službách (src/services).
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
  scene: [StationScene],
});
