// Kanystr ⛽ nakreslený (emoji kanystru neexistuje, 🧴 vypadá jako lahvička krému): červené tělo, rukojeť
// s otvorem a hubička – jako skutečný kanystr hráče. Sdílí stojan ⛽, parkoviště 🅿️ a test čtečky.

import type Phaser from 'phaser';

const CERVENA = 0xd63031;
const TMAVA = 0x8e1b1b;

/** Kanystr se středem v (x, y); `vyska` = celková výška v px. Otáčí se celý (nalévání). */
export function kanystrIkona(scene: Phaser.Scene, x: number, y: number, vyska = 56): Phaser.GameObjects.Container {
  const v = vyska;
  const sirka = v * 0.72;
  const g = scene.add.graphics();
  // Hubička vlevo nahoře (šikmo).
  g.fillStyle(0x2d3436);
  g.fillTriangle(-sirka * 0.5, -v * 0.3, -sirka * 0.28, -v * 0.38, -sirka * 0.62, -v * 0.5);
  // Tělo.
  g.fillStyle(CERVENA);
  g.fillRoundedRect(-sirka / 2, -v * 0.32, sirka, v * 0.82, v * 0.08);
  // Rukojeť nahoře s otvorem.
  g.fillRoundedRect(-sirka * 0.15, -v * 0.5, sirka * 0.62, v * 0.24, v * 0.06);
  g.fillStyle(TMAVA);
  g.fillRoundedRect(-sirka * 0.03, -v * 0.44, sirka * 0.38, v * 0.1, v * 0.03);
  // Prolis na boku.
  g.lineStyle(Math.max(2, v / 18), TMAVA);
  g.strokeRoundedRect(-sirka * 0.34, -v * 0.16, sirka * 0.68, v * 0.56, v * 0.05);
  return scene.add.container(x, y, [g]).setName('kanystr');
}
