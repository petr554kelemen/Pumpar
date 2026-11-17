import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cenaKola, cenaVyberu, noveAuto, zaplat } from '../src/services/air.ts';

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

/** Náhoda z pevné řady čísel (pak stále `zbytek`). */
function rada(cisla: number[], zbytek: number): () => number {
  let i = 0;
  return () => cisla[i++] ?? zbytek;
}

test('Vzduch: obě kola na nápravě mají stejný disk', () => {
  // přední: disk zelený, kola; zadní: disk modrý, kola; vozík ne (0.9)
  const auto = noveAuto(rada([0.9, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9], 0.3));
  const disk = (id: string): string | undefined => auto.kola.find((k) => k.id === id)?.stav.disk;
  assert.equal(disk('LP'), 'zeleny');
  assert.equal(disk('PP'), 'zeleny');
  assert.equal(disk('LZ'), 'modry');
  assert.equal(disk('PZ'), 'modry');
  assert.equal(auto.vozik, false);
  assert.equal(auto.kola.length, 4);
});

test('Vzduch: auto s vozíkem má 6 kol, vozík vlastní disk', () => {
  // přední, zadní, vozík ano (0.1), disk vozíku zelený (0.9)
  const auto = noveAuto(rada([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.9, 0.1, 0.1], 0.3));
  assert.equal(auto.vozik, true);
  assert.deepEqual(auto.kola.map((k) => k.id), ['LP', 'PP', 'LZ', 'PZ', 'LV', 'PV']);
  assert.equal(auto.kola[4]?.stav.disk, 'zeleny');
  assert.equal(auto.kola[5]?.stav.disk, 'zeleny');
});

test('Vzduch: nové auto má vždy aspoň jedno podhuštěné kolo', () => {
  const plne = noveAuto(() => 0.9);
  assert.equal(plne.kola.filter((k) => k.stav.podhustene).length, 1);
  const prazdne = noveAuto(() => 0.1);
  assert.ok(prazdne.kola.every((k) => k.stav.podhustene));
});
