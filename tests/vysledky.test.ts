import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hvezdyZaPlatbu, srdickaZaNakup, srdickaZaTecky, vysledkyDne } from '../src/services/vysledky.ts';
import type { Zaznam } from '../src/services/denik.ts';
import { Penezenka, spravnyPin } from '../src/services/penezenka.ts';
import { KodovaKlavesnice } from '../src/services/lock.ts';

test('Hvězdy: vyčerpaná karta 10 > 15 > 20, dočerpání 1 tečkou nejvíc', () => {
  assert.equal(hvezdyZaPlatbu(10, 0, 10), 5);
  assert.equal(hvezdyZaPlatbu(15, 0, 4), 4);
  assert.equal(hvezdyZaPlatbu(20, 0, 6), 3);
  assert.equal(hvezdyZaPlatbu(20, 0, 1), 6);
  assert.equal(hvezdyZaPlatbu(10, 0, 1), 6);
  assert.ok(hvezdyZaPlatbu(20, 0, 1) > hvezdyZaPlatbu(10, 0, 10));
});

test('Hvězdy: podle zbytku – hranice 2 a 5, víc = 0; 1 tečka z plné karty nic', () => {
  assert.equal(hvezdyZaPlatbu(20, 1, 5), 2);
  assert.equal(hvezdyZaPlatbu(20, 2, 5), 2);
  assert.equal(hvezdyZaPlatbu(20, 3, 5), 1);
  assert.equal(hvezdyZaPlatbu(20, 5, 5), 1);
  assert.equal(hvezdyZaPlatbu(20, 6, 14), 0);
  assert.equal(hvezdyZaPlatbu(10, 9, 1), 0);
});

test('Srdíčka: zboží podle katalogu (drahé víc), benzín jen platný, vzduch po 3 tečkách', () => {
  assert.equal(srdickaZaNakup(['A001']), 5);
  assert.equal(srdickaZaNakup(['S001', 'S001']), 2);
  assert.equal(srdickaZaNakup(['P002', 'A001']), 7);
  assert.equal(srdickaZaNakup([], 6, true), 2);
  assert.equal(srdickaZaNakup([], 1, false), 0); // „crknutí“ 1 L
  assert.equal(srdickaZaNakup(['S001'], 7, true), 1 + 3);
  assert.equal(srdickaZaTecky(1), 1);
  assert.equal(srdickaZaTecky(9), 3);
  assert.equal(srdickaZaTecky(0), 0);
});

const zaklad = { cas: '2026-11-27T10:00:00Z', den: 1, denId: 42 } as const;

test('Listina: jen dnešní den, nejnovější nahoře, součty', () => {
  const zaznamy: Zaznam[] = [
    { ...zaklad, denId: 7, druh: 'prodej', zbozi: ['A001'], tecky: 9, karta: 'K001', hodnotaKarty: 20, zbytek: 11 },
    { ...zaklad, druh: 'prodej', zbozi: ['P002', 'A001'], tecky: 14, karta: 'K001', hodnotaKarty: 20, zbytek: 6 },
    { ...zaklad, druh: 'prodej', zbozi: ['J001'], tecky: 6, karta: 'K001', hodnotaKarty: 20, zbytek: 0 },
    { ...zaklad, druh: 'vzduch', kol: 3, tecky: 9, karta: 'K004', hodnotaKarty: 10, zbytek: 1 },
    { ...zaklad, druh: 'vzduch', kol: 1, tecky: 1, karta: 'K004', hodnotaKarty: 10, zbytek: 0 },
  ];
  const v = vysledkyDne(zaznamy, 42);
  assert.equal(v.radky.length, 4);
  assert.deepEqual(v.radky.map((r) => r.hvezdy), [6, 2, 3, 0]);
  assert.deepEqual(v.radky.map((r) => r.srdicka), [1, 3, 3, 7]);
  assert.equal(v.hvezdy, 11);
  assert.equal(v.srdicka, 14);
  assert.deepEqual(v.radky[3]?.co, ['🧃', '🏎️']);
  assert.deepEqual(v.radky[1]?.co, ['🛞', '🛞', '🛞']);
});

test('Listina: benzín ⛽ v řádku, starý záznam bez karty = 0 ⭐, prázdný deník', () => {
  const zaznamy: Zaznam[] = [
    { ...zaklad, druh: 'prodej', zbozi: ['S001'], benzin: 612, benzinTecky: 6, benzinPlatny: true, tecky: 8, karta: 'K002', hodnotaKarty: 15, zbytek: 7 },
    { ...zaklad, druh: 'prodej', zbozi: ['S002'], tecky: 3, karta: 'K004' },
  ];
  const v = vysledkyDne(zaznamy, 42);
  assert.deepEqual(v.radky[1]?.co, ['⛽', '🍪']);
  assert.equal(v.radky[1]?.srdicka, 3);
  assert.equal(v.radky[0]?.hvezdy, 0);
  assert.equal(v.radky[0]?.srdicka, 1);
  assert.deepEqual(vysledkyDne([], 42), { hvezdy: 0, srdicka: 0, radky: [] });
});

test('PIN: 1111 platí, jiný ne; klávesnice s PINem neodemyká dveřním kódem jinak', () => {
  assert.equal(spravnyPin('1111'), true);
  assert.equal(spravnyPin('1234'), false);
  const k = new KodovaKlavesnice(spravnyPin);
  '1111'.split('').forEach((c) => k.stiskni(c));
  assert.equal(k.potvrd(), true);
  assert.equal(k.zadano, '');
  k.stiskni('2');
  assert.equal(k.potvrd(), false);
});

test('Peněženka: ověření platby nic neodečte (před PINem)', () => {
  const p = new Penezenka();
  p.aktivuj('K004');
  assert.deepEqual(p.overPlatbu('K004', 9), { ok: true, zbytek: 1 });
  assert.equal(p.zustatek('K004'), 10);
  assert.deepEqual(p.overPlatbu('K004', 11), { ok: false, chybi: 1 });
  assert.deepEqual(p.overPlatbu('K005', 1), { ok: false, chybi: 1 }); // neaktivní
});
