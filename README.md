# ⛽ Čerpací stanice

Webová hra pro předškoláka (5 let): čerpací stanice, tankování, obchod a placení „tečkami“.
Nápady na rozšíření pochází od samotného hráče – hra má být jednoduchá, hlasitá, barevná, s velkými tlačítky.

Tento soubor popisuje **co hra je a jak je navržena**. Průběh práce, plán, TODO a chyby
jsou v [Dev_notes.md](Dev_notes.md).

## Spuštění (vývoj na Windows)
```
npm install        # jednou po naklonování
npm run dev        # vývojový server s automatickým obnovováním (http://localhost:5173)
npm run typecheck  # kontrola typů (TypeScript) – totéž hlásí VS Code v panelu Problems
npm run build      # kontrola typů + sestavení do dist/
npm run preview    # náhled sestavené verze
npm test           # testy služeb (node:test spouští .ts přímo, bez prohlížeče)
```
Po každém `push` do `main` se hra sama nasadí na GitHub Pages (`.github/workflows/deploy.yml`):
https://petr554kelemen.github.io/Pumpar/ – stará verze: `…/Pumpar/stara-verze.html`.

## Soubory
- `index.html`, `src/main.ts` – vstup nové hry (Phaser 4, TypeScript).
- `src/services/` – služby bez závislosti na Phaseru:
  - `eventBus.ts` – sběrnice událostí; **všechny události a jejich data v rozhraní `GameEvents`**,
  - `codes.ts` – rozpoznání kódů (`parseCode` → `CodeInfo`, tabulka kategorií `CATEGORIES`),
  - `scanInput.ts` – vstup kódů z klávesnice / USB čtečky (převod CZ rozložení, ochrana proti dvojímu čtení),
  - `beep.ts` – jednoduché zvuky, `voice.ts` – hlasové fráze (`FRAZE`, nahrané MP3, fronta),
  - `pump.ts` (stojan), `air.ts` (vzduch), `lock.ts` (zámek benzínky), `den.ts` (herní den, odpočet směny),
  - `katalog.ts` (zboží: kód → výrobek, cena), `penezenka.ts` (peněžní karty a jejich zůstatky),
    `denik.ts` (deník směny – platby v obchodě a u vzduchu, localStorage), `ucet.ts` (nezaplacený benzín od stojanu),
    `vysledky.ts` (výsledková listina – pravidla ⭐ a ❤️, tabulka `PRAVIDLA_BODU`),
    `auta.ts` (auta se spotřebou – garáž, nádrže, `TABULKA_AUT`).
- `src/scenes/` – Phaser scény: `LockScene.ts` (zamčená benzínka, výchozí), `BankaScene.ts` (banka – aktivace karet na kolo),
  `StationScene.ts` (stojan), `ParkovisteScene.ts` (parkoviště 🅿️ – nádrže aut), `AirScene.ts` (vzduch), `ShopScene.ts` (obchod), `VysledkyScene.ts` (výsledková listina 🏆),
  `ScanTestScene.ts` („Pípni něco“ – test čtečky jen pro rodiče, **Ctrl+F2**), `UzaverkaScene.ts` (konec dne s listinou),
  `nav.ts` (přepínání scén ikonami vlevo nahoře + odpočet směny vpravo), `hodiny.ts` (kreslení hodin),
  `kartyPanel.ts` (peněžní karty na obrazovce – obchod, vzduch – a přehled zůstatků u stojanu),
  `terminal.ts` (číselná klávesnice dveří a platební terminál s PINem), `listina.ts` (kreslení listiny),
  `odmena.ts` (⭐ ❤️ letí po zaplacení k 🏆), `spz.ts` (SPZ jako tabulka).
- `tests/` – testy služeb (`npm test`).
- `tisk.html`, `src/tisk/` – stránka pro tisk visaček (jen pro rodiče); `layout.ts` = rozvržení listu (mm).
- `karty.html`, `src/tisk/karty.ts` – štítky na staré platební karty (sada karet s tečkami + služební karta).
- `public/stara-verze.html` – původní funkční verze (jeden soubor, čisté HTML/JS, bez Phaseru – stojan,
  obchod se 6 produkty, bankovky 15/20/25 teček). Zůstává hratelná, dokud ji nová verze nenahradí.
- `public/` – soubory kopírované do buildu beze změny; `public/hlas/<klic>.mp3` = nahrané hlasové fráze.
- `gemini-code-1794737833330.md`, `Myslenkova_mapa_gemini-code-1794737980748.txt` – původní plán
  a myšlenková mapa (Gemini). Číselné kódy 1xx–4xx z nich jsou nahrazeny (viz Formát kódů).
- `hlas_test_vety.txt` – testovací věty pro výběr hlasu.
- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` – pokyny pro AI asistenty (stejný obsah).

## Pracovní dohody
- **Před commitem musí projít `npm run typecheck` a `npm test`.** Panel Problems ve VS Code má být čistý.
- **Kódování: výhradně UTF-8, konce řádků LF.** Vynuceno `.editorconfig`, `.vscode/settings.json`
  (bez automatického odhadu kódování) a `.gitattributes`. Uživatel má jiné projekty v CP1250 –
  nikdy nepřebírat jejich nastavení.
- **Grafika / rozložení scén:** když se řeší vzhled, uživatel si může vyžádat **JSON scény pro Phaser Editor**,
  aby viděl rozložení a názvy objektů a domluva o konkrétních blocích byla jednoznačná.
  - Herní objekty proto pojmenovávat **stejně v kódu i ve scéně** (`setName('pumpa')`, proměnná `this.pumpa`),
    česky bez diakritiky, krátce a výstižně.
  - Před prvním použitím ověřit, kterou verzi Phaseru podporuje aktuální Phaser Editor
    (projekt používá Phaser 4) a jaký formát `.scene` očekává.

## Cílový hráč
Předškolák (5 let) se základními znalostmi počtů, bez čtenářských dovedností:
- počítá vzestupně do 30, sčítá malá čísla, orientuje se v rozsahu,
- rozumí „menší / větší“, zatím hlavně v grafickém zobrazení,
- **nečte** – hra se musí obejít bez textu,
- zvládá jednoduché ovládání techniky (spárování telefonu, zapnutí Bluetooth),
- **stříhá běžnými nůžkami** (od 3 let, opatrně) → visačky si vystříhá sám; laminátor (horký) obsluhuje rodič,
- symbol **X / ❌ chápe jako „chyba“**.
- **striktně dodržuje jednou nastavená pravidla** – co jednou uvidí nebo dostane vytištěné, je pro něj
  zákon („tak to ten pán napsal“) a pozdější změny odmítá. Má-li návod, použije ho jako důkaz.
- **logika mu jde** – nová pravidla pochopí rychle (rychleji než dospělý); obtížnost nepodceňovat,
  složitější kombinace (barvy, ceny, doplácení) zvládne,
- **písmena ve slově:** hlásku na **začátku a na konci** slova určí správně, **uprostřed** je pro něj nejtěžší.
  Opisuje slova a v programu Speechtech si sám nechává číst písmena i slova.

## Zásady návrhu
- **Žádný text jako jediný nositel informace.** Vše má ikonu/emoji, barvu a zvuk; text je jen pro rodiče.
- **Herní den, ne skutečný čas.** Hodiny ve hře ukazují časy, které hráč zná: otevírá se v 6:00–8:00
  (po půlhodinách), zavírá ve 20:00 / 21:00. Směna = **odpočet 20 minut** skutečného času (výseč jako kuchyňská
  minutka) → hráč má tempo. Před koncem hlášení „pokladny se budou uzavírat“, pak konec dne; dál = nový den.
- **Hlas jen tam, kde je to fajn** (pár slavnostních a „skutečných“ chvil), žádné hlasové pokyny – viz Hlas.
- **Matematika skrytá ve hře** – každé počítání má být vidět jako pohyb teček, ne jako číslo:
  porovnávání (stačí karta?), rozsahy (předvolba, terč přesnosti), sčítání (cena roste po kolech),
  násobilka (kolo = 3 tečky → 3, 6, 9, 12), **odečítání**: tečky z karty viditelně odletí jedna po druhé
  k věci, kterou platí, a zbytek se vrátí do peněženky (ve staré verzi tečky jen mizely – nebylo to odečítání).
- **Finanční gramotnost** (cíl rodiče, 2026-11-22): nejde jen o hru – hráč se učí hospodařit. Karta má omezený
  zůstatek na celý den, co utratí jinde, chybí v obchodě; když nestačí, ubere zboží; benzín se musí zaplatit.
  Výsledková listina 🏆 oceňuje pokladního za dočerpání karet (viz Výsledková listina).
  Nová mechanika s penězi má tento cíl podporovat, ne obcházet (žádné bezedné karty, doplňování, dluh bez následků).
- **Kde jsou dvě cesty, platí obě.** Kódy ze čtečky jsou zábava, ale nemusí být všude povinné: např. dveře
  benzínky odemkne zadaný kód **nebo** pípnutá karta (karta = „PIN v kapse“). Hráč volí, co má po ruce.
- **Slova hráče, ne naše.** Ve frázích používat jeho pojmenování: **benzínka, benzinář** – „pumpa / pumpař“
  je pro něj něco jiného (pumpa stojí „hned vedle benzínky“). Název projektu „Pumpar“ je jen interní.
  Odtahovce říká **vlečka**.
  Nové pojmy ověřit s hráčem (viz Pravidla, bod 4).
- **Cíl navíc: naučit některá písmena.**
- **Čísla vždy dvakrát:** číslice + stejný počet teček (učí se poznávat číslice).
- **Rozsah do 30:** ceny, bankovky i útrata se drží do 30 teček.
- **Porovnání graficky:** „stačí peníze?“ = dva sloupce/řady teček vedle sebe, ne číslo.
- **Sčítání malých čísel:** vracení a součty po malých krocích, s animací přesouvání teček.
- **❌ = chyba** (neznámý kód, málo peněz).
- **Úrovně obtížnosti** pro růst: nejdřív jen tečky → tečky + číslice → později slova.
- Párování telefonu zvládne hráč sám (QR + ikony stavu: 📶 ✅ ❌).

### Pravidla jsou zákon
1. **Nic provizorního před hráčem – ve hře.** Pravidlem se věc stává, až když má **ve hře význam**
   (hra ji ukáže, pojmenuje, ocení). Kategorie, písmena, obrázky, slabiky SPZ, ceny i zvuky proto hráč
   ve hře uvidí až ve finální podobě; testovací obrazovky a nasazenou verzi nejdřív zkouší rodič.
   Samotný technický tisk bez významu (zkušební štítky, test čitelnosti) nevadí – hráč u něj může pomáhat.
2. **Hráč pravidla spoluvytváří – platí až po „orazítkování“.** Dokud se vymýšlí, je pravidlo v **dílně ✏️**
   a smí se měnit. Platným se stane, až ho hráč sám **orazítkuje ✅** (podpis/razítko na návodu). Teprve pak
   se tiskne. Pozdější změna = vrátit do dílny ✏️, upravit, znovu orazítkovat (nový návod s vyšším číslem).
   Pravidlo, které sám vytvořil a schválil, bude hájit.
3. **Měnitelnost je součástí pravidel od začátku.** Co se má měnit, musí to mít v pravidlech od prvního dne:
   - „Auta se dají přeparkovat“ (přiřazení SPZ → auto),
   - „Ceny ráno nastavuje vedoucí benzínky“ (příprava směny),
   - **obrázkový návod s číslem verze** („Návod 1“, „Návod 2“…) – změna = nový návod s vyšším číslem,
     který starý nahradí. Platí nejnovější návod.
4. **Nápad nejdřív vyzkoušet nanečisto, bez kódu.** Rodič zadá úkol ústně / na papíře a sleduje, zda hráče baví
   a kde je hranice obtížnosti. Teprve pak se vyvíjí. (Příklad: hádanka písmen → baví ho, hláska uprostřed
   slova je nejtěžší.)

## Technické řešení
- **Hra běží na notebooku hráče s Linuxem** (Chrome/Chromium) – **jen hraní**, otevírá se z GitHub Pages
  (záložka/zástupce na ploše). Na NB se nic neklonuje ani nevyvíjí.
- **Hra není responzivní.** Pevná plocha 1280 × 720, Phaser ji zmenší/zvětší na okno (FIT) – cíl je notebook.
  Telefon hru nezobrazuje: má **vlastní jednoduché stránky na výšku** (čtečka kódů – fáze 3, terminál – fáze 6).
- **Vývoj probíhá výhradně na Windows notebooku** (tato složka, VS Code).
- **Stolní PC (Windows)** – je na něm Balabolka s českým hlasem; slouží jen k případnému generování zvuků
  (soubory se do projektu dostanou přes Dropbox), nevyvíjí se na něm.
- **Jazyk: TypeScript** (od 2026-11-16; původní jednosouborová hra byla v JS). TypeScript 7, režim `strict`,
  jen „odmazatelná“ syntaxe (`erasableSyntaxOnly` – bez `enum`/`namespace`), importy s příponou `.ts`.
  Kontrolu dělá `tsc` (`npm run typecheck`, i součást `npm run build` → chyba typů zastaví nasazení).
- **Engine: Phaser 4** (+ Vite, obojí lokálně v projektu). Původně plánován Phaser 3; při zakládání
  (2026-11-16) byla aktuální stabilní 4.2.1 → zvolen Phaser 4. Stará HTML verze se převede do Phaser scén.
- **Node.js LTS** (v26). `node_modules/` a `dist/` jsou vyřazené ze synchronizace Dropboxu
  (`Set-Content -Path <slozka> -Stream com.dropbox.ignored -Value 1`) – po smazání složky nastavit znovu.
- **Telefon = vzdálená čtečka a platební terminál.** K dispozici Android i iPhone.
  - Skenování kamerou na obou (Android: `BarcodeDetector`, iPhone/záloha: ZXing).
  - NFC nálepky (NTAG, Web NFC) jsou k dispozici, ale odloženy – později bonus jen pro Android.
- **Spojení telefon ↔ NB: PeerJS (WebRTC)**, párování přes QR kód zobrazený na NB. Bez vlastního serveru.
- **Hosting: GitHub Pages (HTTPS)** – nutné kvůli kameře v telefonu. Hra na NB může běžet i z `localhost`.
- **USB čtečka (HID)** – chová se jako klávesnice (kód + Enter); vyvíjí se a testuje psaním na klávesnici.
  Deklaruje i 2D kódy → **QR kódy lze používat vedle Code128** (čte je i telefon).
  - **Pozor na české rozložení klávesnice:** čtečka posílá klávesy dle US layoutu, s CZ layoutem
    přijde `P101` jako `P+é+` (číslice → `+ěščřžýáíé`, prohozené Y/Z). Řešení: nastavit jazyk
    ve čtečce (konfigurační kódy z manuálu) a navíc v `scanInput` převádět `ěščřžýáíé` → `1–9,0`.
- Webkamera NB jen jako záloha (malé kódy čte špatně).
- **Platba kartou = hraná** (herní karta s kódem + PIN na klávesnici), žádné skutečné platby.

## Architektura
```
Phaser scény (to, co je vidět): Stojan │ Příprava směny │ Obchod/Pokladna │ Minihry
        ▲ události (sběrnice): "scan" {code}, "paid" {amount}, …
Služby – čisté JS bez závislosti na Phaseru:
  catalog   – kód → produkt (jediný zdroj pravdy; z něj obchod i tiskové štítky)
  wallet    – zůstatek hotovosti a karty (localStorage)
  scanInput – sjednocený vstup kódů: klávesnice/USB čtečka, kamera, telefon
  phoneLink – PeerJS spojení s telefonem
  voice     – přehrávání hlasových frází
```
Pravidlo: služby nevolají Phaser, scény nevolají přímo hardware. Vše přes sběrnici událostí.

## Formát kódů (Code 128 / QR)
**Písmeno + 3 číslice. Písmeno = první písmeno kategorie** → hráč se učí písmena
(velké písmeno na štítku). Zároveň se kódy nepletou s EAN v bytě. Sloupec „Písmeno jako…“ = jak se písmeno
pojmenuje (štítky, rodič, případná hádanka); hra ho při pípnutí neříká (viz Hlas).

Zakázaná písmena:
- **s diakritikou** (Č, Š, Ř, Ž) – čtečka přes klávesnici je spolehlivě nepošle,
- **Y a Z** – prohazování na CZ klávesnici,
- **X** – pro hráče znamená „chyba“.

Tedy čokoláda i zmrzlina → `S`.

| Kód | Kategorie | Písmeno jako… | Příklad |
|-----|-----------|------------------|---------|
| `Pxxx` | pití (pitíčko, káva) | „Pé jako pití“ | `P001` |
| `Sxxx` | sladkosti (sušenka, zmrzlina, čokoláda) | „Es jako sladkosti“ | `S001` |
| `Jxxx` | jídlo (párek, rohlík) | „Jé jako jídlo“ | `J001` |
| `Hxxx` | hračky | „Há jako hračky“ | `H001` |
| `Axxx` | autíčka | „Á jako auto“ | `A001` |
| `Mxxx` | mytí auta (myčka) | „Em jako myčka“ | `M001` |
| `Vxxx` | vysavač | „Vé jako vysavač“ | `V001` |
| `Nxxx` / `Dxxx` | palivo Natural / Diesel | „En jako Natural“ | `N001` |
| `Bxxx` | herní bankovka (číslo = hodnota v tečkách) | „Bé jako bankovka“ | `B020` |
| `Kxxx` | herní platební karta | „Ká jako karta“ | `K001` |
| `LA999` | **vlečka** 🚛 (odtahovka) – jediný kód „SPZ se 3 číslicemi“, s auty se nesplete | – | `LA999` |
| `9xxx` | rodičovské povely – **jen číslice**; `9200` = smazat auta (na 🅿️) | – | `9200` |

Kategorie jsou **návrh – před prvním tiskem odsouhlasit s hráčem** (viz Pravidla jsou zákon). Úkoly typu „Pípni něco na Es“ / „Dones všechno na Pé“.

### SPZ aut (2026-11-16)
**Slabika + 2 číslice**, v kódu bez pomlčky (`LA01`), na obrazovce s pomlčkou (`LA-01`).
Hráč nečte, ale slyšené slovo umí rozdělit na slabiky → slabiku se naučí poznat.
- `LA01`–`LA10` – auta hráče,
- `KE01`–`KE10` – auta rodiče.
- Nekoliduje se zbožím (zboží = 1 písmeno + 3 číslice, SPZ = 2 písmena + 2 číslice).
- Písmena slabik podléhají stejným omezením (bez diakritiky, bez X, Y, Z). Pomlčka do kódu nepatří
  (čtečka s CZ rozložením by poslala jiný znak).
- Hlas: „La – nula jedna“ (nulu vždy vyslovit – hráč ji tak čte).
- Původ slabik se v repozitáři neuvádí (osobní údaje).
- **SPZ se pípají:** štítek je na autíčku nebo na **prošlé platební kartě** (stane se znovu „funkční“).
  Pípnutí = auto přijelo ke stojanu.
- **SPZ ≠ konkrétní autíčko.** Kód říká jen „čí auto a kolikáté“. Které autíčko to je a jak vypadá
  ve hře, je samostatné, **měnitelné přiřazení** – hráč si auta přerozděluje.
- Rozpoznání: `parseCode` → `druh: 'auto'` (`spz`, `majitel`), tabulka slabik `SPZ_SLABIKY` v `codes.ts`.

## Tisk štítků (2026-11-16)
| Co | Kam | Čím | Poznámka |
|---|---|---|---|
| **Zboží** (`P001`, `S001`…) | **laminovaná visačka**, hráč ji přiváže/uváže na zboží | laser (papír) + laminace + dírka | hráč sám rozhoduje, co čím označí |
| **SPZ** (`LA01`, `KE01`) na kartě | prošlá platební karta | **laser + QR H** (laminovaný / přelepený štítek) | místo na velký QR, odolné slunci |
| **SPZ** na velkém autíčku | autíčko | D30 termoštítek, Code128 (jde z plastu dolů) | termotisk bledne na slunci |
| **SPZ** u malého autíčka | visačka **u auta** (ne na něm) | laser + QR H + laminace | štítek by se na malém autě zdeformoval a čtečka ho nepřečte |
| **Peněžní karty** (`K001`–`K007`) | prošlá platební karta | **štítek Code128** z aplikace tiskárny, nalepený na světlý podpisový proužek (2026-11-26; `karty.html` s QR H zůstává jako záloha) | sada 1 × 20, 2 × 15, 4 × 10 |
| **Služební karta** (`K000`) 🔑 | prošlá platební karta | **štítek Code128** jako peněžní karty | jediná karta obsluhy: odemyká benzínku **a** v obchodě dělá storno = restart (viz níže), `karty.html` |
| **Bankovky** (`B020`) | kód přímo na papírové bankovce | laser, papír | bez samolepek |
| **Rodičovské kódy** (`9001`) | list pro rodiče | laser, papír | hráč je nemá mít po ruce |

- **Peněžní karty se zůstatkem** (rozhodnutí 2026-11-22, nahrazuje „karty s pevnou hodnotou `Bxxx`“ z 2026-11-18):
  **každá karta má vlastní kód** `K001`–`K007` a počáteční hodnotu (`K001` = 20, `K002`–`K003` = 15,
  `K004`–`K007` = 10; tabulka v `penezenka.ts`). **Zůstatek se drží po celý herní den**, nový den = karty zase plné.
  Na štítku **jen QR** (+ drobný kód pro rodiče) – **hodnotu hráč pozná podle barvy karty**. Nákup se platí
  jednou kartou; na kterou zůstatek nestačí, ta je odmítnuta ❌. Přečerpání zatím ne (nápad rodiče).
  **Proč (cíl rodiče):** hráč se má naučit, že **platební karta není bezedná peněženka** – ani při skutečném
  nákupu. Během jedné hry (herního dne) si hlídá, kolik si ještě může dovolit – zůstatky vidí na kartách
  a u stojanu. Nezjednodušovat na nekonečnou kartu ani na doplňování karet během dne (to dřív dělal vzduch).
  Kódy `Bxxx` zůstávají pro bankovky/mince (fáze 5).
- **Benzín se platí v obchodě a bez zaplacení se neodchází** (rozhodnutí 2026-11-22): po tankování „🛒 Jít platit“,
  benzín je v košíku a nedá se vrátit; když karta nestačí, hráč ubere zboží. Navigace je do zaplacení zamčená.
  Nezaplatí-li benzín žádná karta, služební karta `K000` = **restart** (karty plné, hráč si je vybere znovu,
  čas dne běží dál). U stojanu je vidět zůstatek aktivních karet (kolik zbývá na nákupy).
- **Výběr karet na začátku kola = strop** (rozhodnutí rodiče 2026-11-24, scéna `BankaScene`): po odemčení benzínky
  a po restartu `K000` hráč **zajede autem do banky** 🏦 (nápad rodiče 2026-11-26) a karty si tam **aktivuje** klepnutím nebo pípnutím; součet = strop teček na kolo, který pak
  hlídá. Aktivní karta svítí a má zelené ✔, neaktivní je bledá. Během kola se karty nepřidávají a ve hře jsou
  jen aktivní. **Druhé pípnutí už aktivní karty = jen chybový zvuk a zatřesení, bez ❌.**
  **❌ je vyhrazený pro kritické chyby** – např. použití nesprávné karty (neaktivní / neznámé) při placení
  (obchod 🛒 i vzduch 🛞). Po ✅ ➡️ ⛽ auto z banky odjede ke stojanu.
- **Karty jsou i na obrazovce** (hra je hratelná bez čtečky): obchod i vzduch ukazují aktivní karty
  ze sady `K001`–`K007` se zůstatkem; zaplatit jde **klepnutím na kartu nebo jejím pípnutím**.
- **Platba se potvrzuje PINem jako při skutečném nákupu** (rozhodnutí rodiče 2026-11-27): pokladní (hráč) vybere
  kartu, **zákazník (rodič) zadá PIN `1111`** na terminálu (klepáním nebo na klávesnici + Enter). Na kartu,
  na kterou zůstatek nestačí, se PIN nezadává – odmítne se hned ❌. Odečet až po správném PINu; špatný PIN = ❌,
  zkouší se znovu (zatím bez blokace). ↩️ zavře terminál bez placení. **PIN nikdy nic nestornuje** – storno
  zůstává jen služební karta `K000`; terminál vypadá jinak než dveře (modrý rám, 💳 a částka nahoře).
  `PIN_KARTY` (`penezenka.ts`) je samostatné pravidlo vedle kódu dveří `KOD_DVERI` – dnes stejná hodnota,
  v dílně ✏️ se smí měnit zvlášť. Nahrazuje plán „PIN 1234 na telefonu“ (fáze 6).
- **Ceny se na štítky netisknou.** Visačka nese jen co to je (písmeno kategorie, obrázek, kód).
  Kolik to stojí, určuje ceník ve hře (nastavuje „vedoucí benzínky“ v dílně ✏️) – změna ceny = žádný nový tisk.
- **O značení rozhoduje hráč.** Hra nekontroluje, na čem visačka visí. Pomůcka: **obrázkový seznam
  „kam co“** (jako pexeso – obrázek na visačce = obrázek na seznamu), žádný text.
- **Hlas popisuje, nepřikazuje**, aby hráče neomezoval v rozhodování.
- **Laser + laminace:** visačky, bankovky, obrázkový seznam. Tisk ovládá rodič, hráč podává papíry.
  Černobíle → **černé piktogramy s výraznými obrysy** (barevná emoji vyjdou šedě); ve hře zůstávají
  barevná emoji a piktogram s emoji musí být jasně „stejná věc“.
  Stránka `tisk.html` vykreslí arch přímo v prohlížeči (CSS v mm, `@page A4`) → tisk / PDF.
- **Phomemo Smart Mini Label Maker D30** (BT, tisk z aplikace v telefonu, štítky **12 × 30** nebo 12 × 40 mm,
  203 dpi = 0,125 mm/bod): SPZ a karty. Obrázky štítků generuje `tisk.html` (sekce D30) **přesně v bodech
  tiskárny**, čistě černobílé → stáhnout PNG do telefonu → aplikace Phomemo, vložit bez změny velikosti.
  - Code128 `LA01`: 2 body/modul (0,25 mm) = 24,8 mm → vejde se na 30 mm i s textem `LA-01` pod kódem;
    3 body/modul (0,375 mm) jen na 40 mm.
  - QR (21 × 21 modulů) s opravou chyb **H (30 %)** – u 4znakových kódů nezvětší rozměr; 3 body/modul ≈ 9,4 mm
    (tichá zóna 2), 4 body/modul ≈ 11,5 mm (tichá zóna 1); vedle velký text `LA-01`.
  - Výpočty v `src/tisk/d30.ts` (testy), vykreslení `src/tisk/d30Render.ts`.
- **QR všude s opravou chyb H** (i na laserových visačkách) – snese škrábance a odlesk fólie.
- **Preferovaný kód: QR** (karty, visačky). Důvody: snáší čtení z úhlu (telefon si podle rohových
  čtverců dopočítá perspektivu, u čárového kódu to nejde), poškození i odlesky. Code128 jen tam, kde je
  málo místa na výšku (D30). Test rozhodne hlavně o **nejmenší spolehlivé velikosti QR**.
- **D30 (12 × 30 / 12 × 40) = Code128** (test 2026-11-18: čtečka přečetla Code128 bez problémů,
  QR H na 12 × 40 jen s obtížemi – je na tak malý štítek příliš malý).
- **Hře je jedno, z jakého druhu kódu text přijde** (Code128, QR, ruční psaní) – rozhoduje jen obsah
  podle Formátu kódů. Stejný kód proto může být na jedné věci jako QR a na jiné jako Code128.
- **Code39 se nepoužívá** – nemá povinný kontrolní znak, chybné čtení projde jako jiný znak (zkušenost rodiče:
  více chyb než Code128, který má kontrolní součet vždy).
- **Termotisk (D30) bledne/černá na slunci a v teple** – jen tam, kde je potřeba snadné odlepení a štítek
  nebude na slunci. Laserový toner pod laminací vydrží.
- **Visačky – tisk a laminace:**
  - visačka **38 × 52 mm**, na list A4 **5 × 5 = 25 visaček těsně vedle sebe** (tmavě šedé čáry = střih,
    jeden střih oddělí dvě visačky), nahoře **10 mm volno na dírku** (čárkovaný kroužek pro děrovačku),
    pod tím velké písmeno + piktogram, dole kód,
  - postup: vytisknout (100 %, bez okrajů) → vystříhat (zvládne hráč – čáry jsou výrazné) → do kapsy **A5** rozložit **3 × 3 s mezerami
    ~8 mm** (fólie se spojí jen tam, kde není papír) → laminovat → stříhat uprostřed mezer → děrovačka,
  - **kdo co dělá:** tisk a laminace rodič v kanceláři (běžný laminátor – hlídat zavedení fólie, horký),
    stříhání papíru hráč doma, stříhání zalaminované fólie (tuhá) zkusí hráč, jinak rodič,
  - stránka **`tisk.html`** (na webu `…/Pumpar/tisk.html`) – zatím technický test velikostí kódů.
- **Termoštítky nelaminovat za tepla** (zčernají). Laminuje se jen laserový tisk.

## Výsledková listina 🏆 (2026-11-27)
**Jedna společná listina za herní den** – žádné dělení na LA / KE (hráč a rodič hrají spolu: rodič je zákazník
a platí, hráč je pokladní a vybírá kartu). Scéna 🏆 v navigaci (místo bývalého 📟), stejná listina na konci dne.
Hodnotí se **práce pokladního**, ne utrácení zákazníka (v souladu s WISH Infografika dne).
- **⭐ hvězdy za výběr karty – čím víc přemýšlení, tím víc.** Rozhoduje zůstatek karty **po** platbě:
  dočerpání karty **platbou 1 tečky = 6 ⭐** (nejvíc – hráč sám objevil, že 1 tečku stojí kontrola plného kola 🛞
  a 1 litr benzínu ⛽; zboží za 1 tečku se proto nepřidává), vyčerpaná karta **10 = 5, 15 = 4, 20 = 3**,
  zbytek 1–2 = 2, 3–5 = 1, víc = 0. Platba 1 tečkou z karty, kde ještě něco zbude, se hodnotí podle zbytku
  (jinak by šlo sbírat hvězdy kontrolou kola dokola).
- **❤️ srdíčka za snahu ve všech částech hry:** zboží podle katalogu, rostou rychleji než cena (🍪 1, 🍦 1, ☕ 2,
  🧃 2, 🌭 3, 🏎️ 5 – drahé zboží rychle čerpá kartu, má se vyplatit; lineární srdíčka by kvůli stropu karet daly
  za den vždy stejně); benzín a vzduch 1 ❤️ za započaté 3 tečky, **benzín jen od poloviny předvolby**.
- Odměna se ukáže **hned po zaplacení** (⭐ ❤️ letí k 🏆, vyčerpaná karta se rozzáří a zbledne). 0 ⭐ = bez ❌.
- **Restart `K000` je bez postihu** – body i deník zůstávají.
- Počty jsou **návrh do dílny ✏️** – mění se jen v `PRAVIDLA_BODU` (`vysledky.ts`) a `srdicka` v katalogu.
- Listina patří k hernímu dni (`HerniDen.id` v deníku – přežije i obnovení stránky); nový den = prázdná.

## Auta se spotřebou 🚗⛽ (2026-11-27)
Hráč si **pípne svá autíčka do hry** (SPZ). Během směny jim **ubývá benzín** – každé má jinou spotřebu. Podle
**parkoviště 🅿️** si sám najde auto, které potřebuje dotankovat. Prázdné auto přiveze **vlečka** 🚛.
- **Pípnutí neznámé SPZ** (na 🅿️ nebo u ⛽) auto přidá; náhodně dostane **nádrž 10 / 15 / 20 L** a **spotřebu**
  malou / střední / velkou (≈ 3 / 5 / 8 L za směnu). Spotřebu hráč nevidí – pozná ji podle ubývání.
- **Na začátku každého kola** (odemčení benzínky, restart `K000`, tedy i každý nový den) mají všechna auta nádrž na **⅔**.
- Benzín ubývá **jen během běžící směny**; stav se dopočítá z času (`stav₀ − spotřeba × čas směny od t₀`).
- **🅿️:** SPZ jako skutečná tabulka (hráč porovnává znaky) + sloupec nádrže (délka podle kapacity) + litry.
  Pod polovinou oranžová, **pod ¼ bliká červeně (rezerva)**, prázdné auto šedé s 🪫 – **žádné ❌**, nic se nestalo.
  Auta se neřadí – najít, komu dochází, je hráčova práce.
- **U stojanu pípnutá SPZ = auto přijelo:** bargraf je nádrž auta (šedě co v ní bylo, barevně natankované, plná =
  kapacita auta, přetečení červeně). Předvolba zůstává hráčova volba. Zaplacený benzín dostane auto (nejvýš plnou
  nádrž); nezaplacený (storno `K000`) ne. Bez SPZ se tankuje jako dřív.
- **Prázdné auto samo nepřijede** (🪫 + nápověda 🚛). **Vlečka `LA999`** + SPZ = přitáhne ho ke stojanu; kolikrát
  za den, je jedno. Kanystr zatím ne (nemá kód – WISH).
- Auta se pamatují v prohlížeči (`pumpar.auta`); rodič je smaže kódem `9200` na 🅿️.
- Odměny 🏆 se s auty zatím neladí (❤️ za benzín dál podle předvolby) – listina je jen závěrečná informace.
- Čísla jsou **návrh do dílny ✏️** – mění se jen v `TABULKA_AUT` (`auta.ts`). Je to nové pravidlo pro hráče
  (Pravidla jsou zákon) – platí po ukázce a „orazítkování“.

## Hlas
Rozhodnutí 2026-11-27 (nahrazuje původní návrh „hlasové pokyny, písmena při každém pípnutí“):
- **Hlas jen tam, kde je to fajn** – slavnostní chvíle a věci, které hráč zná ze skutečného světa.
  Málo frází = neomrzí se, a hra se rychle načítá.
- **Fráze** (jediný zdroj pravdy: `FRAZE` v `src/services/voice.ts`, klíč = název souboru):

  | Klíč | Text | Kdy |
  |------|------|-----|
  | `otevreno` | Benzínka je otevřená! | odemčení dveří / zákazník vejde |
  | `uzaviraji` | Pokladny se budou uzavírat. | hlášení před koncem směny (po gongu) |
  | `zavreno` | Benzínka je zavřená. | konec dne (po gongu) |
  | `zadejte_pin` | Zadejte PIN. | otevře se platební terminál |
  | `platba_prijata` | Platba přijata. | správný PIN |
  | `vlecka_vyjizdi` | Vlečka vyjíždí! | pípnutí vlečky `LA999` (stojan, 🅿️) |

- **Bez hlasu:** čísla, ceny, zbytky, počty ⭐❤️ (počítá hráč – hlas by počítal za něj), chyby ❌ (stačí zvuk
  a zatřesení), tankování, vzduch, odměny, navigace, klávesnice, SPZ (porovnávat znaky umí sám), rodičovské kódy.
- **Písmena při pípnutí zboží zatím ne** (po desátém „Pé jako pití“ by to otravovalo) – patří spíš do hádanky
  písmen (WISH). Hlášení rezervy auta taky ne (stačí blikání). Rozhodne hráč.
- **Nahrané MP3** v `public/hlas/<klic>.mp3` – žádné TTS za běhu (české hlasy ve `speechSynthesis` na Linuxu
  chybí / zní špatně). Soubor se stáhne až při prvním přehrání. **Chybějící soubor se tiše přeskočí** – hra
  funguje i bez nahrávek, fráze lze nahrávat postupně.
- Služba `voice`: `hlas().rekni(klic)`, `rekniPo(ms, klic)` (např. až dozní gong); fronta – fráze se
  nepřekřikují, stejná čekající fráze se nepřidá podruhé; `zapnuto` = vypnutí.
- **Jeden hlas pro celou hru**, zdroj se vybere poslechem (Speechtech na stolním PC, záloha Microsoft Jakub).
  Zdrojové nahrávky WAV, do hry MP3. Nová fráze = řádek do `FRAZE` + soubor.
- Zkušenosti z výběru hlasu (pro případnou hádanku písmen): písmena se hlasu zadávají **názvem** („em“, „bé“,
  „chá“), samotné písmeno zní ztlumeně → fráze typu „Em. M jako myčka.“; Jakub: SSML
  `<prosody rate="-35%" volume="+60%" pitch="+10%"><emphasis level="strong">bé!</emphasis></prosody>`.
  Balabolka a gTTS se nepoužívají.
