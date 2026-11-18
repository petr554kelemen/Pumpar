// Herní den (nápad rodiče): hodiny ukazují časy, které hráč zná, ne skutečný čas.
// Ráno: hodiny nad dveřmi běží skutečným tempem od chvíle kousek před otevírací dobou (6:00–8:00).
// Po otevření: směna = odpočet 20 minut skutečného času. Před koncem hlášení „pokladny se budou uzavírat“,
// na konci zavřeno ve 20:00 / 21:00 → uzávěrka. Hraje se dál = nový den. Bez závislosti na Phaseru.

/** Otevírací doby v minutách od půlnoci: 6:00, 6:30, 7:00, 7:30, 8:00. */
export const OTEVIRACI_DOBY = [360, 390, 420, 450, 480] as const;
/** Zavírací doby: 20:00, 21:00. */
export const ZAVIRACI_DOBY = [1200, 1260] as const;
/** Hodiny u dveří začínají tolik minut před otevírací dobou (čekání nesmí být dlouhé). */
export const MINUT_PRED_OTEVRENIM = 2;
/** Délka směny ve skutečném čase. */
export const DELKA_SMENY_MS = 20 * 60_000;
/** Hlášení „pokladny se budou uzavírat“ tolik před koncem směny. */
export const HLASENI_PRED_KONCEM_MS = 2 * 60_000;

export type StavDne = 'rano' | 'otevreno' | 'zavirani' | 'zavreno';

function vyber<T>(moznosti: readonly T[], rng: () => number): T {
  const v = moznosti[Math.floor(rng() * moznosti.length)];
  if (v === undefined) throw new Error('Prázdný výběr');
  return v;
}

export class HerniDen {
  /** Otevírací a zavírací doba v minutách od půlnoci. */
  readonly otevreni: number;
  readonly zavreni: number;
  /** Skutečný čas (ms), kdy hodiny ukazovaly otevírací dobu − MINUT_PRED_OTEVRENIM. */
  private readonly zacatek: number;
  /** Skutečný čas (ms) začátku směny; null = ještě zavřeno. */
  private smenaOd: number | null = null;
  /** Směnu ukončila obsluha dřív (🔒). */
  private ukonceno = false;
  /** Hlášení o zavírání už zaznělo (hraje jednou za den, ať je hráč v kterékoli scéně). */
  ohlaseno = false;

  /** Kolikátý den (od načtení hry). */
  readonly cislo: number;

  constructor(ted: number, cislo = 1, rng: () => number = Math.random) {
    this.cislo = cislo;
    this.zacatek = ted;
    this.otevreni = vyber(OTEVIRACI_DOBY, rng);
    this.zavreni = vyber(ZAVIRACI_DOBY, rng);
  }

  /** Herní čas na hodinách: ráno běží skutečným tempem, po konci směny ukazují zavírací dobu. */
  cas(ted: number): Date {
    const minut = this.stav(ted) === 'zavreno' ? this.zavreni : this.otevreni - MINUT_PRED_OTEVRENIM;
    const ubehlo = this.stav(ted) === 'zavreno' ? 0 : Math.max(0, ted - this.zacatek);
    return new Date(new Date(2026, 0, 1, 0, minut).getTime() + ubehlo);
  }

  /** Otevírací doba jako Date (pro cedulku na dveřích). */
  get otevirackaJakoCas(): Date {
    return new Date(2026, 0, 1, 0, this.otevreni);
  }

  /** Skutečný čas (ms), kdy hodiny dojdou na otevírací dobu. */
  get otevreniV(): number {
    return this.zacatek + MINUT_PRED_OTEVRENIM * 60_000;
  }

  jeOtviraciDoba(ted: number): boolean {
    return ted >= this.otevreniV;
  }

  /** Začne směnu (odemčení obsluhou / vstup zákazníka). Opakované volání nic nemění. */
  otevri(ted: number): void {
    this.smenaOd ??= ted;
  }

  /** Obsluha zavřela benzínku dřív (🔒). */
  ukonci(): void {
    this.ukonceno = true;
  }

  zbyvaMs(ted: number): number {
    if (this.ukonceno) return 0;
    if (this.smenaOd === null) return DELKA_SMENY_MS;
    return Math.max(0, this.smenaOd + DELKA_SMENY_MS - ted);
  }

  /** Zbývající část směny 1 → 0 (výseč odpočtu). */
  podil(ted: number): number {
    return this.zbyvaMs(ted) / DELKA_SMENY_MS;
  }

  /** Zbývající celé minuty zaokrouhlené nahoru (na displeji „1“ až do úplného konce). */
  zbyvaMinut(ted: number): number {
    return Math.ceil(this.zbyvaMs(ted) / 60_000);
  }

  stav(ted: number): StavDne {
    if (this.ukonceno) return 'zavreno';
    if (this.smenaOd === null) return 'rano';
    const zbyva = this.zbyvaMs(ted);
    if (zbyva <= 0) return 'zavreno';
    return zbyva <= HLASENI_PRED_KONCEM_MS ? 'zavirani' : 'otevreno';
  }
}

// Aktuální den – sdílí ho všechny scény (scény se při přepínání vytvářejí znovu).
let aktualni = new HerniDen(Date.now());

export function den(): HerniDen {
  return aktualni;
}

/** Hraje se dál = nový den (nová otevírací/zavírací doba, hodiny znovu kousek před otevřením). */
export function novyDen(ted = Date.now()): HerniDen {
  aktualni = new HerniDen(ted, aktualni.cislo + 1);
  return aktualni;
}
