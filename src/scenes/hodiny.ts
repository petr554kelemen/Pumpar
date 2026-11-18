// Ručičkové hodiny (učení hodin) – sdílí je zamčená benzínka (otevírací doba) a konec dne (zavírací doba).

import Phaser from 'phaser';
import { uhlyRucicek } from '../services/lock.ts';

const FONT = 'Arial, Helvetica, sans-serif';
const CERNA = 0x1e242b;
const CERVENA = 0xe74c3c;

/** Ciferník se střední čárkou u každé hodiny (střed 0,0). */
export function cifernik(scene: Phaser.Scene, r: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0xffffff).fillCircle(0, 0, r);
  g.lineStyle(Math.max(3, r * 0.07), CERNA).strokeCircle(0, 0, r);
  for (let i = 0; i < 12; i++) {
    const a = Phaser.Math.DegToRad(i * 30 - 90);
    const vnitrni = i % 3 === 0 ? 0.84 : 0.9;
    g.lineStyle(i % 3 === 0 ? 3 : 2, CERNA);
    g.lineBetween(Math.cos(a) * r * vnitrni, Math.sin(a) * r * vnitrni, Math.cos(a) * r * 0.96, Math.sin(a) * r * 0.96);
  }
  return g;
}

/** Čísla 1–12 (jen velké hodiny), souřadnice vůči středu. */
export function cislaHodin(scene: Phaser.Scene, r: number): Phaser.GameObjects.Text[] {
  const velikost = r / 62;
  return Array.from({ length: 12 }, (_, i) => {
    const h = i + 1;
    const a = Phaser.Math.DegToRad(h * 30 - 90);
    return scene.add
      .text(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72, String(h), {
        fontFamily: FONT,
        fontSize: `${Math.round((h % 3 === 0 ? 17 : 13) * velikost)}px`,
        fontStyle: 'bold',
        color: '#1e242b',
      })
      .setOrigin(0.5);
  });
}

/** Ručičky; velké hodiny mají i červenou vteřinovku. Střed 0,0. */
export function kresliRucicky(g: Phaser.GameObjects.Graphics, r: number, d: Date, velke: boolean): void {
  g.clear();
  const u = uhlyRucicek(d);
  const rucicka = (uhel: number, delka: number, sirka: number, barva: number): void => {
    const a = Phaser.Math.DegToRad(uhel - 90);
    g.lineStyle(sirka, barva).lineBetween(0, 0, Math.cos(a) * r * delka, Math.sin(a) * r * delka);
  };
  const tloustka = Math.max(1, r / 62);
  rucicka(u.hodinova, 0.5, (velke ? 7 : 5) * tloustka, CERNA);
  rucicka(u.minutova, 0.8, (velke ? 4 : 3) * tloustka, CERNA);
  if (velke) rucicka(u.vterinova, 0.85, 2 * tloustka, CERVENA);
  g.fillStyle(CERNA).fillCircle(0, 0, (velke ? 5 : 3) * tloustka);
}

/** Velké hodiny s čísly; vrací obal a grafiku ručiček (překreslit přes kresliRucicky). */
export function velkeHodiny(
  scene: Phaser.Scene,
  x: number,
  y: number,
  r: number,
): { obal: Phaser.GameObjects.Container; rucicky: Phaser.GameObjects.Graphics } {
  const rucicky = scene.add.graphics();
  const obal = scene.add.container(x, y, [cifernik(scene, r), ...cislaHodin(scene, r), rucicky]);
  return { obal, rucicky };
}
