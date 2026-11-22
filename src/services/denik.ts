// Deník směny (Dev_notes → Výsledky obsluhy): záznam o každé práci – zatím prodej v obchodě.
// Z deníku se později spočítají body do uzávěrky (kdo obsluhoval, kolik prodal). Ukládá se v prohlížeči
// (localStorage), aby statistika přežila zavření hry. Bez závislosti na Phaseru.

export interface ZaznamProdeje {
  druh: 'prodej';
  /** Skutečný čas (ISO) – pro rodičovskou historii po dnech. */
  cas: string;
  /** Kolikátý herní den od načtení hry. */
  den: number;
  /** Kódy prodaného zboží (s opakováním). */
  zbozi: string[];
  /** Natankovaný benzín na účtu (setiny litru), pokud se platil spolu s nákupem. */
  benzin?: number;
  /** Útrata v tečkách (zboží + benzín). */
  tecky: number;
  /** Kód karty, kterou se platilo. */
  karta: string;
}

export type Zaznam = ZaznamProdeje;

/** Úložiště jako localStorage (v testech náhrada v paměti). */
export interface Uloziste {
  getItem(klic: string): string | null;
  setItem(klic: string, hodnota: string): void;
}

export const KLIC_DENIKU = 'pumpar.denik';

export class Denik {
  private readonly uloziste: Uloziste | null;

  constructor(uloziste: Uloziste | null) {
    this.uloziste = uloziste;
  }

  zaznamy(): Zaznam[] {
    try {
      const data: unknown = JSON.parse(this.uloziste?.getItem(KLIC_DENIKU) ?? '[]');
      return Array.isArray(data) ? (data as Zaznam[]) : [];
    } catch {
      return [];
    }
  }

  zapis(z: Zaznam): void {
    try {
      this.uloziste?.setItem(KLIC_DENIKU, JSON.stringify([...this.zaznamy(), z]));
    } catch {
      // Plné / zakázané úložiště – hra jede dál, jen se nezapíše statistika.
    }
  }
}

function prohlizecoveUloziste(): Uloziste | null {
  try {
    // Jen v prohlížeči (Node v testech by hlásil varování o chybějícím souboru úložiště).
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const denik = new Denik(prohlizecoveUloziste());
