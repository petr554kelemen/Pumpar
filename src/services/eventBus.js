// Sběrnice událostí – jediné místo, přes které spolu mluví služby a scény.
// Bez závislosti na Phaseru. Služby jen vysílají (emit), scény poslouchají (on).
//
// Používané události (doplňovat zde):
//   'pip'   {}            – testovací pípnutí (fáze 0)
//   'scan'  { code }      – naskenovaný kód (fáze 2+)
//   'paid'  { amount }    – zaplaceno (fáze 5+)

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /** Přihlásí posluchače. Vrací funkci pro odhlášení. */
  on(event, handler) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event, payload = {}) {
    for (const handler of this.listeners.get(event) ?? []) {
      try {
        handler(payload);
      } catch (err) {
        console.error(`Chyba v posluchači události "${event}":`, err);
      }
    }
  }
}

export const bus = new EventBus();
