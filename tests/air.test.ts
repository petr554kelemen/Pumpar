import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KOLA, cenaKol, cenaVyberu, noveAuto, zaplat } from '../src/services/air.ts';

test('Vzduch: kolo stojí 3 tečky', () => {
  assert.deepEqual([1, 2, 3, 4].map(cenaKol), [3, 6, 9, 12]);
});

test('Vzduch: karta 10 stačí na 3 kola, na 4 ne (příklad hráče)', () => {
  assert.deepEqual(zaplat(10, cenaKol(3)), { ok: true, zbytek: 1 });
  assert.deepEqual(zaplat(10, cenaKol(4)), { ok: false, chybi: 2 });
  assert.deepEqual(zaplat(15, cenaKol(4)), { ok: true, zbytek: 3 });
});

test('Vzduch: nové auto má vždy aspoň jedno podhuštěné kolo', () => {
  const auto = noveAuto(() => 0.9); // všechna by byla plná
  assert.equal(KOLA.filter((k) => auto[k]).length, 1);
  const vsechna = noveAuto(() => 0.1);
  assert.equal(KOLA.filter((k) => vsechna[k]).length, 4);
});

test('Vzduch: kontrola plného kola stojí 1 tečku, dofouknutí 3', () => {
  assert.equal(cenaVyberu([true, true, false, false]), 8);
  assert.equal(cenaVyberu([false]), 1);
  assert.equal(cenaVyberu([]), 0);
});
