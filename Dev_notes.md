# Dev notes – Čerpací stanice

Provozní poznámky: co se udělalo, co je v plánu, TODO, chyby a přání.
Popis hry, zásady návrhu a technická rozhodnutí jsou v [README.md](README.md).

**Pravidla pro zápis (všechny modely):**
- Po práci přidej řádek do **Stav** (datum, kdo, co) a uprav **Další krok**.
- Hotovou fázi zaškrtni. Nové trvalé rozhodnutí zapiš do README.md.
- BUG → po opravě přesuň do FIX (s datem a stručným popisem opravy).
- WISH = nápady hráče a rodiče; do plánu/TODO se přesouvají až po domluvě s uživatelem.

## Další krok
- Dokončit fázi 0: uživatel zapne GitHub Pages (Settings → Pages → Source: „GitHub Actions“),
  ověřit nasazení na https://petr554kelemen.github.io/Pumpar/ a spuštění na NB hráče (Linux, Chrome).
- Pak fáze 1 (testovací arch štítků na obyčejný papír) nebo 2 (vstup kódů z klávesnice).

## Plán (fáze)
- [ ] **0 – Kostra:** ✅ git, ✅ Node LTS v26, ✅ Phaser 4.2.1 + Vite 8 lokálně, ✅ `src/services/` a `src/scenes/`,
  ✅ sběrnice událostí, ✅ zkušební scéna, ✅ workflow pro GitHub Pages, ☐ zapnout Pages + ověřit na NB.
  Pozn.: na PC jsou k dispozici i TBarCode (TEC-IT), ImageMagick, Python 3.13 – zatím nepotřeba.
- [ ] **1 – Katalog + tisk:** `catalog`, stránka `tisk.html` (JsBarcode / QR) s archem štítků A4.
  Nejdřív **testovací arch** (Code128 vs QR v různých velikostech) → vytisknout → ověřit čtení
  telefonem i čtečkou → teprve pak celý katalog.
- [ ] **2 – Vstup kódů:** klávesnice/USB čtečka (kód + Enter), převod CZ znaků na číslice, testovací scéna „Pípni něco“.
- [ ] **3 – Telefon:** stránka pro telefon, párování přes QR, skenování kamerou, kód se pošle do hry na NB.
- [ ] **4 – Převod hry do Phaseru:** scény Stojan a Obchod, skenované zboží jde do košíku.
- [ ] **5 – Peněženka:** trvalý zůstatek, placení naskenovanými bankovkami, výpočet vrácení.
- [ ] **6 – Platební terminál:** telefon ukáže částku → sken karty `K…` → PIN → „Platba schválena“ + účtenka.
- [ ] **Hlas (průběžně od fáze 0):** služba `voice`, seznam frází, generování souborů; první fráze pro pípnutí a placení.
- [ ] **Písmena (po fázi 4):** písmeno kategorie na štítcích a ve hře, úkoly „pípni zboží na M“, SPZ u stojanu.
- [ ] **7 – Rozšíření z mapy:** příprava směny (drag & drop cen), uzávěrka a tržba, minihry za odměnu, QR kódy po bytě.

## TODO
- [ ] Zjistit formát archu štítků A4 (rozměr, sloupce × řádky, okraje / kód archu) – krabice je v kanceláři.
  Do té doby testovací arch na obyčejný papír s ořezovými čarami.
- [ ] Po příjezdu USB čtečky: ověřit Code128 i QR, nastavit jazyk klávesnice ve čtečce.
- [ ] Vybrat hlas – poslechnout `hlas_test_vety.txt` (hlavně samotné „M.“, „Eř“, „Chá“). Pořadí zkoušení:
  1. Balabolka (máme, český mluvčí; hromadně přes `balcon.exe`),
  2. Piper (open-source, offline, i na Linuxu, hlas `cs_CZ-jirka`),
  3. Microsoft Azure TTS (neurální Antonín/Vlasta, free kvóta),
  4. Google Cloud TTS (free kvóta, účet s kartou).
  Rozhoduje poslech, ideálně i hráčem.
- [ ] Projít s hráčem kategorie a písmena kódů (README → Formát kódů).

## BUG
_(zatím nic)_

## FIX
_(zatím nic)_

## WISH
- NFC nálepky (NTAG) jako „přiložení karty“ na terminálu – jen Android.
- Phomemo D30 pro drobné štítky, které si hráč tiskne sám.
- Úrovně obtížnosti: tečky → tečky + číslice → slova.
- Po ustálení opakovaných postupů (přidat zboží, tisk archu, nová hlasová fráze) z nich udělat
  skutečné skilly `.claude/skills/<nazev>/SKILL.md` (+ pomocné skripty), spouštěné např. `/pridat-zbozi`.
  Ověřit, zda formát SKILL.md čtou i Codex a Gemini CLI; pokud ne, postup stručně popsat i v README.

## Stav
- 2026-11-16 (Claude): Sestaven plán, rozdělena dokumentace na README.md (popis) a Dev_notes.md (provoz),
  založeny CLAUDE.md / AGENTS.md / GEMINI.md, testovací věty pro hlas.
- 2026-11-16 (Claude + uživatel): Založen git, veřejný repozitář https://github.com/petr554kelemen/Pumpar
  (publikováno z VS Code). Osobní údaje hráče z dokumentace odstraněny – repozitář je veřejný.
- 2026-11-16 (Claude): Fáze 0 – kostra. Node LTS v26.13.1, Phaser 4.2.1 (místo plánované 3, se souhlasem
  uživatele), Vite 8.3.8 lokálně; `node_modules/` a `dist/` vyřazeny z Dropboxu. Sběrnice `eventBus.js`,
  zvuky `beep.js` (ze staré verze), zkušební `StationScene` (klepnutí na ⛽ / mezerník → 'pip' → tečka
  + číslice do 30). Stará hra přesunuta do `public/stara-verze.html`. Workflow `deploy.yml` pro Pages.
  Ověřeno: `npm run build` OK, headless Chrome – scéna se vykreslí (WebGL), bez chyb v konzoli.
- 2026-11-16 (Claude): Kódování vynuceno na UTF-8 + LF (`.editorconfig`, `.vscode/settings.json`),
  všechny soubory ověřeny jako UTF-8. Do README dohoda o JSON scénách pro Phaser Editor a pojmenování objektů.
