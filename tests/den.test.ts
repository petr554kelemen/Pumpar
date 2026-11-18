import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DELKA_SMENY_MS,
  HLASENI_PRED_KONCEM_MS,
  HerniDen,
  OTEVIRACI_DOBY,
  ZAVIRACI_DOBY,
  den,
  novyDen,
} from '../src/services/den.ts';
import { formatCas } from '../src/services/lock.ts';

const T0 = 1_000_000;
const MIN = 60_000;

test('Herní den: otevírací doby jen 6:00–8:00 po půlhodinách, zavírací 20:00 / 21:00', () => {
  const otevreni = new Set<string>();
  const zavreni = new Set<string>();
  for (let i = 0; i < 10; i++) {
    const r = i / 10;
    const d = new HerniDen(T0, 1, () => r);
    otevreni.add(formatCas(d.otevirackaJakoCas));
    zavreni.add(String(d.zavreni));
  }
  assert.deepEqual([...otevreni].sort(), ['6:00', '6:30', '7:00', '7:30', '8:00']);
  assert.deepEqual([...zavreni].sort(), ZAVIRACI_DOBY.map(String));
  assert.equal(OTEVIRACI_DOBY.length, 5);
});

test('Herní den: ráno hodiny běží skutečným tempem 2 minuty před otevírací dobou', () => {
  const d = new HerniDen(T0, 1, () => 0.5); // 7:00, 21:00
  assert.equal(formatCas(d.cas(T0)), '6:58');
  assert.equal(d.cas(T0 + 30_000).getSeconds(), 30);
  assert.equal(d.jeOtviraciDoba(T0 + 2 * MIN - 1), false);
  assert.equal(d.jeOtviraciDoba(T0 + 2 * MIN), true);
  assert.equal(formatCas(d.cas(T0 + 2 * MIN)), '7:00');
  assert.equal(d.stav(T0 + 10 * MIN), 'rano'); // dokud nikdo neotevře, směna neběží
  assert.equal(d.zbyvaMinut(T0 + 10 * MIN), 20);
});

test('Herní den: směna 20 minut, hlášení 2 minuty před koncem, pak zavřeno v zavírací době', () => {
  const d = new HerniDen(T0, 1, () => 0); // 6:00, 20:00
  const od = T0 + MIN;
  d.otevri(od);
  d.otevri(od + 5 * MIN); // opakované otevření směnu neposune
  assert.equal(d.stav(od), 'otevreno');
  assert.equal(d.podil(od), 1);
  assert.equal(d.zbyvaMinut(od + 30_000), 20);
  assert.equal(d.zbyvaMinut(od + 19 * MIN + 1), 1);
  assert.equal(d.stav(od + DELKA_SMENY_MS - HLASENI_PRED_KONCEM_MS - 1), 'otevreno');
  assert.equal(d.stav(od + DELKA_SMENY_MS - HLASENI_PRED_KONCEM_MS), 'zavirani');
  assert.equal(d.stav(od + DELKA_SMENY_MS), 'zavreno');
  assert.equal(d.podil(od + DELKA_SMENY_MS + MIN), 0);
  assert.equal(formatCas(d.cas(od + DELKA_SMENY_MS)), '20:00');
});

test('Herní den: obsluha může zavřít dřív, nový den má další číslo', () => {
  const d = new HerniDen(T0);
  d.otevri(T0);
  d.ukonci();
  assert.equal(d.stav(T0 + MIN), 'zavreno');
  assert.equal(d.zbyvaMs(T0 + MIN), 0);

  const prvni = den();
  const dalsi = novyDen(T0);
  assert.equal(dalsi.cislo, prvni.cislo + 1);
  assert.equal(den(), dalsi);
  assert.equal(dalsi.stav(T0), 'rano');
});
