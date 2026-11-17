import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KOLA, cenaKola, cenaVyberu, noveAuto, zaplat } from '../src/services/air.ts';

test('Vzduch: cena dofouknutí podle disku – modrý 2, červený 3, zelený 5; kontrola 1', () => {
  assert.equal(cenaKola({ podhustene: true, disk: 'modry' }), 2);
  assert.equal(cenaKola({ podhustene: true, disk: 'cerveny' }), 3);
  assert.equal(cenaKola({ podhustene: true, disk: 'zeleny' }), 5);
  assert.equal(cenaKola({ podhustene: false, disk: 'zeleny' }), 1);
});

test('Vzduch: karta 10 stačí na 3 červená kola, na 4 ne (příklad hráče)', () => {
  const cervene = { podhustene: true, disk: 'cerveny' } as const;
  assert.deepEqual(zaplat(10, cenaVyberu([cervene, cervene, cervene])), { ok: true, zbytek: 1 });
  assert.deepEqual(zaplat(10, cenaVyberu([cervene, cervene, cervene, cervene])), { ok: false, chybi: 2 });
});

test('Vzduch: nejdražší auto (4 prázdná zelená) = 20 → karta 20 stačí', () => {
  const zelene = { podhustene: true, disk: 'zeleny' } as const;
  assert.equal(cenaVyberu([zelene, zelene, zelene, zelene]), 20);
});

test('Vzduch: obě kola na nápravě mají stejný disk', () => {
  let i = 0;
  const hodnoty = [0.9, 0.1]; // přední zelený, zadní modrý
  const auto = noveAuto(() => hodnoty[i++] ?? 0.3);
  assert.equal(auto.LP.disk, 'zeleny');
  assert.equal(auto.PP.disk, 'zeleny');
  assert.equal(auto.LZ.disk, 'modry');
  assert.equal(auto.PZ.disk, 'modry');
});

test('Vzduch: nové auto má vždy aspoň jedno podhuštěné kolo', () => {
  const auto = noveAuto(() => 0.9);
  assert.equal(KOLA.filter((k) => auto[k].podhustene).length, 1);
  const vsechna = noveAuto(() => 0.1);
  assert.equal(KOLA.filter((k) => vsechna[k].podhustene).length, 4);
});
