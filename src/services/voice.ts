// Hlasové fráze: nahrané MP3 v `public/hlas/<klic>.mp3` (rozhodnutí 2026-11-27 – málo frází, jen kde je to fajn).
// Fronta = fráze se nepřekřikují. Chybějící / nepřehratelný soubor se tiše přeskočí – hra funguje i bez nahrávek.
// Soubor se stahuje až při prvním přehrání (nic se nenačítá při startu hry).

/** Jediný zdroj pravdy: klíč (= název souboru bez .mp3) → text k namluvení. */
export const FRAZE = {
  otevreno: 'Benzínka je otevřená!',
  uzaviraji: 'Pokladny se budou uzavírat.',
  zavreno: 'Benzínka je zavřená.',
  zadejte_pin: 'Zadejte PIN.',
  platba_prijata: 'Platba přijata.',
  vlecka_vyjizdi: 'Vlečka vyjíždí!',
} as const;

export type Fraze = keyof typeof FRAZE;

/** Přehraje jeden soubor; resolve po dohrání i po chybě (fronta se nesmí zaseknout). */
export type Prehravac = (klic: Fraze) => Promise<void>;

/** Nejdelší čekání na jednu frázi – pojistka, kdyby prohlížeč nevyvolal ani konec, ani chybu. */
const MAX_FRAZE_MS = 8000;

function prehravacMp3(): Prehravac {
  const cache = new Map<Fraze, HTMLAudioElement>();
  return (klic) =>
    new Promise<void>((hotovo) => {
      let a = cache.get(klic);
      if (!a) {
        a = new Audio(`hlas/${klic}.mp3`); // base './' → relativně k index.html
        cache.set(klic, a);
      }
      const audio = a;
      let konec = false;
      const dokonci = (): void => {
        if (konec) return;
        konec = true;
        clearTimeout(pojistka);
        audio.removeEventListener('ended', dokonci);
        audio.removeEventListener('error', dokonci);
        hotovo();
      };
      const pojistka = setTimeout(dokonci, MAX_FRAZE_MS);
      audio.addEventListener('ended', dokonci);
      audio.addEventListener('error', dokonci);
      audio.currentTime = 0;
      audio.play().catch(dokonci);
    });
}

export class Hlas {
  private readonly fronta: Fraze[] = [];
  private hraje = false;
  zapnuto = true;
  private readonly prehraj: Prehravac;

  constructor(prehraj: Prehravac) {
    this.prehraj = prehraj;
  }

  /** Zařadí frázi do fronty. Stejná fráze, která už čeká, se nepřidá podruhé. */
  rekni(klic: Fraze): void {
    if (!this.zapnuto || this.fronta.includes(klic)) return;
    this.fronta.push(klic);
    void this.dalsi();
  }

  get mluvi(): boolean {
    return this.hraje;
  }

  private async dalsi(): Promise<void> {
    if (this.hraje) return;
    const klic = this.fronta.shift();
    if (!klic) return;
    this.hraje = true;
    try {
      await this.prehraj(klic);
    } catch {
      // Hlas není podmínkou hry.
    }
    this.hraje = false;
    void this.dalsi();
  }
}

let instance: Hlas | null = null;

/** Sdílený hlas hry (v prohlížeči přehrává MP3). */
export function hlas(): Hlas {
  instance ??= new Hlas(prehravacMp3());
  return instance;
}

/** Řekne frázi se zpožděním (např. až dozní gong). */
export function rekniPo(ms: number, klic: Fraze): void {
  setTimeout(() => hlas().rekni(klic), ms);
}
