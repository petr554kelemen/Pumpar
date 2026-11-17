// Odemykání benzínky (nápad hráče): bez benzináře je zavřeno. Platí obě cesty –
// kód na klávesnici u dveří, nebo pípnutí služební karty. Bez závislosti na Phaseru.
// Kód i karta jsou zatím návrh do dílny ✏️ (kód zvolí hráč, jiný než PIN platební karty 1234).

/** Kód dveří (návrh – zvolí hráč v dílně). */
export const KOD_DVERI = '1111';
/** Služební karta benzináře (návrh – vzhled a kód v dílně). */
export const SLUZEBNI_KARTA = 'K000';
/** Nejvíc číslic na displeji (hráč zná i 6místné PINy). */
export const MAX_CISLIC = 6;

/**
 * Kdo přichází ke dveřím (volí se na začátku scény):
 * - obsluha (benzinář) si odemyká sama kódem nebo služební kartou – kdykoli, i před otevírací dobou,
 * - zákazník kód nemá – čeká, až hodiny nad dveřmi ukážou otevírací dobu, pak vejde.
 */
export type Role = 'obsluha' | 'zakaznik';

/** Za kolik minut od příchodu se otevírá (hodiny nad dveřmi – učení času; čekání nesmí být dlouhé). */
export const MINUT_DO_OTEVRENI = 2;

/** Otevírací doba: nejméně `minut` od teď, zaokrouhleno nahoru na celou minutu. */
export function otviraciDoba(ted: Date, minut = MINUT_DO_OTEVRENI): Date {
  const d = new Date(ted.getTime() + minut * 60_000);
  if (d.getSeconds() > 0 || d.getMilliseconds() > 0) d.setMinutes(d.getMinutes() + 1, 0, 0);
  return d;
}

export function jeOtevreno(ted: Date, od: Date): boolean {
  return ted.getTime() >= od.getTime();
}

/** „9:05“ – hodiny bez nuly, minuty vždy dvě číslice. */
export function formatCas(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Úhly ručiček ve stupních (0 = nahoru na 12, po směru hodin). */
export function uhlyRucicek(d: Date): { hodinova: number; minutova: number; vterinova: number } {
  const s = d.getSeconds();
  const m = d.getMinutes() + s / 60;
  const h = (d.getHours() % 12) + m / 60;
  return { hodinova: h * 30, minutova: m * 6, vterinova: s * 6 };
}

/** Odemkne tento kód/karta dveře? */
export function odemyka(kod: string): boolean {
  const k = kod.trim().toUpperCase();
  return k === KOD_DVERI || k === SLUZEBNI_KARTA;
}

/** Zadávání kódu na klávesnici u dveří (na displeji jen hvězdičky). */
export class KodovaKlavesnice {
  private cislice = '';

  get zadano(): string {
    return this.cislice;
  }

  /** Hvězdičky místo číslic. */
  get hvezdicky(): string {
    return '*'.repeat(this.cislice.length);
  }

  /** Přidá číslici; nad limit se nic nepřidá. */
  stiskni(c: string): void {
    if (/^\d$/.test(c) && this.cislice.length < MAX_CISLIC) this.cislice += c;
  }

  /** Nastaví celé zadání (číslice psané na klávesnici počítače). */
  nastav(text: string): void {
    if (/^\d*$/.test(text)) this.cislice = text.slice(0, MAX_CISLIC);
  }

  vymaz(): void {
    this.cislice = '';
  }

  /** Potvrdí zadání: vrátí, zda odemyká, a displej vymaže. */
  potvrd(): boolean {
    const ok = this.cislice !== '' && odemyka(this.cislice);
    this.cislice = '';
    return ok;
  }
}
