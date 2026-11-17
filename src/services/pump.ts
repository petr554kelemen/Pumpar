// Logika výdejního stojanu (převzato ze staré verze, bez obchodu). Bez závislosti na Phaseru – testovatelné.
// Litry se počítají v setinách jako celá čísla (10,00 L = 1000), aby nevznikaly chyby zaokrouhlení.

export type RezimTankovani = 'rychle' | 'pomalu';

/** Rychlosti ze staré verze: rychle 0,07 L za 45 ms, pomalu 0,01 L za 95 ms. */
export const RYCHLOST: Readonly<Record<RezimTankovani, { krok: number; intervalMs: number; cvakNaLitr: number }>> = {
  rychle: { krok: 7, intervalMs: 45, cvakNaLitr: 5 },
  pomalu: { krok: 1, intervalMs: 95, cvakNaLitr: 20 },
};

export const MAX_SETIN = 9999; // 99,99 L
export const CENA_LITRU_KC = 36.5;

/** Rychlé předvolby (celé litry) a desetinné části pro náhodnou předvolbu – jako ve staré verzi. */
export const RYCHLE_PREDVOLBY = [5, 10, 15] as const;
const NAHODNE_SETINY = [0, 25, 50, 75, 10, 30, 80] as const;

export function formatLitry(setiny: number): string {
  return (setiny / 100).toFixed(2);
}

/** Tečky za benzín = zaokrouhlené litry (stará verze). */
export function tecky(setiny: number): number {
  return Math.round(setiny / 100);
}

/**
 * Předvolba zadávaná jako na pokladně: číslice se přisouvají zprava, poslední dvě jsou setiny
 * (1 → 0.01, 10 → 0.10, 100 → 1.00, 1000 → 10.00). Po předvolbě/vymazání první číslice začne nové zadání.
 */
export class Predvolba {
  private cislice = '1000';
  private nove = true;

  get setiny(): number {
    return Math.min(MAX_SETIN, Number(this.cislice) || 0);
  }

  stiskni(c: string): void {
    if (!/^\d$/.test(c)) return;
    if (this.nove || this.cislice === '0') {
      this.cislice = c;
      this.nove = false;
    } else {
      this.cislice = (this.cislice + c).slice(-4);
    }
  }

  vymaz(): void {
    this.cislice = '0';
    this.nove = true;
  }

  nastavLitry(litry: number): void {
    this.cislice = String(Math.min(MAX_SETIN, Math.round(litry * 100)));
    this.nove = true;
  }

  /** Náhodná předvolba 3,00–22,80 L (stará verze, bez obchodu). */
  nahodna(rng: () => number = Math.random): void {
    const cele = Math.floor(rng() * 20) + 3;
    const setiny = NAHODNE_SETINY[Math.floor(rng() * NAHODNE_SETINY.length)] ?? 0;
    this.cislice = String(cele * 100 + setiny);
    this.nove = true;
  }
}

export type Vysledek =
  | { druh: 'presne' }
  | { druh: 'malo'; chybi: number }
  | { druh: 'preteklo'; navic: number };

export class Stojan {
  natankovano = 0;

  /** Jeden krok tankování. Vrací true, když má cvaknout zvuk (stejné tempo jako stará verze). */
  krok(rezim: RezimTankovani): boolean {
    const { krok, cvakNaLitr } = RYCHLOST[rezim];
    const pred = Math.floor((this.natankovano * cvakNaLitr) / 100);
    this.natankovano = Math.min(MAX_SETIN, this.natankovano + krok);
    return Math.floor((this.natankovano * cvakNaLitr) / 100) !== pred;
  }

  vynuluj(): void {
    this.natankovano = 0;
  }

  /** Vyhodnocení po puštění pistole; null = nic nenatankováno. */
  vyhodnot(cil: number): Vysledek | null {
    if (this.natankovano <= 0) return null;
    const rozdil = this.natankovano - cil;
    if (rozdil === 0) return { druh: 'presne' };
    return rozdil < 0 ? { druh: 'malo', chybi: -rozdil } : { druh: 'preteklo', navic: rozdil };
  }
}
