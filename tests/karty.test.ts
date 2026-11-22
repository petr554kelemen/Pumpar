import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCode } from '../src/services/codes.ts';
import { odemyka } from '../src/services/lock.ts';
import { najdiKartu } from '../src/services/penezenka.ts';
import { SADA_KARET } from '../src/tisk/karty.ts';
import { KARTA_STITEK, LIST, MIN_OKRAJ, rozlozeniListu } from '../src/tisk/layout.ts';

test('Karty: sada 1 × 20, 2 × 15, 4 × 10 + služební, každá karta vlastní kód, hra je rozpozná', () => {
  const hodnoty = SADA_KARET.flatMap((k) => (k.druh === 'penize' ? [k.hodnota] : []));
  assert.deepEqual(hodnoty, [20, 15, 15, 10, 10, 10, 10]);
  assert.equal(new Set(SADA_KARET.map((k) => k.kod)).size, SADA_KARET.length, 'kódy se neopakují');
  for (const k of SADA_KARET) {
    assert.equal(parseCode(k.kod).druh, 'karta', k.kod);
    if (k.druh === 'penize') {
      assert.equal(najdiKartu(k.kod)?.hodnota, k.hodnota);
      assert.equal(odemyka(k.kod), false, 'peněžní karta neodemyká benzínku');
    } else {
      assert.equal(odemyka(k.kod), true, 'služební karta odemyká benzínku');
      assert.equal(najdiKartu(k.kod), undefined, 'služební karta neplatí');
    }
  }
});

test('Karty: 8 štítků 2 × 4 se vejde na A4', () => {
  const r = rozlozeniListu(2, 4, KARTA_STITEK);
  assert.equal(r.pozice.length, SADA_KARET.length);
  assert.ok(r.okrajX >= MIN_OKRAJ && r.okrajY >= MIN_OKRAJ);
  const posledni = r.pozice.at(-1);
  assert.ok(posledni && posledni.y + KARTA_STITEK.vyska <= LIST.vyska - MIN_OKRAJ);
});
