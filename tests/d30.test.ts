import { test } from 'node:test';
import assert from 'node:assert/strict';
import { D30_VARIANTY, mmNaBody, rozmerStitku, sirkaKoduBody, vejdeSe } from '../src/tisk/d30.ts';

test('D30: rozměry štítku v bodech (203 dpi)', () => {
  assert.equal(mmNaBody(12), 96);
  assert.deepEqual(rozmerStitku(30), { sirka: 240, vyska: 96 });
  assert.deepEqual(rozmerStitku(40), { sirka: 320, vyska: 96 });
});

test('D30: Code128 LA01 – 2 body/modul se vejde na 30 mm, 3 body jen na 40 mm', () => {
  const [c2, c3] = D30_VARIANTY;
  assert.ok(c2 && c3);
  assert.equal(sirkaKoduBody('LA01', c2), 198);
  assert.ok(vejdeSe('LA01', c2, 30));
  assert.ok(!vejdeSe('LA01', c3, 30));
  assert.ok(vejdeSe('LA01', c3, 40));
});

test('D30: QR se vejde na výšku 12 mm', () => {
  for (const v of D30_VARIANTY.filter((x) => x.typ === 'qr')) {
    assert.ok(vejdeSe('LA01', v, 30), JSON.stringify(v));
    assert.ok(sirkaKoduBody('LA01', v) <= 96);
  }
});
