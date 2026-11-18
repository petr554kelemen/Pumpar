import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Predvolba, Stojan, formatLitry, stavNadrze, tecky } from '../src/services/pump.ts';

test('Předvolba: výchozí 10.00 L', () => {
  assert.equal(new Predvolba().setiny, 1000);
});

test('Předvolba: zadávání jako na pokladně (zprava, setiny)', () => {
  const p = new Predvolba();
  p.stiskni('1'); // první číslice začne nové zadání
  assert.equal(p.setiny, 1);
  p.stiskni('2');
  p.stiskni('5');
  assert.equal(formatLitry(p.setiny), '1.25');
  p.stiskni('0');
  assert.equal(formatLitry(p.setiny), '12.50');
  p.stiskni('7'); // max 4 číslice – nejstarší vypadne
  assert.equal(formatLitry(p.setiny), '25.07');
});

test('Předvolba: C vymaže, rychlá předvolba a další číslice začne znovu', () => {
  const p = new Predvolba();
  p.vymaz();
  assert.equal(p.setiny, 0);
  p.nastavLitry(15);
  assert.equal(p.setiny, 1500);
  p.stiskni('5');
  assert.equal(p.setiny, 5);
});

test('Předvolba: náhoda v rozsahu 3,00–22,80 L', () => {
  const p = new Predvolba();
  p.nahodna(() => 0);
  assert.equal(p.setiny, 300);
  p.nahodna(() => 0.999);
  assert.equal(p.setiny, 2280);
});

test('Stojan: rychle 0,07 L, pomalu 0,01 L za krok', () => {
  const s = new Stojan();
  s.krok('rychle');
  assert.equal(s.natankovano, 7);
  s.krok('pomalu');
  assert.equal(s.natankovano, 8);
});

test('Stojan: vyhodnocení přesně / málo / přeteklo', () => {
  const s = new Stojan();
  assert.equal(s.vyhodnot(1000), null);
  for (let i = 0; i < 1000; i++) s.krok('pomalu');
  assert.deepEqual(s.vyhodnot(1000), { druh: 'presne' });
  assert.deepEqual(s.vyhodnot(1005), { druh: 'malo', chybi: 5 });
  assert.deepEqual(s.vyhodnot(990), { druh: 'preteklo', navic: 10 });
});

test('Stojan: cvaknutí rychle 5× a pomalu 20× na litr', () => {
  const pocet = (rezim: 'rychle' | 'pomalu', kroku: number): number => {
    const s = new Stojan();
    let n = 0;
    for (let i = 0; i < kroku; i++) if (s.krok(rezim)) n++;
    return n;
  };
  assert.equal(pocet('pomalu', 100), 20);
  assert.equal(pocet('rychle', 100), 35); // 7 L × 5
});

test('tečky = zaokrouhlené litry', () => {
  assert.equal(tecky(1049), 10);
  assert.equal(tecky(1050), 11);
});

test('stavNadrze: bod se počítá od poloviny předvolby, přetečení zvlášť', () => {
  assert.deepEqual(stavNadrze(0, 1000), { podil: 0, pasmo: 'nepocita' });
  assert.deepEqual(stavNadrze(499, 1000), { podil: 0.499, pasmo: 'nepocita' });
  assert.deepEqual(stavNadrze(500, 1000), { podil: 0.5, pasmo: 'pocita' });
  assert.deepEqual(stavNadrze(1000, 1000), { podil: 1, pasmo: 'pocita' });
  assert.deepEqual(stavNadrze(1001, 1000), { podil: 1, pasmo: 'preteklo' });
  assert.deepEqual(stavNadrze(51, 101), { podil: 51 / 101, pasmo: 'pocita' }); // lichý cíl: 0,51 ≥ 0,505
  assert.deepEqual(stavNadrze(50, 101).pasmo, 'nepocita');
  assert.deepEqual(stavNadrze(0, 0), { podil: 0, pasmo: 'nepocita' });
});
