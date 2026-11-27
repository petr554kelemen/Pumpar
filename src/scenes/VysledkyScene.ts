import Phaser from 'phaser';
import { den } from '../services/den.ts';
import { denik } from '../services/denik.ts';
import { vysledkyDne } from '../services/vysledky.ts';
import { SIRKA_LISTINY, kresliListinu } from './listina.ts';
import { addNav, type SceneKey } from './nav.ts';

// Výsledková listina 🏆 (rozhodnutí rodiče 2026-11-27): jedna společná listina herního dne – ⭐ za dočerpání
// karet (přemýšlení pokladního), ❤️ za snahu (zboží, benzín, vzduch). Pravidla bodů ve vysledky.ts.
// Stejnou listinu ukazuje konec dne (UzaverkaScene). Nový den = prázdná listina.
export class VysledkyScene extends Phaser.Scene {
  constructor() {
    super('Vysledky' satisfies SceneKey);
  }

  create(): void {
    addNav(this);
    const v = vysledkyDne(denik.zaznamy(), den().id);
    kresliListinu(this, (1280 - SIRKA_LISTINY) / 2, 100, v, 6);
  }
}
