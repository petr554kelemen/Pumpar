// Spuštění: npm test  (vestavěný node:test, bez prohlížeče)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCode } from '../src/services/codes.js';
import { normalizeChar, KeyCollector } from '../src/services/scanInput.js';

const type = (collector, text, start = 0, step = 20) => {
  let t = start;
  let result = null;
  for (const key of text) {
    result = collector.push(key, (t += step)) ?? result;
  }
  return { result, t };
};

test('parseCode: zboží podle písmene kategorie', () => {
  const r = parseCode('P001');
  assert.equal(r.druh, 'zbozi');
  assert.equal(r.pismeno, 'P');
  assert.equal(r.cislo, 1);
  assert.equal(r.kategorie.nazev, 'pití');
});

test('parseCode: malá písmena a mezery nevadí', () => {
  assert.equal(parseCode('  s012 ').kod, 'S012');
  assert.equal(parseCode('s012').druh, 'zbozi');
});

test('parseCode: bankovka do 30', () => {
  assert.equal(parseCode('B020').hodnota, 20);
  assert.equal(parseCode('B030').hodnota, 30);
  assert.equal(parseCode('B031').druh, 'chyba');
  assert.equal(parseCode('B000').druh, 'chyba');
});

test('parseCode: karta a rodičovský kód', () => {
  assert.equal(parseCode('K001').druh, 'karta');
  assert.equal(parseCode('9001').druh, 'rodic');
});

test('parseCode: zakázaná a neznámá písmena i špatný formát jsou chyba', () => {
  for (const kod of ['X001', 'Y001', 'Z001', 'Q001', 'P01', 'P0001', '', 'PP01', '8001']) {
    assert.equal(parseCode(kod).druh, 'chyba', kod);
  }
});

test('normalizeChar: české rozložení – horní řada na číslice', () => {
  assert.deepEqual([...'+ěščřžýáíé'].map(normalizeChar).join(''), '1234567890');
  assert.equal(normalizeChar('Ě'), '2'); // Caps Lock
  assert.equal(normalizeChar('p'), 'P');
  assert.equal(normalizeChar('7'), '7');
  assert.equal(normalizeChar('-'), null);
  assert.equal(normalizeChar('Shift'), null);
});

test('KeyCollector: kód z čtečky s CZ rozložením (P101 přijde jako P+é+)', () => {
  const c = new KeyCollector();
  const { result } = type(c, ['P', '+', 'é', '+', 'Enter']);
  assert.equal(result, 'P101');
});

test('KeyCollector: Shift a jiné klávesy se ignorují', () => {
  const c = new KeyCollector();
  const { result } = type(c, ['Shift', 'b', 'Shift', '0', '2', '0', 'Enter']);
  assert.equal(result, 'B020');
});

test('KeyCollector: samotný Enter nic nevrací', () => {
  const c = new KeyCollector();
  assert.equal(c.push('Enter', 10), null);
});

test('KeyCollector: dlouhá pauza zahodí rozepsaný kód', () => {
  const c = new KeyCollector({ resetMs: 3000 });
  c.push('Q', 0);
  c.push('Q', 10);
  const { result } = type(c, ['S', '0', '0', '1', 'Enter'], 5000);
  assert.equal(result, 'S001');
});

test('KeyCollector: stejný kód hned po sobě se ignoruje, po chvíli projde', () => {
  const c = new KeyCollector({ repeatMs: 1500 });
  const first = type(c, ['A', '0', '0', '1', 'Enter'], 0);
  assert.equal(first.result, 'A001');
  const again = type(c, ['A', '0', '0', '1', 'Enter'], first.t + 100);
  assert.equal(again.result, null);
  const later = type(c, ['A', '0', '0', '1', 'Enter'], first.t + 3000);
  assert.equal(later.result, 'A001');
});

test('KeyCollector: Escape smaže rozepsaný kód', () => {
  const c = new KeyCollector();
  const { result } = type(c, ['P', '0', 'Escape', 'K', '0', '0', '1', 'Enter']);
  assert.equal(result, 'K001');
});
