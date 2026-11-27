import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRAZE, Hlas, type Fraze } from '../src/services/voice.ts';

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

/** Přehrávač pro testy: zaznamená pořadí, dohraje až na pokyn. */
function falesny(): { prehrano: Fraze[]; dohraj: () => void; prehraj: (k: Fraze) => Promise<void> } {
  const prehrano: Fraze[] = [];
  let konec: (() => void) | null = null;
  return {
    prehrano,
    dohraj: () => konec?.(),
    prehraj: (k) =>
      new Promise<void>((r) => {
        prehrano.push(k);
        konec = r;
      }),
  };
}

test('fráze se nepřekřikují – hrají po sobě', async () => {
  const p = falesny();
  const h = new Hlas(p.prehraj);
  h.rekni('zadejte_pin');
  h.rekni('platba_prijata');
  await tick();
  assert.deepEqual(p.prehrano, ['zadejte_pin']);
  p.dohraj();
  await tick();
  assert.deepEqual(p.prehrano, ['zadejte_pin', 'platba_prijata']);
});

test('stejná čekající fráze se nepřidá podruhé', async () => {
  const p = falesny();
  const h = new Hlas(p.prehraj);
  h.rekni('otevreno');
  h.rekni('vlecka_vyjizdi');
  h.rekni('vlecka_vyjizdi');
  p.dohraj();
  await tick();
  p.dohraj();
  await tick();
  assert.deepEqual(p.prehrano, ['otevreno', 'vlecka_vyjizdi']);
});

test('chyba přehrávání frontu nezasekne', async () => {
  const prehrano: Fraze[] = [];
  const h = new Hlas(async (k) => {
    prehrano.push(k);
    throw new Error('soubor chybí');
  });
  h.rekni('uzaviraji');
  h.rekni('zavreno');
  await tick();
  await tick();
  assert.deepEqual(prehrano, ['uzaviraji', 'zavreno']);
  assert.equal(h.mluvi, false);
});

test('vypnutý hlas mlčí', async () => {
  const p = falesny();
  const h = new Hlas(p.prehraj);
  h.zapnuto = false;
  h.rekni('otevreno');
  await tick();
  assert.deepEqual(p.prehrano, []);
});

test('klíče frází jsou bez diakritiky (= názvy souborů)', () => {
  for (const k of Object.keys(FRAZE)) assert.match(k, /^[a-z_]+$/);
});
