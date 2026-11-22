// Účet za benzín (fáze 4 – napojení stojanu na obchod, postup ze staré verze): po tankování hráč „jde
// platit“ – natankovaný benzín čeká na účtu a v obchodě je první položkou košíku (modré tečky). Zaplatí se
// jednou kartou spolu se zbožím. Účet patří k hernímu dni (nový den = prázdný). Bez závislosti na Phaseru.

import { den } from './den.ts';
import { PENEZNI_KARTY } from './penezenka.ts';
import { tecky } from './pump.ts';

/** Benzín se dá zaplatit jen jednou kartou → nejvýš hodnota největší karty (stará verze: bankovka 25 → 22). */
export const MAX_BENZIN_TECEK = Math.max(...PENEZNI_KARTY.map((k) => k.hodnota));

/** Platit se jde už od 0,80 L (stará verze) do hodnoty největší karty. */
export function lzeJitPlatit(setiny: number): boolean {
  return setiny >= 80 && tecky(setiny) <= MAX_BENZIN_TECEK;
}

/** Tečky za benzín na účtu (aspoň 1). */
export function teckyZaBenzin(setiny: number): number {
  return Math.max(1, tecky(setiny));
}

export class Ucet {
  /** Nezaplacený benzín v setinách litru; null = nic nečeká. */
  benzin: number | null = null;
  /** Režim „+ Obchod“ (zelené předvolby): po zaplacení zpět ke stojanu s novou náhodnou předvolbou. */
  rezimObchodu = false;

  vyprazdni(): void {
    this.benzin = null;
    this.rezimObchodu = false;
  }
}

const aktualni = new Ucet();
let proDen = den().cislo;

export function ucet(): Ucet {
  const cislo = den().cislo;
  if (cislo !== proDen) {
    aktualni.vyprazdni();
    proDen = cislo;
  }
  return aktualni;
}
