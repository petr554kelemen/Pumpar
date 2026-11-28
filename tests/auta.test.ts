import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Garaz,
  KLIC_AUT,
  KLIC_KANYSTRU,
  TABULKA_AUT,
  jePrazdne,
  litryNaObrazovce,
  naRezerve,
  spotrebaAuta,
  stavNadrzeAuta,
} from '../src/services/auta.ts';
import { DELKA_SMENY_MS, HerniDen } from '../src/services/den.ts';
import { KOD_KANYSTRU, KOD_VLECKY, parseCode } from '../src/services/codes.ts';
import type { Uloziste } from '../src/services/denik.ts';

const T0 = 1_000_000;
const MIN = 60_000;

function pametoveUloziste(): Uloziste & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

/** rng, který vybere první / poslední položku tabulky. */
const prvni = () => 0;
const posledni = () => 0.99;

test('Den: čas směny mezi okamžiky – jen během odpočtu, před otevřením i po zavření nic', () => {
  const d = new HerniDen(T0);
  assert.equal(d.msSmenyMezi(T0, T0 + 10 * MIN), 0); // ještě zavřeno
  d.otevri(T0 + 5 * MIN);
  assert.equal(d.msSmenyMezi(T0, T0 + 10 * MIN), 5 * MIN);
  assert.equal(d.msSmenyMezi(T0 + 6 * MIN, T0 + 8 * MIN), 2 * MIN);
  // Konec odpočtu: dál se nepočítá.
  assert.equal(d.msSmenyMezi(T0, T0 + 5 * MIN + DELKA_SMENY_MS + 10 * MIN), DELKA_SMENY_MS);
  // Dřívější zavření 🔒.
  d.ukonci(T0 + 9 * MIN);
  assert.equal(d.msSmenyMezi(T0, T0 + 60 * MIN), 4 * MIN);
  assert.equal(d.msSmenyMezi(T0 + 8 * MIN, T0 + 7 * MIN), 0);
});

test('Auta: přidání – náhodná kapacita a spotřeba z tabulky, nádrž na ⅔; známé auto se nepřidá', () => {
  const g = new Garaz(null);
  const a = g.pridej('la01', T0, prvni);
  assert.equal(a.nove, true);
  assert.equal(a.auto.spz, 'LA01');
  assert.equal(a.auto.kapacita, TABULKA_AUT.kapacity[0]);
  assert.equal(a.auto.spotreba, 25); // ½ nádrže 10 L za 20 min
  assert.equal(a.auto.stav0, 667); // ⅔ z 10 L
  const b = g.pridej('KE01', T0, posledni);
  assert.equal(b.auto.kapacita, 2000);
  assert.equal(b.auto.spotreba, 125); // 1¼ nádrže 20 L za 20 min
  assert.equal(g.pridej('LA01', T0 + MIN, posledni).nove, false);
  assert.equal(g.vsechna().length, 2);
});

test('Auta: benzín ubývá rovnoměrně jen během směny, nikdy pod 0; opakovaný výpočet nic neodečte', () => {
  const d = new HerniDen(T0);
  const g = new Garaz(null);
  const { auto } = g.pridej('LA01', T0, prvni); // 10 L, 25 setin/min, start 6,67 L
  assert.equal(stavNadrzeAuta(auto, T0 + 30 * MIN, d), 667); // zavřeno → nic
  d.otevri(T0 + 10 * MIN);
  assert.equal(stavNadrzeAuta(auto, T0 + 20 * MIN, d), 667 - 250);
  assert.equal(stavNadrzeAuta(auto, T0 + 20 * MIN, d), 417); // znovu stejně
  // Konec směny (20 min) = 500 setin spáleno a dál nic.
  assert.equal(stavNadrzeAuta(auto, T0 + 10 * MIN + DELKA_SMENY_MS + 50 * MIN, d), 167);
  // Velká spotřeba dojde na 0 a pod 0 nejde.
  const velke = g.pridej('KE01', T0 + 10 * MIN, posledni); // 20 L, 125/min
  assert.equal(stavNadrzeAuta(velke.auto, T0 + 10 * MIN + DELKA_SMENY_MS, d), 0);
  const male = g.pridej('LA02', T0 + 10 * MIN, () => 0.5); // 15 L, 56/min
  male.auto.stav0 = 100;
  assert.equal(stavNadrzeAuta(male.auto, T0 + 30 * MIN, d), 0);
  assert.equal(jePrazdne(male.auto, T0 + 30 * MIN, d), true);
});

test('Auta: každé auto se během směny dostane na rezervu – kterákoli nádrž i spotřeba (ladění 2026-11-28)', () => {
  for (const kapacita of TABULKA_AUT.kapacity) {
    for (const podil of TABULKA_AUT.spotrebyZaSmenu) {
      const d = new HerniDen(T0);
      d.otevri(T0);
      const auto = { spz: 'LA01', kapacita, spotreba: spotrebaAuta(kapacita, podil), stav0: Math.round(kapacita * 2 / 3), t0: T0 };
      const konec = T0 + DELKA_SMENY_MS;
      assert.ok(naRezerve(auto, konec, d) || jePrazdne(auto, konec, d), `${kapacita} / ${podil}`);
      assert.equal(naRezerve(auto, T0 + 5 * MIN, d), false, `${kapacita} / ${podil}: ne hned na začátku`);
    }
  }
});

test('Auta: uložená se starou spotřebou (15 / 25 / 40) dostanou novou ve stejném stupni', () => {
  const u = pametoveUloziste();
  u.data.set(KLIC_AUT, JSON.stringify([
    { spz: 'LA01', kapacita: 1000, spotreba: 15, stav0: 667, t0: T0 },
    { spz: 'KE01', kapacita: 2000, spotreba: 40, stav0: 1333, t0: T0 },
  ]));
  assert.deepEqual(new Garaz(u).vsechna().map((a) => a.spotreba), [25, 125]);
  // Převod jen jednou: nová malá spotřeba 25 u 10 L se podruhé nesmí brát jako stará střední.
  assert.deepEqual(new Garaz(u).vsechna().map((a) => a.spotreba), [25, 125]);
});

test('Auta: rezerva pod ¼, prázdné není na rezervě; litry na obrazovce nahoru', () => {
  const d = new HerniDen(T0);
  const g = new Garaz(null);
  const { auto } = g.pridej('LA01', T0, prvni); // 10 L
  auto.stav0 = 249;
  assert.equal(naRezerve(auto, T0, d), true);
  auto.stav0 = 250;
  assert.equal(naRezerve(auto, T0, d), false);
  auto.stav0 = 0;
  assert.equal(naRezerve(auto, T0, d), false);
  assert.equal(jePrazdne(auto, T0, d), true);
  assert.equal(litryNaObrazovce(1), 1);
  assert.equal(litryNaObrazovce(0), 0);
  assert.equal(litryNaObrazovce(667), 7);
});

test('Auta: dotankování přičte k dnešnímu stavu a nepřeteče nad kapacitu; nové kolo = ⅔', () => {
  const d = new HerniDen(T0);
  d.otevri(T0);
  const g = new Garaz(null);
  g.pridej('LA01', T0, prvni); // 10 L, 25/min, 6,67 L
  assert.equal(g.dotankuj('LA01', 300, T0 + 10 * MIN, d), 667 - 250 + 300);
  assert.equal(g.dotankuj('LA01', 5000, T0 + 10 * MIN, d), 1000);
  assert.equal(g.dotankuj('KE09', 300, T0, d), undefined);
  g.noveKolo(T0 + 15 * MIN);
  const a = g.najdi('LA01');
  assert.ok(a);
  assert.equal(stavNadrzeAuta(a, T0 + 15 * MIN, d), 667);
});

test('Auta: pamatují se v úložišti (obnovení stránky), rodič je může smazat', () => {
  const u = pametoveUloziste();
  const g = new Garaz(u);
  g.pridej('LA01', T0, prvni);
  g.pridej('KE02', T0, posledni);
  const znovu = new Garaz(u);
  assert.deepEqual(znovu.vsechna().map((a) => a.spz), ['LA01', 'KE02']);
  znovu.smazVse();
  assert.equal(new Garaz(u).vsechna().length, 0);
  u.data.set(KLIC_AUT, 'rozbité{');
  assert.equal(new Garaz(u).vsechna().length, 0);
});

test('Vlečka: LA999 je vlečka, jiné LA + 3 číslice chyba, SPZ beze změny', () => {
  assert.equal(KOD_VLECKY, 'LA999');
  assert.equal(parseCode('la999').druh, 'vlecka');
  assert.equal(parseCode('LA998').druh, 'chyba');
  assert.equal(parseCode('LA99').druh, 'auto');
});

test('Kanystr: LA888 je kanystr, u stojanu je to „auto“ s nádrží 5 L, které nic nespotřebuje', () => {
  assert.equal(KOD_KANYSTRU, 'LA888');
  assert.equal(parseCode('la888').druh, 'kanystr');
  const d = new HerniDen(T0);
  d.otevri(T0);
  const g = new Garaz(null);
  const k = g.kanystr();
  assert.equal(k.kapacita, TABULKA_AUT.kanystr);
  assert.equal(k.stav0, 0);
  assert.equal(g.vozidlo('la888')?.spz, 'LA888');
  assert.equal(g.vsechna().length, 0); // na parkovišti mezi auty není
  // Zaplacený benzín jde do kanystru, nejvýš 5 L; čas směny ho neubírá.
  assert.equal(g.dotankuj('LA888', 300, T0, d), 300);
  assert.equal(g.dotankuj('LA888', 900, T0, d), 500);
  assert.equal(stavNadrzeAuta(g.kanystr(), T0 + 15 * MIN, d), 500);
});

test('Kanystr: přelije do auta, kolik se vejde – zbytek zůstane; neznámé auto nic', () => {
  const d = new HerniDen(T0);
  d.otevri(T0);
  const g = new Garaz(null);
  g.pridej('KE01', T0, posledni); // 20 L, 125 setin/min, start 1333
  g.dotankuj('LA888', 500, T0, d);
  assert.equal(g.prelijKanystr('KE09', T0, d), undefined);
  // Za 25 min (směna jen 20) je velké auto prázdné → přelije se celých 5 L.
  assert.equal(stavNadrzeAuta(g.najdi('KE01')!, T0 + 25 * MIN, d), 0);
  const g2 = new Garaz(null);
  g2.pridej('LA01', T0, prvni); // 10 L, start 667
  g2.dotankuj('LA888', 500, T0, d);
  assert.equal(g2.prelijKanystr('LA01', T0, d), 333); // vejde se jen do plné
  assert.equal(stavNadrzeAuta(g2.najdi('LA01')!, T0, d), 1000);
  assert.equal(g2.kanystr().stav0, 167);
  assert.equal(g2.prelijKanystr('LA01', T0, d), 0); // plné auto nic
  assert.equal(g.prelijKanystr('KE01', T0 + 10 * MIN, d), 500);
  assert.equal(stavNadrzeAuta(g.najdi('KE01')!, T0 + 10 * MIN, d), 1333 - 1250 + 500);
  assert.equal(g.kanystr().stav0, 0);
});

test('Kanystr: pamatuje se, nové kolo i smazání aut ho vyprázdní', () => {
  const u = pametoveUloziste();
  const g = new Garaz(u);
  g.dotankuj('LA888', 400, T0, new HerniDen(T0));
  assert.equal(new Garaz(u).kanystr().stav0, 400);
  g.noveKolo(T0);
  assert.equal(new Garaz(u).kanystr().stav0, 0);
  g.dotankuj('LA888', 400, T0, new HerniDen(T0));
  g.smazVse();
  assert.equal(new Garaz(u).kanystr().stav0, 0);
  u.data.set(KLIC_KANYSTRU, 'nesmysl');
  assert.equal(new Garaz(u).kanystr().stav0, 0);
});
