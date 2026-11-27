// Okamžitá odměna po zaplacení (výsledková listina 🏆): z místa nákupu vyletí ❤️ a ⭐ k ikoně 🏆 v navigaci,
// každá s krátkým zvukem – hráč odměnu vidí hned, ne až na konci (nečte, nepamatuje si to).
// Vyčerpaná karta má zvláštní oslavu: rozzáří se a „zhasne“ jako prázdná. 0 ⭐ = žádná hvězda, žádné ❌.

import Phaser from 'phaser';
import * as beep from '../services/beep.ts';
import type { RadekListiny } from '../services/vysledky.ts';
import type { KartaNaObrazovce } from './kartyPanel.ts';

/** Rozestup letících ikon (ms). */
const KROK_MS = 130;
const LET_MS = 650;

/** Kam ikony letí: ikona 🏆 v navigaci (jinak pravý horní roh). */
function cil(scene: Phaser.Scene): { x: number; y: number } {
  const ikona = scene.children.getByName('nav_Vysledky');
  if (ikona instanceof Phaser.GameObjects.Text) {
    const c = ikona.getCenter();
    return { x: c.x, y: c.y };
  }
  return { x: 330, y: 50 };
}

/** Jak dlouho odměna trvá (ms) – scéna má počkat, než přepne jinam. */
export function delkaOdmeny(r: Pick<RadekListiny, 'hvezdy' | 'srdicka'>): number {
  const pocet = r.hvezdy + r.srdicka;
  return pocet === 0 ? 0 : pocet * KROK_MS + LET_MS + 200;
}

export function odmena(
  scene: Phaser.Scene,
  odkud: { x: number; y: number },
  r: Pick<RadekListiny, 'hvezdy' | 'srdicka' | 'zbytek'>,
  karta?: KartaNaObrazovce,
): void {
  if (karta && r.zbytek === 0) oslavVycerpanou(scene, karta);

  const ikony = [...Array.from({ length: r.srdicka }, () => '❤️'), ...Array.from({ length: r.hvezdy }, () => '⭐')];
  const kam = cil(scene);
  ikony.forEach((znak, i) => {
    const t = scene.add
      .text(odkud.x + (Math.random() - 0.5) * 80, odkud.y, znak, { fontSize: '44px', padding: { x: 6, y: 8 } })
      .setOrigin(0.5)
      .setDepth(40)
      .setAlpha(0)
      .setName('odmena_ikona');
    scene.tweens.add({
      targets: t,
      alpha: 1,
      x: kam.x,
      y: kam.y,
      scale: { from: 1.4, to: 0.6 },
      delay: i * KROK_MS,
      duration: LET_MS,
      ease: 'Cubic.In',
      onStart: () => beep.tick(znak === '⭐' ? 1320 + (i % 3) * 110 : 880, 0.06),
      onComplete: () => {
        t.destroy();
        const ikona = scene.children.getByName('nav_Vysledky');
        if (ikona instanceof Phaser.GameObjects.Text) {
          scene.tweens.add({ targets: ikona, scale: { from: 1.25, to: 1 }, duration: 160 });
        }
      },
    });
  });
}

/** Karta vyčerpaná na 0: rozzáří se (zlatý rám, zvětšení) a pak „zhasne“ – zůstane bledá. */
function oslavVycerpanou(scene: Phaser.Scene, kn: KartaNaObrazovce): void {
  beep.win();
  kn.obal.setAlpha(1);
  kn.pozadi.setStrokeStyle(8, 0xfff3a0);
  scene.tweens.add({
    targets: kn.obal,
    scale: { from: 1, to: 1.12 },
    duration: 220,
    yoyo: true,
    repeat: 2,
    onComplete: () => {
      kn.pozadi.setStrokeStyle(4, 0xd4ac0d);
      scene.tweens.add({ targets: kn.obal, alpha: 0.45, duration: 500 });
    },
  });
}
