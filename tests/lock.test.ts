import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KOD_DVERI,
  KodovaKlavesnice,
  MAX_CISLIC,
  SLUZEBNI_KARTA,
  formatCas,
  odemyka,
  uhlyRucicek,
} from '../src/services/lock.ts';

test('Hodiny: formát a úhly ručiček', () => {
  assert.equal(formatCas(new Date(2026, 0, 1, 9, 5)), '9:05');
  assert.deepEqual(uhlyRucicek(new Date(2026, 0, 1, 15, 0, 0)), { hodinova: 90, minutova: 0, vterinova: 0 });
  assert.deepEqual(uhlyRucicek(new Date(2026, 0, 1, 6, 30, 0)), { hodinova: 195, minutova: 180, vterinova: 0 });
});

test('Zámek: odemyká kód dveří i služební karta (obě cesty)', () => {
  assert.equal(odemyka(KOD_DVERI), true);
  assert.equal(odemyka(SLUZEBNI_KARTA), true);
  assert.equal(odemyka(SLUZEBNI_KARTA.toLowerCase()), true);
  assert.equal(odemyka('1234'), false); // PIN platební karty dveře neotevře
  assert.equal(odemyka('K001'), false); // platební karta taky ne
  assert.equal(odemyka(''), false);
});

test('Zámek: klávesnice ukazuje hvězdičky a potvrzení displej vymaže', () => {
  const k = new KodovaKlavesnice();
  for (const c of KOD_DVERI) k.stiskni(c);
  assert.equal(k.hvezdicky, '*'.repeat(KOD_DVERI.length));
  assert.equal(k.potvrd(), true);
  assert.equal(k.zadano, '');
  k.stiskni('9');
  assert.equal(k.potvrd(), false);
  assert.equal(k.potvrd(), false); // prázdné zadání neotevře
});

test('Zámek: nejvýš MAX_CISLIC číslic, jiné znaky se ignorují', () => {
  const k = new KodovaKlavesnice();
  for (let i = 0; i < 10; i++) k.stiskni('1');
  k.stiskni('A');
  assert.equal(k.zadano.length, MAX_CISLIC);
  k.nastav('12');
  assert.equal(k.zadano, '12');
  k.nastav('K0'); // rozepsaná karta se na displej nepíše
  assert.equal(k.zadano, '12');
  k.vymaz();
  assert.equal(k.zadano, '');
});
