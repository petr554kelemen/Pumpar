import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIST, MIN_OKRAJ, VISACKA, rozlozeniListu, sirkaCode128Mm } from '../src/tisk/layout.ts';

test('rozložení: 5 × 5 visaček se vejde na A4 s okrajem', () => {
  const r = rozlozeniListu();
  assert.equal(r.pozice.length, 25);
  assert.ok(r.okrajX >= MIN_OKRAJ && r.okrajY >= MIN_OKRAJ);
  for (const p of r.pozice) {
    assert.ok(p.x >= MIN_OKRAJ && p.x + VISACKA.sirka <= LIST.sirka - MIN_OKRAJ);
    assert.ok(p.y >= MIN_OKRAJ && p.y + VISACKA.vyska <= LIST.vyska - MIN_OKRAJ);
  }
});

test('rozložení: visačky se nepřekrývají a navazují', () => {
  const r = rozlozeniListu();
  const [a, b] = r.pozice;
  assert.ok(a && b);
  assert.equal(b.x - a.x, VISACKA.sirka);
  assert.equal(r.pozice[5]?.y, a.y + VISACKA.vyska);
});

test('rozložení: příliš mnoho visaček vyhodí chybu', () => {
  assert.throws(() => rozlozeniListu(6, 5));
});

test('Code128: testované velikosti se vejdou na šířku visačky', () => {
  for (const kod of ['P001', 'LA01', 'KE10', '9001']) {
    for (const modul of [0.2, 0.25, 0.3, 0.33]) {
      assert.ok(sirkaCode128Mm(kod, modul) <= VISACKA.sirka - 2, `${kod} ${modul} mm`);
    }
  }
});
