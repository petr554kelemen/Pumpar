# Dev notes – Čerpací stanice

Provozní poznámky: co se udělalo, co je v plánu, TODO, chyby a přání.
Popis hry, zásady návrhu a technická rozhodnutí jsou v [README.md](README.md).

**Pravidla pro zápis (všechny modely):**
- Po práci přidej řádek do **Stav** (datum, kdo, co) a uprav **Další krok**.
- Hotovou fázi zaškrtni. Nové trvalé rozhodnutí zapiš do README.md.
- BUG → po opravě přesuň do FIX (s datem a stručným popisem opravy).
- WISH = nápady hráče a rodiče; do plánu/TODO se přesouvají až po domluvě s uživatelem.

## Další krok
- Pořadí fází: 0 ✅ → 2 ✅ → **1** a **4** souběžně → 3 (čísla fází se nemění).
- Fáze 4: stojan převeden (rodič ho vyzkouší proti staré verzi) → další: obchod (zboží pípáním do košíku).
- **Dofukování kol 🛞 – ukázka pro hráče v dílně ✏️** (prototyp, ne schválené pravidlo): ukázat, nechat vyzkoušet,
  zapsat jeho připomínky; co „orazítkuje“, platí.
  Hráč dál hraje starou verzi, novou uvidí až hotovou (Pravidla jsou zákon, bod 1).
- Fáze 1: vytisknout testovací list (https://petr554kelemen.github.io/Pumpar/tisk.html), zalaminovat,
  ověřit čtení (telefon hned, čtečka po příjezdu) → zvolit typ a velikost kódu. Paralelně D30 test SPZ.
  - D30 výsledek 1 (2026-11-17): štítek 12 × 40, **QR H 4 body/modul** (≈ 11,5 mm, tichá zóna jen 1 modul):
    telefon načetl **s menšími problémy** (malý kód = blízko = ostření; úzký okraj). Zkusit i QR 3 body
    (tichá zóna 2) a hlavně **čtečku** – ta rozhodne.
  - D30 neumí tisk od kraje do kraje (bílý okraj = tichá zóna navíc), ale aplikace mohla náš obrázek zmenšit.
    **Varianta: QR generovat přímo v aplikaci Phomemo** (obsah jen `KE01`) – vykreslí ho nativně pro tiskárnu.
    Porovnat čtení s naším PNG; zjistit, zda aplikace umí opravu chyb H. Hráč by pak mohl tisknout sám podle předlohy.

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
  - [x] Stojan (`StationScene` + logika `src/services/pump.ts`): předvolba (klávesnice jako na pokladně,
    5/10/15 L, 🎲 3–22,80 L), rychle ⬆️ 0,07 L / 45 ms, pomalu ⬇️ 0,01 L / 95 ms (držet tlačítko/šipku),
    vyhodnocení přesně / před cílem / přeteklo, zvuky jako stará verze. Litry v setinách (celá čísla).
  - [ ] Předvolby „+ Obchod“ a tlačítko „Jít platit“ – až s obchodem.
  - [ ] Obchod.
- [ ] **5 – Peněženka:** trvalý zůstatek, placení naskenovanými bankovkami, výpočet vrácení.
  **Volba platby jako na samoobslužné pokladně (nápad hráče):**
  - 💳 **Kartou (jednodušší):** karta (`K…`, stará platební karta s QR) má **zůstatek** uložený ve hře
    (vytištěné tečky by neubývaly → zůstatek se ukáže po pípnutí). Hráč vybere kartu, na které je dost
    (porovnání). Tečky z karty viditelně odletí k nákupu (odečítání), zůstatek se zmenší. Málo teček = odmítnuto ❌
    „nedostatek financí“ → jiná karta. Jedna karta na nákup.
  - 💵 **Penězi (těžší):** bankovky/mince **1, 2, 3, 5, 10** (`B001`, `B002`, `B003`, `B005`, `B010`).
    Pípá postupně, hra plní „nádobu“ teček nákupu (sčítání vidět), přeplatek se vrací tečkami.
  - Nahrazuje předchozí návrh „karty s hodnotou 10/15/20“.
  - **Zachovat zobrazení ze staré verze:** hráč už skládá částku – vidí **prázdné tečky = kolik zbývá** a porovná
    je s cenou výrobku. Karta i mince používají stejný obraz → pro hráče se prakticky nic nemění.
  - **Do dílny ✏️:** počáteční zůstatek karty a jak se dobíjí (výplata za tankování?), vzhled mincí
    (laminovaná kolečka s QR, tečky, barva podle hodnoty), kolik kusů od každé hodnoty, PIN/terminál (fáze 6).
  **Odměna za přesnost tankování** (návrh do dílny ✏️ s hráčem):
  - Pozorování ze staré verze: hráč „cukne“ hned na začátku (aby nepřelil) a zbytek bankovky utratí
    v obchodě, vždy si vezme největší bankovku → tankování ho nic nenaučí.
  - Nově: odměna podle vzdálenosti od předvolby, **stejně pro nedolití i přetečení**:
    přesně 5 teček + 🏆 · do 0,1 L 4 · do 0,5 L 3 · do 1 L 2 · do 2 L 1 · dál 0.
  - Přesnost zobrazit graficky (terč / ukazatel s pásmy zelená–žlutá–červená + ručička), ne číslem.
  - Odměna jde do peněženky → peníze na obchod si hráč vydělá u stojanu.
  - Hráč: **riziko vs. jistota – rychlost tankování.** 🐢 pomalu = snazší trefa, menší bonus; 🐇 rychle =
    těžší trefa, větší bonus. Návrh: rychlost **násobí** odměnu za přesnost (rychle + vedle = pořád 0 → nevznikne
    nový podfuk). Volba: dvě pistole (🐢/🐇) nebo délka držení. **Do dílny ✏️:** velikost bonusu (×2 / +2),
    způsob volby, rychlá pistole od začátku nebo až po zvládnutí pomalé. Nanečisto: konvička vs. kelímek, čárka.
  - Starou verzi (`public/stara-verze.html`) neměnit – hráč její pravidla zná (viz Pravidla jsou zákon).
- [ ] **6 – Platební terminál:** telefon ukáže částku → sken karty `K…` → PIN → „Platba schválena“ + účtenka.
  - **PIN (hráč si PINy pamatuje a zadává, i 6místné):** **jeden univerzální PIN pro všechny karty**
    (každá karta svůj = náročné pro rodiče): **PIN = 1234** (výchozí, rodič může změnit kódem `9…`).
    Klávesnice s číslicemi na telefonu, zadání jako hvězdičky. Špatně = ❌ „Špatný PIN“; po 3 pokusech blokace?
    (odblokuje rodič kódem `9…` = „banka“) – rozhodne dílna. Zůstatek až po správném PINu?
  - **Herní PIN nesmí být shodný se skutečným** (je uložen v prohlížeči nechráněně) – vymyslet nový.
- [ ] **Hlas (průběžně od fáze 0):** služba `voice`, seznam frází, generování souborů; první fráze pro pípnutí a placení.
- [ ] **Garáž (s fází 4):** přiřazení SPZ → autíčko ve hře (vzhled, jméno), měnitelné rodičem/hráčem;
  pípnutí SPZ = auto přijede ke stojanu (+ úkol „natankuj …“).
- [ ] **Otevírání benzínky (s fází 4, nápad hráče):** bez benzináře je benzínka zavřená – zákaz, auta netankují.
  **Odemyká se kódem u dveří** (hráč má kódový zámek i na pokladničce; karta by se ztrácela, používá se jen ráno):
  u zamčených dveří 🔒 číselná klávesnice → kód → otevřeno (světla, hlas „Benzínka je otevřená!“). Na konci směny
  zavřít (později uzávěrka/tržba z fáze 7). **Platí obě cesty:** kód na klávesnici **nebo** pípnutí služební karty
  (karta = „PIN v kapse“, viz README Zásady návrhu).
  **Do dílny ✏️:** kód (zvolí hráč, jiný než PIN karty 1234), počet číslic, vzhled služební karty, zavírání tlačítkem nebo kódem,
  jak vypadá „zavřeno“ (🚫 / závora / 🔒). Nejdřív nanečisto.
- [ ] **Žetony – vysavač a vzduch (nápad hráče):** vysavač (V) i dofoukání vzduchu jedou jen na žeton.
  Žeton se koupí v obchodě za peníze ze hry → pípnout u stroje → běží (ubývající čas graficky) → „hotovo“.
  Bez žetonu: „Potřebuješ žeton.“ **Do dílny ✏️:** jeden žeton na obojí, nebo dva; fyzické žetony (laminovaná
  kolečka s QR, „vhodit“ do krabičky) vs. jen ve hře; kód (ne Z/Ž); cena a délka běhu. Nejdřív nanečisto.
  - Hráč určil: **vzduch = 3 tečky za jedno kolo** → 4 kola = 12 → „karta s 10 tečkami nestačí, musí 15 nebo 20“.
    Z toho plyne **vracení peněz** (15 − 12 = 3 zpět, graficky přesunem teček) a placení po kolech.
  - Hráč: **nákup se přizpůsobí kartě** – s 10 tečkami objedná jen 1, 2 nebo 3 kola (3 / 6 / 9).
    Ve hře: auto shora se 4 koly, klepnutím vybírá kola, u každého přibudou 3 tečky (cena roste viditelně) →
    pípnout kartu → stačí = zaplaceno + vrácení, nestačí = odmítnuto (ubrat kolo / větší karta). Sčítá hra.
  - Hráč: **tlak bez čísel – obrázkem.** Auto jako **plánek ze záznamu o nehodě**: karoserie shora, kola
    nakreslená v rozích **vytočená ven** („jako přejetá žába“) – každé kolo dobře vidět. Podhuštěné kolo
    rozplácnuté/vyboulené, plné úzké a rovné. Hráč sám pozná, která kola potřebují vzduch; při foukání se kolo
    postupně zúží + „cink“. Nestačí-li karta, auto odjede s některým kolem splasklým. Objekty `kolo_LP`,
    `kolo_PP`, `kolo_LZ`, `kolo_PZ` (levé/pravé, přední/zadní) – JSON pro Phaser Editor na požádání.
  - [x] **Prototyp (scéna `AirScene`, ikona 🛞, logika `src/services/air.ts`):** auto-plánek ze shora, kola
    v rozích **z boku** (kulatá s ráfkem jako 🛞; splasklé má **dole plošku** a vyboulené boky – přání rodiče),
    náhodně 1–4 kola splasklá, klepnutím výběr (žlutý rámeček, s nápovědou 3 tečky), karty 10/15/20 klepnutím nebo pípnutím `B…`
    (jiná hodnota = dočasná karta), malá = ❌ + zatřesení, jinak tečky odletí ke kolům (na kartě prázdná kolečka),
    kola se postupně nafouknou + cink, 🚗➡️ další auto. Nápověda (tečky ceny u kola) je **vždy zapnutá**. **S prázdným kolem se nejezdí:** 🚗➡️ při prázdném kole
    = nad ním bliká ❗ + chybový zvuk, auto zůstane. Doplatit lze další kartou; karta si pamatuje zůstatek
    (prázdná kolečka) do odjezdu auta.
  - **Kontrola plného kola = 1 tečka** (návrh rodiče): plné kolo jde vybrat taky (nápověda 1 tečka),
    po zaplacení krátká kontrola + ✅; dofouknuté kolo dostane ✅ taky. Mix cen (3 + 3 + 1 + 1) = sčítání.
  - **Barevné disky** (návrh rodiče): dofouknutí 🔵 modrý 2 · 🔴 červený 3 · 🟢 zelený 5 teček, kontrola vždy 1.
    **Na jedné nápravě stejná barva**, přední a zadní se mohou lišit. Nejdražší auto 4 × zelený = 20 = karta 20.
    S barevnými cenami **nápověda nejde vypnout** (hráč by neznal cenu barvy) – přepínač odstraněn. Verze
    „bez nápovědy“ případně později přes obrázkový **ceník u kompresoru** (disk + tečky), počítá sám.
  - **Hráč vyzkoušel (2026-11-17):** po prvním autě pochopil, co se po něm chce – která kola dofoukat a že ho
    kontrola plných kol „neobere“. Jeho připomínka: **vozík** – i ten má kola k dofouknutí.
  - [x] **Vozík** (nápad hráče): náhodně ~35 % aut, za autem na oji, jedna náprava (LV/PV) s vlastní barvou disku.
    Nejdražší auto s vozíkem = 6 × zelený = 30 > karta 20 → doplatit druhou kartou. 🚗➡️ přesunuto pod karty.
  - Později (grafika, ne pro návrh): při foukání **okénko PIP** se zvětšeným kolem (druhá kamera Phaseru
    zaměřená na foukané kolo) – vidět, jak se ploška zaobluje. Prototyp je zatím skica. Bez hlasu.
  - Hráč: **dvě obtížnosti** – *s nápovědou* (u vybraného kola 3 tečky, cena roste viditelně) a *bez nápovědy*
    (ví, že kolo = 3 tečky, spočítá si sám a vybere kartu; hra jen potvrdí/odmítne). Přepíná rodič / nový návod.
- [ ] **Písmena (po fázi 4):** písmeno kategorie na štítcích a ve hře, úkoly „pípni zboží na M“, SPZ u stojanu.
  Pořadí obtížnosti úkolů: hláska na **začátku** slova → na **konci** → **uprostřed** (nejtěžší, jen jako výzva).
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
- Hádanka písmen: hlas řekne názvy 3 obrázků a zeptá se „Ve kterém slově slyšíš písmenko M?“ – odpověď klepnutím
  nebo pípnutím zboží. V obchodě (zboží = obrázky), nebo samostatná scéna s vlastní ikonou. Rozhodnout v dílně.
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
- 2026-11-17 (uživatel): Upřesnění Speechtech: „ch“ ve slovech OK, jen samotné „CH“ rozdělí → písmena zadávat
  názvem („chá“). Omezení „fráze bez ch“ zrušeno. Ověřeno: „Chá. Chá jako chleba.“ zní přirozeně.
- 2026-11-17 (uživatel): Ve Speechtechu přidána výjimka samotné „ch“ → „chá“. Hráč program používá i sám
  (napíše/opíše písmeno či slovo a nechá si ho přečíst).
- 2026-11-17 (uživatel): Pozorování: hráč určí hlásku na začátku i na konci slova, uprostřed je nejtěžší
  → README Cílový hráč, plán Písmena (pořadí obtížnosti).
- 2026-11-17 (uživatel): Hráč rozlišuje „pumpa / pumpař“ a „benzínka / benzinář“ (pumpa je vedle benzínky)
  → README Zásady návrhu: ve frázích jeho slova. Pozor na „P jako pumpa“ v testovacích větách – ověřit s hráčem.
- 2026-11-17 (uživatel): Nápad hráče – služební karta odemyká benzínku (jinak zavřeno, zákaz) → Plán.
  README: „vedoucí pumpy“ → „vedoucí benzínky“ (slova hráče).
- 2026-11-17 (uživatel): Nápad hráče – žeton k vysavači a na dofoukání vzduchu → Plán.
- 2026-11-17 (uživatel): Hráč: vzduch 3 tečky za kolo (4 kola = 12, desítka nestačí) → vracení peněz. Bankovce
  možná říká „karta s tečkami“ – ověřit pro hlasové fráze.
- 2026-11-17 (uživatel): Hráč: peníze na starých platebních kartách, hodnoty 10/15/20, karty se kombinují
  → Plán fáze 5 (vracení). Šablona karty na tisk.html až po testu tisku.
  Upřesnění: „kombinovat“ = vybrat vhodnou kartu, ne sčítat → platí jedna karta, malá je odmítnuta.
- 2026-11-17 (uživatel): Hráč: s menší kartou objedná méně kol (1–3) → výběr kol ve hře, cena roste tečkami.
- 2026-11-17 (uživatel): Hráč: tlak v pneumatikách obrázkem – auto jako plánek pro pojišťovnu, kola vytočená ven („přejetá žába“).
- 2026-11-17 (uživatel): Vzduch ve dvou obtížnostech – s nápovědou teček a bez nápovědy (počítá sám).
- 2026-11-17 (uživatel + Claude): README Zásady návrhu – „Matematika skrytá ve hře“ (porovnávání, rozsahy,
  sčítání, násobilka, odečítání jako viditelné odlétání teček).
- 2026-11-17 (uživatel): Platba jako v samoobslužné pokladně: kartou se zůstatkem (porovnání, odečítání) nebo
  penězi 1/2/3/5/10 (sčítání) → Plán fáze 5, nahrazuje karty s hodnotou 10/15/20.
- 2026-11-17 (uživatel): Bonus za rychlost tankování (riziko × jistota) → Plán fáze 5, odměna za přesnost.
- 2026-11-17 (uživatel): Stará verze už ukazuje prázdné tečky = zbývá → zachovat stejný obraz u karty i mincí.
- 2026-11-17 (uživatel): Platba kartou chráněná PINem (hráč PINy zná a zadává) → Plán fáze 6.
- 2026-11-17 (uživatel): PIN univerzální pro všechny karty.
- 2026-11-17 (uživatel): Herní PIN = 1234 (při zadávání jen hvězdičky).
- 2026-11-17 (uživatel): Benzínka se odemyká kódem u dveří (jako hráčova pokladnička), ne kartou.
- 2026-11-17 (uživatel): Zásada „kde jsou dvě cesty, platí obě“ → README; dveře benzínky: kód nebo karta.
- 2026-11-17 (Claude): Fáze 4 – stojan převeden ze staré verze do Phaseru (pravidla beze změny, bez obchodu),
  výchozí scéna je teď stojan ⛽. Událost `pip` (fáze 0) odstraněna. 32/32 testů, typecheck OK, ověřeno v Chrome
  (předvolba 5 L, přetečení, zadání 1.25, tankování myší i šipkami).
- 2026-11-17 (Claude): Prototyp dofukování kol (scéna 🛞) pro ukázku hráči v dílně. 35/35 testů, typecheck OK,
  ověřeno v Chrome (výběr kol, odmítnutí B001, platba kartou 20, foukání, další auto).
- 2026-11-17 (uživatel + Claude): Rozhodnutí – hra není responzivní (notebook, FIT); telefon = vlastní stránky na výšku.
- 2026-11-17 (Claude): Vzduch – kola překreslena z boku (ráfek, splasklé s ploškou dole), ověřeno v Chrome.
- 2026-11-17 (uživatel + Claude): Vzduch – s prázdným kolem nelze odjet (bliká ❗), doplacení další kartou,
  zůstatek karty v rámci auta. Ověřeno v Chrome.
- 2026-11-17 (uživatel + Claude): Vzduch – odstraněny nápravy, kola blíž ke karoserii.
- 2026-11-17 (uživatel + Claude): Vzduch – kontrola plného kola za 1 tečku, hotová kola ✅. 36/36 testů, ověřeno
  v Chrome (2 prázdná + 2 plná = 8 teček z karty 20).
- 2026-11-17 (uživatel + Claude): Vzduch – barevné disky po nápravách (modrý 2, červený 3, zelený 5). 37/37 testů,
  ověřeno v Chrome.
- 2026-11-17 (uživatel + Claude): Vzduch – světlá plocha stání (beton) pod autem, aby černá kola a ploška
  splasklého kola byly na tmavém pozadí vidět.
- 2026-11-17 (uživatel + Claude): Vzduch – odstraněn přepínač nápovědy (s barevnými cenami nedává smysl).
- 2026-11-17 (hráč + Claude): Hráč vyzkoušel vzduch (logiku pochopil hned), přidán jeho nápad – vozík s vlastní
  nápravou. 38/38 testů, ověřeno v Chrome.
- 2026-11-17 (uživatel): D30 test – QR 4 b/modul na 12 × 40 telefon přečetl s menšími problémy; čeká na čtečku.
