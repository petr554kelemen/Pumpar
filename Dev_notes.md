# Dev notes – Čerpací stanice

Provozní poznámky: co se udělalo, co je v plánu, TODO, chyby a přání.
Popis hry, zásady návrhu a technická rozhodnutí jsou v [README.md](README.md).

**Pravidla pro zápis (všechny modely):**
- Po práci přidej řádek do **Stav** (datum, kdo, co) a uprav **Další krok**.
- Hotovou fázi zaškrtni. Nové trvalé rozhodnutí zapiš do README.md.
- BUG → po opravě přesuň do FIX (s datem a stručným popisem opravy).
- WISH = nápady hráče a rodiče; do plánu/TODO se přesouvají až po domluvě s uživatelem.

## Další krok
- **Výkon 30 snímků/s** ✅ (2026-11-27) → rodič sleduje baterii při hraní (dřív ~40 %/h).
- **Hlas** ✅ kód (2026-11-27, README → Hlas): 6 frází, služba `voice`. → **Rodič nastříhá MP3** (hlas Jakub; WAV všech
  frází vygenerován do Stažených souborů `hlas_fraze_jakub.wav`) do `public/hlas/<klic>.mp3` – seznam klíčů a textů v README → Hlas. Bez souborů hra mlčí, nic se nerozbije.
- **Auta se spotřebou 🚗⛽** ✅ (2026-11-27, README → Auta se spotřebou) → rodič vyzkouší s hráčem: pípnout autíčka
  (SPZ), sledovat 🅿️, tankovat konkrétní auto, vlečka `LA999`. **Vytisknout štítek vlečky `LA999`** (D30, Code128
  jako SPZ). Ladit tempo spotřeby (TODO). Hráči ukázat v dílně ✏️ (nové pravidlo).
- **Výsledková listina 🏆 + PIN `1111`** ✅ (2026-11-27, README → Výsledková listina, Tisk štítků → PIN) → rodič
  vyzkouší s hráčem: zadávání PINu (rodič jako zákazník), zda hráč odměnu ⭐ ❤️ chápe, počty bodů v dílně ✏️
  (`PRAVIDLA_BODU`, `srdicka` v katalogu). Test čtečky je teď jen přes **Ctrl+F2**.
- **Výběr karet na začátku kola** ✅ (2026-11-24) → rodič vyzkouší. Nesprávná karta = ❌ v obchodě i u vzduchu 🛞.
- **Banka 🏦** ✅ (2026-11-26): karty se aktivují v bance (auto 🚙 přijede, po ✅ odjede ke stojanu) → rodič vyzkouší,
  pak ukázat hráči v dílně ✏️ (nové prostředí = nové pravidlo „karty se aktivují v bance“).
- Pořadí fází: 0 ✅ → 2 ✅ → **1** a **4** souběžně → 3 (čísla fází se nemění).
- Fáze 4: stojan i obchod 🛒 hotové a **napojené** (předvolby „🛒 + Obchod“, „🛒 Jít platit“) → rodič vyzkouší;
  další: body za nákup / tankování do uzávěrky.
  Rozhodnutí rodiče: **z obchodu se bez zaplacení benzínu neodchází** („to se nedělá“) – hráč ubere zboží.
- **Karty:** štítky přegenerovány na `K001`–`K007` (každá karta vlastní kód, zůstatek na den) – pokud jsou staré
  štítky `B…` už nalepené, vytisknout znovu https://petr554kelemen.github.io/Pumpar/karty.html (po nasazení).
- **Dofukování kol 🛞 – ukázka pro hráče v dílně ✏️** (prototyp, ne schválené pravidlo): ukázat, nechat vyzkoušet,
  zapsat jeho připomínky; co „orazítkuje“, platí.
  Hráč dál hraje starou verzi, novou uvidí až hotovou (Pravidla jsou zákon, bod 1).
- **Odemykání benzínky 🔒 + hodiny – ukázka hráči v dílně ✏️** (prototyp hotový, viz Plán → Otevírání benzínky):
  volba obsluha/zákazník, kód nebo karta, čekání na otevírací dobu podle hodin. Zapsat jeho připomínky.
- Fáze 1: vytisknout testovací list (https://petr554kelemen.github.io/Pumpar/tisk.html), zalaminovat,
  ověřit čtení (telefon hned, čtečka po příjezdu) → zvolit typ a velikost kódu. Paralelně D30 test SPZ.
  - D30 výsledek 1 (2026-11-17): štítek 12 × 40, **QR H 4 body/modul** (≈ 11,5 mm, tichá zóna jen 1 modul):
    telefon načetl **s menšími problémy** (malý kód = blízko = ostření; úzký okraj). Zkusit i QR 3 body
    (tichá zóna 2) a hlavně **čtečku** – ta rozhodne.
  - D30 neumí tisk od kraje do kraje (bílý okraj = tichá zóna navíc), ale aplikace mohla náš obrázek zmenšit.
    **Varianta: QR generovat přímo v aplikaci Phomemo** (obsah jen `KE01`) – vykreslí ho nativně pro tiskárnu.
    Porovnat čtení s naším PNG; zjistit, zda aplikace umí opravu chyb H. Hráč by pak mohl tisknout sám podle předlohy.
  - D30 výsledek 2 (2026-11-18, čtečka): vytištěné štítky přečetla bez problémů, QR na 12 × 40 s obtížemi
    → **D30 = Code128** (README → Tisk štítků). Hra kódy rozlišuje jen podle obsahu, ne podle druhu.
- **Karty:** vytisknout https://petr554kelemen.github.io/Pumpar/karty.html, nalepit na karty podle barev,
  ověřit čtení čtečkou (obchod a vzduch: pípnutí karty, dveře: `K000`).
- **Výsledky obsluhy** (Plán): herní den ✅, deník + jedna společná listina ✅ (2026-11-27). Dělení LA / KE odloženo
  do WISH. Zbývá: tankování samotné bez obchodu se do listiny nedostane (platí se až v obchodě – v pořádku?).

## Plán (fáze)
- [x] **0 – Kostra:** git, Node LTS v26, Phaser 4.2.1 + Vite 8 lokálně, `src/services/` a `src/scenes/`,
  sběrnice událostí, zkušební scéna, GitHub Pages (https://petr554kelemen.github.io/Pumpar/).
  Pozn.: na PC jsou k dispozici i TBarCode (TEC-IT), ImageMagick, Python 3.13 – zatím nepotřeba.
- [ ] **1 – Katalog + tisk:** `catalog` (kód → název, obrázek, cena – ceny jen ve hře), technické testy tisku:
  - **D30:** ✅ `tisk.html` sekce D30 – PNG 1:1 v bodech (12 × 30 / 12 × 40 mm), Code128 2–3 body/modul,
    QR H 3–4 body/modul → ✅ vytištěno, čtečka: Code128 OK, QR 12 × 40 s obtížemi → **D30 = Code128**
    (telefon: potíže taky jen s QR 12 × 40),
  - **laser:** ✅ testovací list `tisk.html` (25 visaček: Code128 0,2–0,33 mm, QR 10–20 mm, ostatní druhy kódů)
    → ☐ vytisknout, vystříhat, zalaminovat, ověřit čtení čtečkou i telefonem, zvolit velikost,
  - ✅ **štítky na staré platební karty** (`karty.html`): 1 × 20, 2 × 15, 4 × 10 (od 2026-11-22 `K001`–`K007`,
    každá vlastní kód) + služební karta `K000`; **jen QR H 20 mm** (hodnotu hráč pozná podle barvy karty), štítek 26 × 29 mm
    → ☐ vytisknout, nalepit, ověřit čtení,
  - ☐ bankovky, obrázkový seznam „kam co“, katalog (až po dílně s hráčem).
  Herní visačky/štítky až po odsouhlasení s hráčem (dílna ✏️ → razítko ✅).
- [x] **2 – Vstup kódů:** klávesnice/USB čtečka (kód + Enter), převod CZ znaků na číslice, testovací scéna „Pípni něco“.
  Ověření se skutečnou čtečkou čeká na její příjezd (viz TODO).
- [ ] **3 – Telefon:** stránka pro telefon, párování přes QR, skenování kamerou, kód se pošle do hry na NB.
- [ ] **4 – Převod hry do Phaseru:** scény Stojan a Obchod, skenované zboží jde do košíku.
  - [x] Stojan (`StationScene` + logika `src/services/pump.ts`): předvolba (klávesnice jako na pokladně,
    5/10/15 L, 🎲 3–22,80 L), rychle ⬆️ 0,07 L / 45 ms, pomalu ⬇️ 0,01 L / 95 ms (držet tlačítko/šipku),
    vyhodnocení přesně / před cílem / přeteklo, zvuky jako stará verze. Litry v setinách (celá čísla).
  - [x] **Napojení stojanu na obchod** (postup ze staré verze, `ucet.ts`): zelené předvolby `🛒 6 L`, `🛒 10 L`,
    `🛒 🎲` (celé litry 4–14) zapnou režim obchodu (značka ⛽ ➡️ 🛒 nahoře). Po tankování (od 0,80 L) tlačítko
    „🛒 Jít platit (N)“ ve výsledku → obchod: benzín je první položka košíku ⛽ s **modrými tečkami** (nedá se
    vrátit), zboží se přidává zlatými, limit 30 platí i s benzínem. Zaplatí se **jednou kartou celé**, deník
    zapíše i benzín. Po zaplacení zpět ke stojanu; v režimu obchodu s novou náhodnou předvolbou.
    **Bez zaplacení se z obchodu neodejde** (rozhodnutí rodiče): s benzínem v košíku je navigace zamčená (ikony
    ztlumené, klepnutí = chyba + zatřesení ⛽) – hráč ubere zboží, aby nákup zaplatil. Pojistka: nestačí-li
    na samotný benzín **žádná** karta (karty za den vyčerpané), obsluha pípne služební kartu `K000` =
    **restart hry** (rozhodnutí rodiče): karty zase plné, účet prázdný, zpět ke stojanu, **čas dne běží dál**,
    deník zůstává. Hráč má hlídat, aby restart potřeba nebyl. Jinak `K000` v obchodě neplatí. Konec dne
    (odpočet) obchod ukončí vždy, nový den účet vyprázdní.
    **Kolik zbývá na nákupy** (rodič): u stojanu nahoře malé karty se zůstatkem (číslo + proužek, `prehled_K001`…)
    – hráč při tankování vidí, kolik teček může zaplatit. Hra nehlídá shodu s předvolbou, jen jestli to zaplatí.
    Změna proti staré verzi: platit jde jen benzín do **20 teček** (největší karta; dřív 22 kvůli bankovce 25)
    a text „Cena v obchodě: N teček“ (bez „zlatých“ – benzín je v obchodě modře, jako ve staré verzi).
  - [x] **Karty na obrazovce** (`src/scenes/kartyPanel.ts`, rodič: hra hratelná i bez pípání): obchod i vzduch
    mají stejný sloupec karet `K001`–`K007` (hodnoty sady 20/15/15/10/10/10/10) se zůstatkem dne; karta se
    aktivuje **klepnutím nebo pípnutím**. U vzduchu tím zmizely karty 10/15/20 doplňované s každým autem
    i placení pípnutou bankovkou `B…` (bankovky přijdou až ve fázi 5).
  - [x] **Obchod** (`ShopScene` 🛒, `katalog.ts`, `penezenka.ts`, `denik.ts`) – postup podle rodiče: **nejdřív zboží**
    (klepnutí na regál nebo pípnutí visačky), útrata v košíku roste (číslo + tečky po 10), klepnutím na zboží v košíku
    se vrátí, 🗑️ vysype. Pak hráč **sám zvolí kartu** podle útraty a pípne ji (nebo klepne) → stačí = tečky odletí
    do košíku (zezelenají), ✅, zápis do deníku; nestačí = ❌ a zatřesení karty. Vpravo všech 7 karet se zůstatkem
    (plné tečky = zbývá, prázdná kolečka = dnes utraceno) → hráč porovná. Útrata max. 30, víc = ❌.
    Zboží a ceny ze staré verze (🍪 2, 🍦 3, ☕ 4, 🧃 5, 🌭 6, 🏎️ 9; kódy S001, S002, P001, P002, J001, A001) –
    **návrh do dílny ✏️**. Barvy karet na obrazovce (20 zlatá, 15 zelená, 10 modrá) jsou zatím odhad – sladit
    se skutečnými kartami.
  - **Nápad rodiče (zatím ne):** jedno přečerpání karty ve stejné hodnotě (karta by za den měla 2× svou hodnotu).
    Použít jen tehdy, když se při hraní ukáže, že celková částka na kartách (100 teček) je na jedno kolo hry
    málo. Hra se dá kdykoli restartovat a hrát znovu, takže přečerpání je jen jedna z možností.
- [ ] **5 – Peněženka:** trvalý zůstatek, placení naskenovanými bankovkami, výpočet vrácení.
  **Volba platby jako na samoobslužné pokladně (nápad hráče):**
  - ✅ hotovo v obchodě (2026-11-22, zůstatek po herní den; u vzduchu platí pípnutá `K…` taky).
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
  - ✅ **2026-11-27: terminál s PINem nejdřív ve hře na NB** (obchod i vzduch, `terminal.ts`): **PIN = 1111**
    (rozhodnutí rodiče, nahrazuje 1234 níže), zadává ho zákazník (rodič), PIN nic nestornuje. Telefon později.
  - **PIN (hráč si PINy pamatuje a zadává, i 6místné):** **jeden univerzální PIN pro všechny karty**
    (každá karta svůj = náročné pro rodiče): ~~PIN = 1234~~ → 1111 (rodič může změnit kódem `9…`?).
    Klávesnice s číslicemi na telefonu, zadání jako hvězdičky. Špatně = ❌ „Špatný PIN“; po 3 pokusech blokace?
    (odblokuje rodič kódem `9…` = „banka“) – rozhodne dílna. Zůstatek až po správném PINu?
  - **Herní PIN nesmí být shodný se skutečným** (je uložen v prohlížeči nechráněně) – vymyslet nový.
- [x] **Hlas:** služba `voice` + 6 frází (2026-11-27, přehodnoceno: hlas jen kde je to fajn, žádné pokyny) – zbývá nahrát MP3.
- [ ] **Garáž (s fází 4):** přiřazení SPZ → autíčko ve hře (vzhled, jméno), měnitelné rodičem/hráčem;
  pípnutí SPZ = auto přijede ke stojanu (+ úkol „natankuj …“).
  - ✅ 2026-11-27: pípnutí SPZ = auto přijede ke stojanu, auta mají nádrž a spotřebu (`auta.ts`, 🅿️). Zbývá vzhled
    a jméno auta (zatím jen 🚙 hráč / 🚗 rodič).
- [ ] **Otevírání benzínky (s fází 4, nápad hráče):** bez benzináře je benzínka zavřená – zákaz, auta netankují.
  **Odemyká se kódem u dveří** (hráč má kódový zámek i na pokladničce; karta by se ztrácela, používá se jen ráno):
  u zamčených dveří 🔒 číselná klávesnice → kód → otevřeno (světla, hlas „Benzínka je otevřená!“). Na konci směny
  zavřít (později uzávěrka/tržba z fáze 7). **Platí obě cesty:** kód na klávesnici **nebo** pípnutí služební karty
  (karta = „PIN v kapse“, viz README Zásady návrhu).
  **Do dílny ✏️:** kód (zvolí hráč, jiný než PIN karty 1234), počet číslic, vzhled služební karty, zavírání tlačítkem nebo kódem,
  jak vypadá „zavřeno“ (🚫 / závora / 🔒). Nejdřív nanečisto.
  - [x] **Prototyp (scéna `LockScene`, logika `src/services/lock.ts`) – výchozí scéna hry.** Vlevo budova
    (tmavá, 🚫, 🔒), vpravo terminál u dveří: displej s hvězdičkami, klávesnice 1–9 / C / 0 / ✅ (i klávesnice
    počítače + Enter), čtečka karty. Návrh: **kód dveří 1111, služební karta `K000`** (konstanty – do dílny ✏️).
    Špatně = ❌ + zatřesení; správně = rozsvítí se nápis, výloha a dveře, 🔓, pak stojan ⛽.
    Navigace má nově 🔒 = zavřít benzínku (konec směny) → zpět ke dveřím.
  - [x] **Hodiny – učení času (nápad rodiče):** nad dveřmi ručičkové hodiny s **herním časem** (čísla 1–12,
    červená vteřinovka), na dveřích cedulka „OTEVŘENO OD“ s malými hodinami + čas číslem. Otevírací doba
    herního dne (6:00–8:00), hodiny začínají 2 minuty před ní. V otevírací době cedulka zezelená.
    **Časové znamení** (nostalgie rodiče – rozhlas): 3 pípnutí 1 kHz, poslední delší přesně v otevírací dobu.
    Později s hlasem: „Bylo právě šest / sedm / osm hodin.“ (stačí ranní hodiny – hráč chodí do školky;
    hodí se, až bude otevírací doba na celou hodinu).
  - [x] **Dva režimy (nápad rodiče) – volba na začátku scény** (dvě velké karty, bez textu):
    🧑‍🔧 **obsluha** (🔑 💳) odemyká sama kódem / kartou **kdykoli**; 🚗 **zákazník** kód nemá – klepnutí na dveře
    před otevírací dobou = zámek cukne, hodiny se zahoupou; v otevírací době se benzínka sama rozsvítí, klepnutím
    na dveře zákazník vejde (zatím → stojan). Pozor: hráč rozlišuje benzinář/pumpař – ve frázích „benzinář“.
  - **Čekání zákazníka (nápad rodiče):** před otevírací dobou nabídnout dvě cesty (obrázky, bez textu):
    🎮 **zahraj si hru** (minihra na čekání – navázat na fázi 7 „minihry za odměnu“; po otevírací době zpět
    ke dveřím) nebo 🚗↩️ **přijeď za chvíli** (auto odjede, scéna se ztlumí / hodiny poběží, v otevírací době
    přijede znovu – stejný mechanismus jako WISH Státní svátek). Kterou minihru – do dílny ✏️.
  - **Jeden zámek pro všechno** (upřesnění rodiče): s benzínkou se souběžně otevírá i obchod, myčka a pumpa
    (vzduch 🛞). Odpovídá to hře – všechny scény jsou dostupné až po odemčení, 🔒 zavírá všechno.
  - **Do dílny ✏️:** co dělá zákazník uvnitř (obchod?), délka čekání (2 min), zda obsluha musí taky čekat
    na otevírací dobu (cedulku otočit sama?), počet pokusů kódu.
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
    (jiná hodnota = dočasná karta) – **od 2026-11-22 nahrazeno sadou `K001`–`K007` (viz fáze 4 → Karty na obrazovce)**, malá = ❌ + zatřesení, jinak tečky odletí ke kolům (na kartě prázdná kolečka),
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
- [ ] **Výsledky obsluhy – uzávěrka (nápad rodiče, část fáze 7):**
  - ✅ **2026-11-27 – jedna společná výsledková listina 🏆** (rozhodnutí rodiče; README → Výsledková listina):
    ⭐ za dočerpání karty, ❤️ za snahu, scéna `VysledkyScene` + konec dne. **Dělení LA / KE níže je odložené
    (WISH)** – hráč a rodič hrají spolu (rodič zákazník, hráč pokladní). Text níže = původní plán.
  - Původně: kolik aut obsloužil a kolik zboží prodal
  **tatka (KE)** a **malej (LA)**. **Body patří tomu, kdo obsluhoval**, ne majiteli auta (malej obslouží
  i auto KE a je to platný bod za práci).
  - **Kdo obsluhuje = kdo odemkl.** Každý má **vlastní služební kartu / kód dveří** → hra ví, kdo je ve službě.
    Střídání během směny = pípnout svou kartu (převzetí služby). Obsluhu ukazuje ikonka v rohu (🧑‍🔧 LA / KE).
  - **Služební kartu přiděluje malej** (komu dá roli benzináře). Karta tedy není napevno svázaná s osobou –
    stejně jako SPZ ≠ autíčko: kód karty říká jen „služební karta č. …“, **komu patří, je měnitelné přiřazení**
    (malej ho nastaví ve hře; body jdou osobě, které karta v tu chvíli patří).
  - **Postup na začátku směny (odsouhlaseno rodičem):** 1. přidělení – pípnout služební kartu → klepnout
    na obrázek osoby (LA / KE) → 2. teprve pak odemknout benzínku (kartou / kódem) → 3. hra začíná.
  - **Herní den (rodič, 2026-11-18):** hodiny už neukazují skutečný čas + 2 min (vycházely „složité“ časy jako 15:47),
    ale **herní čas** s časy, které malej zná: **otevírá se v 6:00, 6:30, 7:00, 7:30 nebo 8:00**, zavírá ve **20:00
    nebo 21:00**. Jedna směna ≈ **20 minut** skutečného času, pak hlášení „Pokladny se budou uzavírat,
    ukončete nákup“ → zavřeno → **uzávěrka** (výsledky obsluhy za den). Hraje se dál = **nový den**.
    **Během dne běží na displeji odpočet 20 minut** (stačí i malý – malej si ho najde). Hra má tempo: kdo
    obslouží víc aut / zákazníků, než odpočet doběhne. Návrh zobrazení: ubývající výseč (jako kuchyňská
    minutka) + zbývající minuty číslem. Herní hodiny jsou vidět ráno u dveří (otevírací doba) a při zavírání.
  - [x] **Herní den – hotovo** (`src/services/den.ts`, testy): otevírací doba náhodně 6:00/6:30/7:00/7:30/8:00,
    zavírací 20:00/21:00. Odemčení obsluhou / vstup zákazníka spustí směnu 20 min. **Odpočet** vpravo nahoře
    ve všech scénách s navigací (zelená výseč + minuty číslem). **2 minuty před koncem** gong (ding-dong-ding)
    + 📢🛒, výseč a číslo oranžově. Konec = scéna `UzaverkaScene`: noc 🌙, zhasnutá benzínka 🔒, velké hodiny
    se zavírací dobou, sestupný gong; ☀️➡️ = nový den → zamčené dveře. 🔒 v navigaci = zavřít dřív → konec dne.
    Kreslení hodin sdílené v `src/scenes/hodiny.ts`. Hlas hlášení až se službou `voice`; výsledky do uzávěrky
    přijdou s deníkem směny.
  - **Proti šizení (rodič):** s odpočtem bude malej volit, co se víc vyplatí – a hledat zkratky („do nádrže jen
    crkne“ a jde sbírat body do obchodu). **Tankování platí za bod jen od poloviny nádrže výš.**
    **Plná nádrž = předvolba** (nastaví ji hráč nebo 🎲), polovina = předvolba / 2 – nová data nejsou potřeba.
    ✅ **Bargraf plnění** u stojanu (`nadrz_pruh`, výpočet `stavNadrze` v `pump.ts`) **nahradil pruh rychlosti**
    (rychlost nic neříkala, je vidět na číslech): natankováno / předvolba, do poloviny oranžová (bod se ještě
    nepočítá), od poloviny zelená (bod platí), bílá ryska v polovině, přetečení celý červený. Body zatím nejsou.
    Doplnit: každé pravidlo bodů projít s otázkou „jak to obejde?“ (obchod: pípat dokola nejlevnější zboží?).
    Alternativa / doplněk: body = **tržba v tečkách** místo počtu aut – crknutí = málo teček samo od sebe.
  - **Deník směny** (nová služba, localStorage): záznam o každé práci – kdo obsluhoval, co (tankování, vzduch,
    prodej), SPZ auta (nepovinná – bez pípnutí „neznámé auto“, bod platí), tečky, datum.
  - **Uzávěrka pro hráče (bez textu):** dva řádky 🧑‍🔧 LA / KE, ikonka za každé obsloužené auto, kategorie
    prodaného zboží (🧃 🍭 …), tečky tržby → porovnání „kdo víc“ obrázkem. **Pro rodiče** tabulka s historií po dnech
    (samostatná stránka jako `tisk.html`).
  - Pořadí: deník + přihlášení obsluhy + uzávěrka nad stojanem a vzduchem hned; zboží až s obchodem.
  - ✅ Deník (`denik.ts`, localStorage `pumpar.denik`) zapisuje **prodeje v obchodě** (zboží, tečky, karta, den).
    Chybí: kdo obsluhoval, tankování, vzduch, zobrazení v uzávěrce.
  - **Do dílny ✏️:** kódy/karty obsluhy (dnes jediná `K000` / 1111), vzhled uzávěrky, zda se počítají auta
    nebo jednotlivé práce (tankování + vzduch u jednoho auta = 1 nebo 2 body), mazání výsledků (kód `9…`).
- [ ] **Písmena (po fázi 4):** písmeno kategorie na štítcích a ve hře, úkoly „pípni zboží na M“, SPZ u stojanu.
  Pořadí obtížnosti úkolů: hláska na **začátku** slova → na **konci** → **uprostřed** (nejtěžší, jen jako výzva).
- [ ] **7 – Rozšíření z mapy:** příprava směny (drag & drop cen), uzávěrka a tržba, minihry za odměnu, QR kódy po bytě.

## TODO
- [ ] **Postupné doladění – auta se spotřebou** (rodič 2026-11-27, po nasazení vylepšení 2):
  - tempo spotřeby (`TABULKA_AUT`) – hráč nemá jen tankovat, musí stihnout i vzduch 🛞 a nákup 🛒,
  - odměny listiny 🏆 se s auty „rozpadnou“ (❤️ za benzín podle předvolby vs. nádrž auta) – nevadí, listina je jen
    závěrečná informace bez vlivu na průběh hry; ladit postupně.
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
- 2026-11-24: Dev server (`npm run dev`) se rozbil – Vite nemohl přejmenovat `node_modules/.vite/deps_temp_…` na `deps`
  (EBUSY, zámek nejspíš od Dropboxu) → Phaser 504, hra se nenačte (stránka sama vrací 200!). Řešení: restart serveru;
  když se bude opakovat, přesunout `cacheDir` Vite mimo Dropbox (zeptat se uživatele). Test: načíst hru, ne jen stránku.
- 2026-11-27: Kód pípnutý **během animace odemykání dveří** (≈ 5 s po `K000`) se ztratí – banka ještě neběží a dveře
  už nic nepřijímají. Hráč, který hned pípne kartu, neuslyší nic. Návrh: dveře by kartu `K…` podržely a předaly bance.
- 2026-11-27 (testování): `vite preview` vrací 404 na skripty z prohlížeče (hlavička `Sec-Fetch-Dest: script`),
  curl bez ní 200 → headless test běží na dev serveru s `cacheDir` mimo Dropbox (konfigurace ve scratchpadu).

## FIX
- 2026-11-17: Číslice z numerické klávesnice se zahazovaly při vypnutém NumLocku (přišlo „Insert“, „End“…)
  a numerické „+“ se měnilo na „1“ (české rozložení). Nově `keyFromEvent` bere numerickou klávesnici
  podle fyzické klávesy (`e.code`).

## WISH
- **Kanystr ⛽🧴** (hráč ho má, kód zatím ne): dolít pár litrů prázdnému autu bez vlečky (k vylepšení 2).
  Náčrt 2026-11-27: kód `LA888` (jako vlečka `LA999`), naplnit u stojanu (~5 L, platí se), na 🅿️ `LA888` + SPZ =
  přeleje, kolik se vejde. **Odloženo (rodič): hra je už dost složitá** – nejdřív ověřit, jak hráč zvládá vlečku.
- **Výsledky po osobách LA / KE** (odloženo 2026-11-27 – zatím jedna společná listina): body podle toho, kdo
  obsluhoval, vlastní služební karty, přidělování role benzináře hráčem (Plán → Výsledky obsluhy, původní text).
- **Infografika dne** (nápad rodiče, 2026-11-22; finanční gramotnost): v uzávěrce malý obrázkový přehled,
  za co šly tečky (⛽ benzín, 🛞 vzduch, 🧃🍪 zboží) a kolik zbylo na kartách. Jedna z možných podob je stromová
  mapa (plochy podle útraty). Data jsou v deníku (`denik.ts`). Podobu dořešit s rodičem.
  Je to **přehled dne benzínky, ne hodnocení hráče**: nakupují zákazníci (auta), takže žádné „dobře/špatně utraceno“
  ani poučky o hospodaření (rozhodnutí rodiče).
- **Minihra na čekání – mini pexeso** (nápad rodiče; hráč pexeso umí): malé (ne 8 × 8, třeba 3 × 4), obrázky
  z benzínky (⛽ 🛞 🚗 💳 🧃 …). Hraje se, než benzínka otevře (viz Plán → Otevírání benzínky → Čekání zákazníka).
- **Státní svátek – zavřeno** (nápad rodiče): občas (náhodně / podle kalendáře) je svátek → na dveřích
  vlaječka ČR 🇨🇿, benzínka se neotevře. Zákazník odjede autem a za 2–3 minuty přijede znovu, pak hra pokračuje
  normálně. Hráč už ví, že vyvěšená vlajka = svátek a obchody jsou zavřené.
- Písmena hlasem při pípnutí zboží (jen první pípnutí kategorie za den?) a hlášení rezervy auta – odloženo 2026-11-27,
  rozhodne hráč (README → Hlas).
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
- 2026-11-17 (uživatel + Claude): Odemykání benzínky – scéna `LockScene` (výchozí): kód / služební karta,
  hodiny nad dveřmi + cedulka „otevřeno od“ (učení hodin), volba obsluha 🧑‍🔧 / zákazník 🚗. Navigace 🔒 = zavřít.
  43/43 testů, typecheck OK, ověřeno v Chrome (špatný kód, kód z klávesnice, karta K000, čekání zákazníka,
  rozsvícení v otevírací době, vstup → stojan, 🔒 zpět).
- 2026-11-17 (uživatel + Claude): Časové znamení před otevírací dobou (3 × 1 kHz). WISH: státní svátek – zavřeno.
- 2026-11-18 (uživatel + Claude): Čtečka přečetla vytištěné štítky bez problémů, QR na D30 12 × 40 s obtížemi
  → rozhodnutí D30 = Code128 (README). Hra je na druhu kódu nezávislá už teď (rozhoduje obsah) – kód beze změny.
  SPZ: velká autíčka = štítek D30 přímo na autě, malá = laminovaná visačka s QR **u auta** (na zakřiveném
  malém autě by se štítek zdeformoval a čtečka by ho nepřečetla).
- 2026-11-18 (uživatel + Claude): Návrh „Výsledky obsluhy – uzávěrka“ (Plán): body podle toho, kdo obsluhoval
  (vlastní služební karta / kód), ne podle SPZ auta. Zatím jen plán.
- 2026-11-18 (uživatel + Claude): Stojan – pruh rychlosti nahrazen bargrafem plnění nádrže (plná = předvolba,
  od poloviny zelená = bod se bude počítat, přetečení červená). Stará verze beze změny. 44/44 testů, typecheck OK,
  ověřeno v Chrome (3,08 L oranžová, 6,23 L zelená, 11,69 L červená).
- 2026-11-18 (uživatel + Claude): Herní den – otevírací doby 6:00–8:00, odpočet směny 20 min v navigaci,
  hlášení 2 min před koncem (gong + 📢🛒), konec dne (`UzaverkaScene`, ☀️ = nový den). 47/47 testů, typecheck OK,
  ověřeno v Chrome (posunutým časem): obsluha i zákazník, odpočet, hlášení, konec dne 21:00, nový den 7:00, vzduch.
- 2026-11-18 (uživatel + Claude): Štítky na staré platební karty (hráč nachystal 8 karet): `karty.html` – karty
  s pevnou hodnotou (kód bankovky, fungují ve hře hned u vzduchu) 1 × 20, 2 × 15, 4 × 10 (hráč bere vždy největší)
  + služební karta `K000`. Karty se zůstatkem `K001`… až s peněženkou. 49/49 testů, ověřeno v Chrome (náhled listu).
  Upřesnění rodiče: na štítku stačí QR – hodnotu hráč pozná podle barvy karty → štítek zmenšen na 26 × 29 mm.
- 2026-11-22 (uživatel + Claude): **Obchod 🛒** (samostatně, bez benzínu): nejdřív zboží (klepnutí / pípnutí),
  útrata roste, pak hráč zvolí a pípne kartu → ✅ (tečky odletí, zápis do deníku) / ❌. Rozhodnutí rodiče: karty
  drží **zůstatek po herní den** → každá karta vlastní kód `K001`–`K007` (README → Tisk štítků, `karty.html`
  přegenerován). Vzduch přijímá pípnutou `K…`. Nové služby `katalog`, `penezenka`, `denik`. 56/56 testů, typecheck,
  build OK, ověřeno v headless Chrome (útrata 14, K004 odmítnuta, K001 → zbývá 6, 7 > 6 odmítnuto, X123 ❌,
  vzduch s K001 platí z dnešního zůstatku, deník zapsán).
- 2026-11-22 (uživatel + Claude): **Napojení stojanu na obchod** – předvolby „🛒 + Obchod“, „🛒 Jít platit“,
  benzín na účtu (`ucet.ts`) jako první položka košíku (modré tečky), zaplatí se jednou kartou se zbožím, pak zpět
  ke stojanu. 60/60 testů, typecheck, build OK, ověřeno v headless Chrome (🛒 6 L → 4,69 L → Jít platit (5) →
  + 🍪 🏎️ = 16 → K004 odmítnuta, K001 zaplatila → stojan s novou předvolbou 7 L, deník s benzínem).
- 2026-11-22 (uživatel + Claude): Obchod – s nezaplaceným benzínem nejde odejít (zamčená navigace), storno `K000`
  jen když benzín nezaplatí žádná karta. Ověřeno v Chrome (⛽/🛞 z obchodu nepustí, `K000` při dostatku ❌,
  K001 zaplatí → stojan). Storno při vyčerpaných kartách ověřeno jen kódem, ne v prohlížeči.
- 2026-11-22 (uživatel + Claude): Storno `K000` = restart hry (karty plné, čas běží dál); u stojanu přehled zůstatků
  karet („kolik zbývá na nákupy“); společný panel karet `kartyPanel.ts` – vzduch platí stejnou sadou `K001`–`K007`
  jako obchod (klepnutí i pípnutí), 🚗➡️ přesunuto do horní lišty. 60/60 testů, ověřeno v Chrome (K001 na 2 →
  natankováno 16 → K003 odmítnuta → `K000` → stojan, karty plné; vzduch zaplatil z K004).
- 2026-11-24 (uživatel + Claude): **Výběr karet na začátku kola** (`KartyScene`, `penezenka.aktivuj/strop`): po odemčení
  a po restartu `K000` hráč aktivuje karty (✔, součet = strop kola); druhé pípnutí = zvuk + zatřesení bez ❌. Ve hře jen
  aktivní karty. 61/61 testů, typecheck, ověřeno v headless Chrome (K001 + K005 = 30, K001 znovu bez ❌, stojan ukazuje
  20 a 10, v obchodě K004 ❌, K005 zaplatila 9). Zjištěn BUG s mezipamětí Vite v Dropboxu.
- 2026-11-24 (uživatel + Claude): U vzduchu 🛞 pípnutí neaktivní / služební / neznámé karty = ❌ + chybový zvuk
  (dřív ignorováno). ❌ sdílí obchod i vzduch (`krizek` v `kartyPanel.ts`). Ověřeno v headless Chrome (aktivní K001,
  u vzduchu K004 → ❌).
- 2026-11-26 (uživatel + Claude): Karty `K000`–`K007` mají štítky Code128 z aplikace tiskárny na podpisovém proužku.
  Bluetooth čtečka spárovaná s notebookem hráče (Linux), čte kód + Enter, rozložení klávesnice OK (`K000` odemkl).
  Rodič načetl všechny štítky (i ohnuté z role); nalepení na karty dělá hráč.
- 2026-11-26 (uživatel + Claude): **Banka** – scéna výběru karet převlečena za banku (`KartyScene` → `BankaScene`, klíč
  `Banka`): budova se štítem 🏦, silnice, auto hráče 🚙 přijede zleva, po ✅ ➡️ ⛽ odjede doprava ke stojanu. Logika aktivace
  beze změny (karty jdou aktivovat hned, příjezd jen dokresluje). 61/61 testů, typecheck, build OK, ověřeno v headless Chrome
  (K000 → banka, K001 + K005 = 30, K001 znovu jen zatřese, ✅ → auto odjede → stojan s kartami 20 a 10).
- 2026-11-27 (uživatel + Claude): **Výsledková listina 🏆 + PIN** (podle megapromptu; soubor pak nahrazen vylepšením 2): služba
  `vysledky.ts` (⭐ za dočerpání karty – 1 tečkou 6, karta 10/15/20 → 5/4/3, zbytek 1–2 → 2, 3–5 → 1; ❤️ zboží podle
  katalogu 1/1/2/2/3/5, benzín od poloviny předvolby a vzduch po 3 tečkách), deník zapisuje i vzduch, hodnotu karty,
  zbytek a ID dne. Terminál s PINem 1111 v obchodě i u vzduchu (`terminal.ts`, klávesnice sdílená s dveřmi), odečet až
  po PINu, ↩️ bez storna. Odměna ⭐ ❤️ letí k 🏆, vyčerpaná karta zbledne. Scéna `VysledkyScene` místo 📟, listina i na
  konci dne. Test čtečky jen Ctrl+F2 (↩️ / Esc zpět, ne při nezaplaceném benzínu). 68/68 testů, typecheck, build OK.
  Ověřeno v headless Chrome: 🧃 + 🏎️ = 14 z K001 (špatný PIN 1234 ❌ bez odečtu, 1111 + Enter bez ❌ za kód) → 0 ⭐ 7 ❤️;
  🌭 = 6 klepnutím na K001 a PIN klepáním → karta 0, 3 ⭐ 3 ❤️; vzduch 2 kola = 4 z K004 → 2 ❤️; 🏆 = 12 ❤️ 3 ⭐;
  Ctrl+F2 → test čtečky (P001) → Esc zpět na 🏆; 🔒 → konec dne s listinou. 6 ⭐ (dočerpání 1 tečkou) a zámek Ctrl+F2
  s nezaplaceným benzínem ověřeny jen testy / kódem.
- 2026-11-27 (uživatel + Claude): Nasazeno (listina + PIN), rodič s hráčem vyzkoušeli – hráč nadšený.
- 2026-11-27 (uživatel + Claude): **Auta se spotřebou** (vylepšení 2, podle megapromptu; ten pak smazán – pravidla
  v README): `auta.ts` (garáž v localStorage, kapacita 10/15/20 L, spotřeba 15/25/40 setin L za minutu směny,
  ⅔ nádrže každé kolo, dopočet za čas směny `den.msSmenyMezi`, rezerva pod ¼), scéna 🅿️ `ParkovisteScene`
  (SPZ tabulky + sloupce nádrží, rezerva bliká, prázdné 🪫), stojan (pípnutá SPZ = auto, bargraf nádrže auta, vlečka
  `LA999` přitáhne prázdné auto), obchod dotankuje auto po zaplacení, deník zapíše SPZ. Kód `9200` = smazat auta.
  75/75 testů, typecheck OK. Ověřeno v headless Chrome s posunem času: 3 auta v úložišti + `LA03` pípnutím →
  po 12 min LA01 na rezervě (červeně), po 17 min prázdné (šedé 🪫) → u ⛽ LA01 = 🪫 + 🚛 → `LA999` + LA01 = přivezeno
  → 3,71 L → zaplaceno K001 + PIN → 🅿️ LA01 = 4 L; KE01 s 13,33 L: šedě stav + zeleně natankované, jiné auto
  (LA02) vynuluje tankování.
- 2026-11-27 (uživatel + Claude): **Hlas přehodnocen** – původní návrh (pokyny, písmena při každém pípnutí) zrušen,
  hlas jen kde je to fajn: `otevreno`, `uzaviraji`, `zavreno`, `zadejte_pin`, `platba_prijata`, `vlecka_vyjizdi`. Nahrané MP3
  (málo frází = rychlé načítání), stahují se až při prvním přehrání, chybějící se přeskočí. `voice.ts` (fronta),
  napojení v LockScene, nav (hlášení po gongu), UzaverkaScene, terminálu a vlečce (stojan, 🅿️). README → Hlas
  přepsán. 80/80 testů, typecheck OK, headless Chrome bez nahrávek: hra i platba proběhnou, konzole čistá.
- 2026-11-27 (uživatel + Claude): **Výkon** – hráčův NB (Intel HD 500, Firefox/Linux, WebGL hardwarově) hřál a baterie
  100 → 20 % za 2 h. Hra omezena na 30 snímků/s (`fps: { limit: 30 }` v `main.ts`, výchozí bylo 60 i bez pohybu).
  Ověřit při příštím hraní spotřebu baterie; kdyby nestačilo → nekreslit, když se nic neděje.
