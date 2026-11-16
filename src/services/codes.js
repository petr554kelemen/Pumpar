// Rozpoznání herních kódů (formát viz README → Formát kódů).
// Písmeno + 3 číslice; písmeno = kategorie. Rodičovské kódy: 9 + 3 číslice.
// Bez závislosti na Phaseru.

export const MAX_BANKNOTE = 30;

// Písmena kategorií. Zakázaná: s diakritikou, X (= chyba), Y a Z (prohazování na CZ klávesnici).
export const CATEGORIES = {
  P: { nazev: 'pití', emoji: '🧃', druh: 'zbozi' },
  S: { nazev: 'sladkosti', emoji: '🍭', druh: 'zbozi' },
  J: { nazev: 'jídlo', emoji: '🌭', druh: 'zbozi' },
  H: { nazev: 'hračky', emoji: '🧸', druh: 'zbozi' },
  A: { nazev: 'autíčka', emoji: '🏎️', druh: 'zbozi' },
  M: { nazev: 'myčka', emoji: '🧽', druh: 'zbozi' },
  V: { nazev: 'vysavač', emoji: '🧹', druh: 'zbozi' },
  N: { nazev: 'Natural', emoji: '⛽', druh: 'zbozi' },
  D: { nazev: 'Diesel', emoji: '⛽', druh: 'zbozi' },
  B: { nazev: 'bankovka', emoji: '💵', druh: 'bankovka' },
  K: { nazev: 'karta', emoji: '💳', druh: 'karta' },
};

const CATEGORY_RE = /^([A-Z])(\d{3})$/;
const ADMIN_RE = /^9\d{3}$/;

/**
 * Rozpozná kód. Vrací objekt s `druh`:
 *   'zbozi' | 'bankovka' | 'karta' – { kod, pismeno, cislo, kategorie, [hodnota] }
 *   'rodic'                       – { kod }
 *   'chyba'                       – { kod } (neznámý formát / písmeno / hodnota)
 */
export function parseCode(raw) {
  const kod = String(raw ?? '').trim().toUpperCase();

  if (ADMIN_RE.test(kod)) return { druh: 'rodic', kod };

  const m = CATEGORY_RE.exec(kod);
  const kategorie = m && CATEGORIES[m[1]];
  if (!kategorie) return { druh: 'chyba', kod };

  const pismeno = m[1];
  const cislo = Number.parseInt(m[2], 10);
  const vysledek = { druh: kategorie.druh, kod, pismeno, cislo, kategorie };

  if (kategorie.druh === 'bankovka') {
    if (cislo < 1 || cislo > MAX_BANKNOTE) return { druh: 'chyba', kod };
    vysledek.hodnota = cislo;
  }

  return vysledek;
}
