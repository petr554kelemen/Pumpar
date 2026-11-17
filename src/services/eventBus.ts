// Sběrnice událostí – jediné místo, přes které spolu mluví služby a scény.
// Bez závislosti na Phaseru. Služby jen vysílají (emit), scény poslouchají (on).

import type { CodeInfo } from './codes.ts';

/** Odkud kód přišel. */
export type ScanSource = 'klavesnice' | 'kamera' | 'telefon';

/** Seznam všech událostí a jejich dat. Novou událost přidej sem – TypeScript pak hlídá všechna použití. */
export interface GameEvents {
  /** Naskenovaný kód (fáze 2+). */
  scan: { kod: string; info: CodeInfo; zdroj: ScanSource };
  /** Rozepsaný kód z klávesnice/čtečky (po každé klávese) – jen pro ladicí zobrazení. */
  psani: { text: string };
}

type Handler<T> = (payload: T) => void;

export class EventBus<Events extends object> {
  private listeners = new Map<keyof Events, Set<Handler<never>>>();

  /** Přihlásí posluchače. Vrací funkci pro odhlášení. */
  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.listeners.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    for (const handler of this.listeners.get(event) ?? []) {
      try {
        (handler as Handler<Events[K]>)(payload);
      } catch (err) {
        console.error(`Chyba v posluchači události "${String(event)}":`, err);
      }
    }
  }
}

export const bus = new EventBus<GameEvents>();
