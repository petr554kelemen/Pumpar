import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_UTRATA, ZBOZI, chybyKatalogu, najdiZbozi, utrata, vejdeSe } from '../src/services/katalog.ts';
import { Penezenka, PENEZNI_KARTY, penezenka } from '../src/services/penezenka.ts';
import { Denik, KLIC_DENIKU, type Uloziste } from '../src/services/denik.ts';
import { novyDen } from '../src/services/den.ts';
import { Predvolba } from '../src/services/pump.ts';
import { MAX_BENZIN_TECEK, lzeJitPlatit, teckyZaBenzin, ucet } from '../src/services/ucet.ts';

test('Katalog: kódy jsou platné zboží, neopakují se, ceny 1–30', () => {
  assert.deepEqual(chybyKatalogu(), []);
  assert.equal(ZBOZI.length, 6);
});

test('Katalog: najde zboží podle kódu (i malými písmeny), neznámé ne', () => {
  assert.equal(najdiZbozi('s002')?.emoji, '🍦');
  assert.equal(najdiZbozi('P999'), undefined);
  assert.equal(najdiZbozi('K001'), undefined);
});

test('Katalog: útrata = součet cen, do košíku jen do 30 teček', () => {
  const auto = najdiZbozi('A001');
  const susenka = najdiZbozi('S001');
  assert.ok(auto && susenka);
  assert.equal(utrata([auto, susenka, susenka]), 13);
  const plny = [auto, auto, auto]; // 27
  assert.equal(vejdeSe(plny, susenka), true); // 29
  assert.equal(vejdeSe([...plny, susenka], susenka), false); // 31
  assert.equal(MAX_UTRATA, 30);
});

test('Peněženka: zůstatek se odečítá, malý zůstatek = odmítnuto beze změny', () => {
  const p = new Penezenka();
  p.aktivuj('K004');
  p.aktivuj('K005');
  assert.equal(p.zustatek('K004'), 10);
  assert.deepEqual(p.zaplat('K004', 6), { ok: true, zbytek: 4 });
  assert.deepEqual(p.zaplat('k004', 5), { ok: false, chybi: 1 });
  assert.equal(p.zustatek('K004'), 4);
  assert.deepEqual(p.zaplat('K004', 4), { ok: true, zbytek: 0 });
  assert.equal(p.zustatek('K005'), 10, 'ostatní desítky mají vlastní zůstatek');
});

test('Peněženka: služební a neznámá karta neplatí', () => {
  const p = new Penezenka();
  assert.equal(p.zustatek('K000'), undefined);
  assert.equal(p.zaplat('K000', 1).ok, false);
  assert.equal(p.zaplat('K099', 1).ok, false);
});

test('Peněženka: aktivace karet určí strop kola, platí jen aktivní karty', () => {
  const p = new Penezenka();
  assert.deepEqual(p.aktivniKarty(), [], 'na začátku není aktivní nic');
  assert.equal(p.zustatek('K001'), undefined);
  assert.equal(p.zaplat('K001', 1).ok, false, 'neaktivní karta neplatí');
  assert.equal(p.aktivuj('k004'), 'aktivovano');
  assert.equal(p.aktivuj('K004'), 'uz_aktivni', 'druhé pípnutí = chyba hráče');
  assert.equal(p.aktivuj('K000'), 'neznama', 'služební karta se neaktivuje');
  assert.equal(p.aktivuj('K001'), 'aktivovano');
  assert.equal(p.strop(), 30);
  assert.deepEqual(p.aktivniKarty().map((k) => k.kod), ['K001', 'K004'], 'pořadí podle sady');
  assert.equal(p.zaplat('K001', 5).ok, true);
  p.naplnVse();
  assert.deepEqual(p.aktivniKarty(), [], 'restart / nový den: vybírá se znovu');
  assert.equal(p.jeAktivni('K001'), false);
});

test('Peněženka: nový herní den = karty zase plné', () => {
  const karta = PENEZNI_KARTY[0];
  assert.ok(karta);
  penezenka().aktivuj(karta.kod);
  assert.equal(penezenka().zaplat(karta.kod, 7).ok, true);
  assert.equal(penezenka().zustatek(karta.kod), karta.hodnota - 7, 'během dne zůstatek drží');
  novyDen();
  assert.equal(penezenka().zustatek(karta.kod), undefined, 'nový den: karty znovu neaktivní');
  penezenka().aktivuj(karta.kod);
  assert.equal(penezenka().zustatek(karta.kod), karta.hodnota);
});

function pametoveUloziste(): Uloziste & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

test('Deník: prodeje se přidávají za sebe, poškozená data nevadí', () => {
  const u = pametoveUloziste();
  const d = new Denik(u);
  assert.deepEqual(d.zaznamy(), []);
  d.zapis({ druh: 'prodej', cas: '2026-11-22T10:00:00Z', den: 1, zbozi: ['S001', 'S001'], tecky: 4, karta: 'K004' });
  d.zapis({ druh: 'prodej', cas: '2026-11-22T10:05:00Z', den: 1, zbozi: ['A001'], tecky: 9, karta: 'K001' });
  assert.deepEqual(d.zaznamy().map((z) => z.tecky), [4, 9]);
  u.data.set(KLIC_DENIKU, '{rozbité');
  assert.deepEqual(d.zaznamy(), []);
  assert.deepEqual(new Denik(null).zaznamy(), []);
});

test('Katalog: benzín na účtu se počítá do útraty i do limitu 30', () => {
  const auto = najdiZbozi('A001');
  assert.ok(auto);
  assert.equal(utrata([auto], 12), 21);
  assert.equal(vejdeSe([auto], auto, 12), true); // 30
  assert.equal(vejdeSe([auto], auto, 13), false); // 31
});

test('Účet: platit se jde od 0,80 L do hodnoty největší karty', () => {
  assert.equal(MAX_BENZIN_TECEK, 20);
  assert.equal(lzeJitPlatit(79), false);
  assert.equal(lzeJitPlatit(80), true);
  assert.equal(teckyZaBenzin(80), 1);
  assert.equal(lzeJitPlatit(2049), true); // 20 teček
  assert.equal(lzeJitPlatit(2050), false); // 21 teček
});

test('Účet: benzín čeká na zaplacení, nový den účet vyprázdní', () => {
  ucet().benzin = 640;
  ucet().rezimObchodu = true;
  assert.equal(ucet().benzin, 640);
  novyDen();
  assert.equal(ucet().benzin, null);
  assert.equal(ucet().rezimObchodu, false);
});

test('Stojan: náhodná předvolba „+ Obchod“ jsou celé litry 4–14', () => {
  const p = new Predvolba();
  p.nahodnaSObchodem(() => 0);
  assert.equal(p.setiny, 400);
  p.nahodnaSObchodem(() => 0.999);
  assert.equal(p.setiny, 1400);
});
