# Dev notes – Čerpací stanice

Provozní poznámky: co se udělalo, co je v plánu, TODO, chyby a přání.
Popis hry, zásady návrhu a technická rozhodnutí jsou v [README.md](README.md).

**Pravidla pro zápis (všechny modely):**
- Po práci přidej řádek do **Stav** (datum, kdo, co) a uprav **Další krok**.
- Hotovou fázi zaškrtni. Nové trvalé rozhodnutí zapiš do README.md.
- BUG → po opravě přesuň do FIX (s datem a stručným popisem opravy).
- WISH = nápady hráče a rodiče; do plánu/TODO se přesouvají až po domluvě s uživatelem.

## Další krok
- Pořadí fází: 0 ✅ → 2 ✅ → **1** → 3 (fáze 1 čekala na tisk; čísla fází se nemění).
- Fáze 1: vytisknout testovací list (https://petr554kelemen.github.io/Pumpar/tisk.html), zalaminovat,
  ověřit čtení (telefon hned, čtečka po příjezdu) → zvolit typ a velikost kódu. Paralelně D30 test SPZ.

## Plán (fáze)
- [x] **0 – Kostra:** git, Node LTS v26, Phaser 4.2.1 + Vite 8 lokálně, `src/services/` a `src/scenes/`,
  sběrnice událostí, zkušební scéna, GitHub Pages (https://petr554kelemen.github.io/Pumpar/).
  Pozn.: na PC jsou k dispozici i TBarCode (TEC-IT), ImageMagick, Python 3.13 – zatím nepotřeba.
- [ ] **1 – Katalog + tisk:** `catalog` (kód → název, obrázek, cena – ceny jen ve hře), technické testy tisku:
  - **D30:** ✅ `tisk.html` sekce D30 – PNG 1:1 v bodech (12 × 30 / 12 × 40 mm), Code128 2–3 body/modul,
    QR H 3–4 body/modul → ☐ vytisknout z aplikace Phomemo, ověřit čtení čtečkou i telefonem,
  - **laser:** ✅ testovací list `tisk.html` (25 visaček: Code128 0,2–0,33 mm, QR 10–20 mm, ostatní druhy kódů)
    → ☐ vytisknout, vystříhat, zalaminovat, ověřit čtení čtečkou i telefonem, zvolit velikost,
  - ☐ bankovky, obrázkový seznam „kam co“, katalog (až po dílně s hráčem).
  Herní visačky/štítky až po odsouhlasení s hráčem (dílna ✏️ → razítko ✅).
- [x] **2 – Vstup kódů:** klávesnice/USB čtečka (kód + Enter), převod CZ znaků na číslice, testovací scéna „Pípni něco“.
  Ověření se skutečnou čtečkou čeká na její příjezd (viz TODO).
- [ ] **3 – Telefon:** stránka pro telefon, párování přes QR, skenování kamerou, kód se pošle do hry na NB.
- [ ] **4 – Převod hry do Phaseru:** scény Stojan a Obchod, skenované zboží jde do košíku.
- [ ] **5 – Peněženka:** trvalý zůstatek, placení naskenovanými bankovkami, výpočet vrácení.
  **Odměna za přesnost tankování** (návrh do dílny ✏️ s hráčem):
  - Pozorování ze staré verze: hráč „cukne“ hned na začátku (aby nepřelil) a zbytek bankovky utratí
    v obchodě, vždy si vezme největší bankovku → tankování ho nic nenaučí.
  - Nově: odměna podle vzdálenosti od předvolby, **stejně pro nedolití i přetečení**:
    přesně 5 teček + 🏆 · do 0,1 L 4 · do 0,5 L 3 · do 1 L 2 · do 2 L 1 · dál 0.
  - Přesnost zobrazit graficky (terč / ukazatel s pásmy zelená–žlutá–červená + ručička), ne číslem.
  - Odměna jde do peněženky → peníze na obchod si hráč vydělá u stojanu.
  - Starou verzi (`public/stara-verze.html`) neměnit – hráč její pravidla zná (viz Pravidla jsou zákon).
- [ ] **6 – Platební terminál:** telefon ukáže částku → sken karty `K…` → PIN → „Platba schválena“ + účtenka.
- [ ] **Hlas (průběžně od fáze 0):** služba `voice`, seznam frází, generování souborů; první fráze pro pípnutí a placení.
- [ ] **Garáž (s fází 4):** přiřazení SPZ → autíčko ve hře (vzhled, jméno), měnitelné rodičem/hráčem;
  pípnutí SPZ = auto přijede ke stojanu (+ úkol „natankuj …“).
- [ ] **Písmena (po fázi 4):** písmeno kategorie na štítcích a ve hře, úkoly „pípni zboží na M“, SPZ u stojanu.
- [ ] **7 – Rozšíření z mapy:** příprava směny (drag & drop cen), uzávěrka a tržba, minihry za odměnu, QR kódy po bytě.

## TODO
- [ ] Otevřít https://petr554kelemen.github.io/Pumpar/ na NB hráče (Linux, Chrome) – ověřit zobrazení a zvuk.
- [x] Laminovací kapsy: **A5**, více visaček s rozestupy, rozstříhat, děrovačka (návrh rozměrů v README → Tisk štítků).
  Archy samolepek A4 už nejsou potřeba (zboží = laminované visačky, SPZ/karty = D30).
- [ ] Po příjezdu USB čtečky: ověřit Code128 i QR, nastavit jazyk klávesnice ve čtečce.
- [x] Vybrat hlas – poslechnout `hlas_test_vety.txt` (hlavně samotné „M.“, „Eř“, „Chá“). Pořadí zkoušení:
  1. Balabolka (máme, český mluvčí; hromadně přes `balcon.exe`),
  2. Piper (open-source, offline, i na Linuxu, hlas `cs_CZ-jirka`),
  3. Microsoft Azure TTS (neurální Antonín/Vlasta, free kvóta),
  4. Google Cloud TTS (free kvóta, účet s kartou).
  Rozhoduje poslech, ideálně i hráčem.
  - 2026-11-16: Na vývojovém PC je český hlas **Microsoft Jakub** (Windows OneCore; klasické SAPI5 rozhraní ho
    nevidí – Balabolka ho možná nenabídne). Ukázka testovacích vět vygenerována přímo přes Windows
    (WinRT `SpeechSynthesizer`, PowerShell) – **pokud Jakub obstojí, Balabolka není potřeba**, soubory lze
    generovat skriptem v projektu. Balabolka je na stolním PC uživatele (ne na vývojovém NB) – porovnat s Jakubem, zjistit název jejího
    českého hlasu. Čeká na poslech.
  - 2026-11-17: Poslech: **Jakub OK** (CH správně), jen samotná písmena bez slova zní ztlumeně, nejdou poznat.
    Balabolka na stolním PC = Speechtech **Radka** (SAPI5, starší): „ch“ čte jako c+h, „schválena“ jako
    „šválena“; antivirus navíc hlásil, že Balabolka čte soubory na ploše (čtení zablokováno) → **Balabolku
    nepoužívat, hlas = Jakub**. Test písmen (á, bé, dé… ve 3 variantách SSML: normál / pomaleji+hlasitěji /
    + výš a důraz) ve Stažených souborech `hlas_test_pismena_jakub.wav` → **vybrána varianta 3** (zapsáno v README).
- [ ] **Před prvním tiskem štítků** projít s hráčem kategorie, písmena, obrázky a slabiky SPZ
  (README → Formát kódů, Pravidla jsou zákon). Do té doby hráči hru na Pages neukazovat.
- [ ] Obrázkový „Návod 1“ s pravidly hry (verzovaný – změna = nový návod s vyšším číslem).

## BUG
_(zatím nic)_

## FIX
- 2026-11-17: Číslice z numerické klávesnice se zahazovaly při vypnutém NumLocku (přišlo „Insert“, „End“…)
  a numerické „+“ se měnilo na „1“ (české rozložení). Nově `keyFromEvent` bere numerickou klávesnici
  podle fyzické klávesy (`e.code`).

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
- 2026-11-16 (Claude + uživatel): GitHub Pages zapnuty, nasazení zelené. Ověřeno: hra, stará verze
  i skript vrací 200. **Fáze 0 hotová** (zbývá jen vyzkoušet na NB hráče – viz TODO).
- 2026-11-16 (Claude): **Fáze 2 hotová.** `codes.js` (parseCode, kategorie), `scanInput.js` (KeyCollector:
  Enter ukončí, pauza >3 s zahodí rozepsané, stejný kód do 1,5 s se ignoruje, CZ `+ěščřžýáíé` → číslice),
  scéna `ScanTestScene` („Pípni něco“ – písmeno + obrázek / bankovka číslo + tečky / ❌), přepínání scén `nav.js`.
  12 testů (`npm test`) OK. Ověřeno v headless Chrome simulací čtečky: `P+é+` → P101 pití, `B023` → 23 teček,
  `X001` → ❌; bez chyb v konzoli. Opraveno: StationScene po návratu nezačínala od nuly; Enter v ní
  kolidoval se čtečkou (odebrán); oříznuté velké emoji (padding). V README opraven příklad CZ rozložení
  (`P101` přijde jako `P+é+`, ne `Pě0ě`).
- 2026-11-16 (Claude): **Převod na TypeScript** (TS 7.0.2, strict, `erasableSyntaxOnly`). Typovaná sběrnice
  (`GameEvents` – překlep v názvu události nebo chybějící údaj hlásí `tsc`), `CodeInfo` jako sjednocení podle `druh`.
  Skripty: `typecheck`, `build` = `tsc && vite build`, testy `node --test` spouští `.ts` přímo.
  Ověřeno: `tsc` bez chyb (a zkušební chyby zachytí), 12/12 testů, build, headless Chrome beze změny chování.
- 2026-11-16 (Claude): **SPZ aut** – slabika + 2 číslice (`LA01` hráč, `KE01` rodič, čísla 01–99).
  `parseCode` → `druh: 'auto'`; ScanTestScene ukáže auto + SPZ jako tabulku. Přepínač druhů kódu ve scéně
  hlídá úplnost (`never`). 15/15 testů, typecheck OK, ověřeno v Chrome (`laé+` → LA-01).
  Štítky SPZ budou na autíčkách nebo prošlých platebních kartách; přiřazení SPZ → auto bude měnitelné (Garáž).
- 2026-11-16 (Claude + uživatel): Zjištění – hráč striktně drží jednou nastavená pravidla. Do README
  zásady „Pravidla jsou zákon“ (nic provizorního před hráčem, tisk = definitivní, měnitelnost v pravidlech
  od začátku, verzovaný obrázkový návod). Kategorie odsouhlasit s hráčem před prvním tiskem.
- 2026-11-16 (uživatel): Upřesnění – když hráč pravidla spoluvytváří, platí až po dokončení. Do README rituál
  dílna ✏️ (vymýšlí se, smí se měnit) → razítko ✅ (hráč schválí, pak platí a tiskne se).
- 2026-11-16 (uživatel + Claude): Pozorování ze staré verze (cuknutí na začátku, utrácení zbytku největší
  bankovky). Návrh: odměna za přesnost tankování → zapsáno do fáze 5. Starou verzi neměnit.
- 2026-11-16 (uživatel + Claude): Plán štítků: zboží = laminované visačky (laser), hráč je sám přiváže
  (obrázkový seznam „kam co“), SPZ a karty = D30 termoštítky (z plastu jdou dolů), bankovky = laser papír.
  Ceny se netisknou (jen ceník ve hře). Hlas popisuje, nepřikazuje. README → Tisk štítků přepsán.
- 2026-11-16 (Claude): Fáze 1 – stránka `tisk.html` (Vite multi-page), `src/tisk/layout.ts` (rozvržení
  5 × 5 visaček 38 × 52 mm na A4, testy), technický test Code128/QR (JsBarcode, qrcode). Opraven postup
  laminace: visačky se nejdřív vystříhají, pak rozloží do kapsy A5 s mezerami (README). 19/19 testů,
  typecheck OK, ověřeno tiskem do PDF v Chrome.
- 2026-11-16 (Claude): Fáze 1 – štítky D30 (SPZ): `d30.ts` (výpočty v bodech 203 dpi, testy), `d30Render.ts`
  (PNG čistě černobílé, Code128 2/3 body na modul, QR H 3/4 body), sekce na `tisk.html` s výběrem délky
  30/40 mm a stažením PNG. QR na laserových visačkách přepnut z M na H. 22/22 testů, typecheck OK,
  ověřeno v Chrome (240 × 96 bodů, šířka Code128 sedí s výpočtem).
- 2026-11-17 (uživatel + Claude): Rozhodnutí o kódech: **QR (oprava H) preferovaný** – karty a visačky laserem;
  QR lépe snáší úhel (telefon), poškození a odlesk; termotisk D30 bledne na slunci → jen autíčka (odlepitelnost),
  případně i autíčka visačkou s QR. Do testu přidat čtení z úhlu 30°/45°. README → Tisk štítků upraven.
- 2026-11-17 (Claude): Zkouška čtečky: numerická klávesnice funguje i bez NumLocku (viz FIX), dole na stránce 📟
  ladicí řádek „⌨ …“ s rozepsaným kódem (událost `psani`), nápověda „pípni, nebo napiš kód a Enter“.
  Kódy reagují jen na stránce 📟 (⛽ je zatím ignoruje). 24/24 testů, typecheck OK, ověřeno v Chrome.
- 2026-11-17 (uživatel + Claude): Hlas: Jakub vybrán (Radka/Balabolka vyřazena, viz TODO Vybrat hlas),
  vygenerován test samostatných písmen ve 3 variantách SSML. Zdroj zvuků WAV, do hry komprimovaná kopie.
- 2026-11-17 (uživatel + Claude): Samotná písmena – vybrána varianta 3 (pomaleji, hlasitěji, výš, důraz);
  README → Hlas a písmena doplněn (Jakub, SSML parametry, WAV → komprese do hry).
- 2026-11-17 (uživatel): **Hlas = Speechtech** (licencovaný program na stolním PC) – písmena zřetelnější než Jakub,
  problém jen „ch“ (čte c + h) → fráze bez „ch“, písmeno CH ve hře zatím ne. Jeden hlas pro celou hru.
  Jakub zůstává jako záloha. README → Hlas a písmena přepsán. Zjistit přesný název hlasu Speechtechu.
