// SPZ jako skutečná tabulka (bílá, černé písmo, modrý pruh s CZ) – hlavní vodítko pro hráče, který umí
// porovnávat znaky (rodič, 2026-11-27). Sdílí parkoviště 🅿️ a stojan ⛽.

import type Phaser from 'phaser';

const FONT = 'Arial, Helvetica, sans-serif';

/** „LA01“ → „LA-01“ (na obrazovce s pomlčkou, v kódu bez ní – README → SPZ aut). */
export function spzNaObrazovce(spz: string): string {
  return spz.length > 2 ? `${spz.slice(0, 2)}-${spz.slice(2)}` : spz;
}

/** Tabulka SPZ se středem v (x, y); výška určuje i velikost písma. */
export function tabulkaSpz(scene: Phaser.Scene, x: number, y: number, spz: string, vyska = 56): Phaser.GameObjects.Container {
  const sirka = Math.round(vyska * 3.6);
  const pruh = Math.round(vyska * 0.42);
  return scene.add
    .container(x, y, [
      scene.add.rectangle(0, 0, sirka, vyska, 0xffffff).setStrokeStyle(Math.max(2, vyska / 14), 0x111111),
      scene.add.rectangle(-sirka / 2 + pruh / 2 + 2, 0, pruh, vyska - 6, 0x1f4fbf),
      scene.add
        .text(-sirka / 2 + pruh / 2 + 2, vyska * 0.22, 'CZ', { fontFamily: FONT, fontSize: `${Math.round(vyska * 0.2)}px`, color: '#ffffff' })
        .setOrigin(0.5),
      scene.add
        .text(pruh / 2, 0, spzNaObrazovce(spz), {
          fontFamily: FONT,
          fontSize: `${Math.round(vyska * 0.66)}px`,
          fontStyle: 'bold',
          color: '#111111',
        })
        .setOrigin(0.5),
    ])
    .setName(`spz_${spz}`);
}
