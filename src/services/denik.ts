// Deník směny: záznam o každé placené práci – prodej v obchodě a dofukování kol. Z deníku se počítá
// výsledková listina 🏆 (vysledky.ts). Ukládá se v prohlížeči (localStorage), aby statistika přežila
// zavření hry. Bez závislosti na Phaseru.

/** Společné údaje každé platby kartou. Pole označená `?` chybí ve starších záznamech (před listinou). */
interface ZaznamPlatby {
  /** Skutečný čas (ISO) – pro rodičovskou historii po dnech. */
  cas: string;
  /** Kolikátý herní den od načtení hry. */
  den: number;
  /** ID herního dne (`HerniDen.id`) – podle něj listina pozná dnešní záznamy. */
  denId?: number;
  /** Útrata v tečkách. */
  tecky: number;
  /** Kód karty, kterou se platilo. */
  karta: string;
  /** Hodnota karty (10 / 15 / 20) a její zůstatek po platbě – z toho jsou hvězdy ⭐. */
  hodnotaKarty?: number;
  zbytek?: number;
}

export interface ZaznamProdeje extends ZaznamPlatby {
  druh: 'prodej';
  /** Kódy prodaného zboží (s opakováním). */
  zbozi: string[];
  /** Natankovaný benzín na účtu (setiny litru), pokud se platil spolu s nákupem. */
  benzin?: number;
  /** Benzín natankovaný aspoň do poloviny předvolby (platí za srdíčka). */
  benzinPlatny?: boolean;
  /** Tečky za benzín (část útraty). */
  benzinTecky?: number;
}

export interface ZaznamVzduchu extends ZaznamPlatby {
  druh: 'vzduch';
  /** Počet dofouknutých / zkontrolovaných kol. */
  kol: number;
}

export type Zaznam = ZaznamProdeje | ZaznamVzduchu;

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
