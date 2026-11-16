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
  - `beep.ts` – jednoduché zvuky.
- `src/scenes/` – Phaser scény: `ScanTestScene.ts` („Pípni něco“, výchozí), `StationScene.ts` (zkušební stojan),
  `nav.ts` (přepínání scén ikonami ⛽ 📟 vlevo nahoře).
- `tests/` – testy služeb (`npm test`).
- `tisk.html`, `src/tisk/` – stránka pro tisk visaček (jen pro rodiče); `layout.ts` = rozvržení listu (mm).
- `public/stara-verze.html` – původní funkční verze (jeden soubor, čisté HTML/JS, bez Phaseru – stojan,
  obchod se 6 produkty, bankovky 15/20/25 teček). Zůstává hratelná, dokud ji nová verze nenahradí.
- `public/` – soubory kopírované do buildu beze změny (později zvuky, obrázky).
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

## Zásady návrhu
- **Žádný text jako jediný nositel informace.** Vše má ikonu/emoji, barvu a zvuk; text je jen pro rodiče.
- **Hlasové pokyny** („Pípni zboží“, „Přilož kartu“, „Máš dost peněz“) – viz Hlas a písmena.
- **Cíl navíc: naučit některá písmena.**
- **Čísla vždy dvakrát:** číslice + stejný počet teček (učí se poznávat číslice).
- **Rozsah do 30:** ceny, bankovky i útrata se drží do 30 teček.
- **Porovnání graficky:** „stačí peníze?“ = dva sloupce/řady teček vedle sebe, ne číslo.
- **Sčítání malých čísel:** vracení a součty po malých krocích, s animací přesouvání teček.
- **❌ = chyba** (neznámý kód, málo peněz).
- **Úrovně obtížnosti** pro růst: nejdřív jen tečky → tečky + číslice → později slova.
- Párování telefonu zvládne hráč sám (QR + ikony stavu: 📶 ✅ ❌).

### Pravidla jsou zákon
1. **Nic provizorního před hráčem.** Kategorie, písmena, obrázky, slabiky SPZ, ceny i zvuky vidí hráč až
   ve finální podobě. Testovací obrazovky a nasazenou verzi nejdřív zkouší rodič.
2. **Hráč pravidla spoluvytváří – platí až po „orazítkování“.** Dokud se vymýšlí, je pravidlo v **dílně ✏️**
   a smí se měnit. Platným se stane, až ho hráč sám **orazítkuje ✅** (podpis/razítko na návodu). Teprve pak
   se tiskne. Pozdější změna = vrátit do dílny ✏️, upravit, znovu orazítkovat (nový návod s vyšším číslem).
   Pravidlo, které sám vytvořil a schválil, bude hájit.
3. **Měnitelnost je součástí pravidel od začátku.** Co se má měnit, musí to mít v pravidlech od prvního dne:
   - „Auta se dají přeparkovat“ (přiřazení SPZ → auto),
   - „Ceny ráno nastavuje vedoucí pumpy“ (příprava směny),
   - **obrázkový návod s číslem verze** („Návod 1“, „Návod 2“…) – změna = nový návod s vyšším číslem,
     který starý nahradí. Platí nejnovější návod.

## Technické řešení
- **Hra běží na notebooku hráče s Linuxem** (Chrome/Chromium) – **jen hraní**, otevírá se z GitHub Pages
  (záložka/zástupce na ploše). Na NB se nic neklonuje ani nevyvíjí.
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
(velké písmeno na štítku, hlas při pípnutí: „Pé jako pití“). Zároveň se kódy nepletou s EAN v bytě.

Zakázaná písmena:
- **s diakritikou** (Č, Š, Ř, Ž) – čtečka přes klávesnici je spolehlivě nepošle,
- **Y a Z** – prohazování na CZ klávesnici,
- **X** – pro hráče znamená „chyba“.

Tedy čokoláda i zmrzlina → `S`.

| Kód | Kategorie | Hlas při pípnutí | Příklad |
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
| `9xxx` | rodičovské povely (přidat peníze, reset) – **jen číslice** | – | `9001` |

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
| **SPZ** (`LA01`, `KE01`) | autíčka nebo prošlé platební karty | **D30** termoštítek 12 × 40 mm | z plastu jde dolů snáz než laserová samolepka |
| **Herní karta** (`K001`) | prošlá platební karta | D30 | |
| **Bankovky** (`B020`) | kód přímo na papírové bankovce | laser, papír | bez samolepek |
| **Rodičovské kódy** (`9001`) | list pro rodiče | laser, papír | hráč je nemá mít po ruce |

- **Ceny se na štítky netisknou.** Visačka nese jen co to je (písmeno kategorie, obrázek, kód).
  Kolik to stojí, určuje ceník ve hře (nastavuje „vedoucí pumpy“ v dílně ✏️) – změna ceny = žádný nový tisk.
- **O značení rozhoduje hráč.** Hra nekontroluje, na čem visačka visí. Pomůcka: **obrázkový seznam
  „kam co“** (jako pexeso – obrázek na visačce = obrázek na seznamu), žádný text.
- **Hlas popisuje, nepřikazuje** („Es jako sladkosti“), aby hráče neomezoval v rozhodování.
- **Laser + laminace:** visačky, bankovky, obrázkový seznam. Tisk ovládá rodič, hráč podává papíry.
  Černobíle → **černé piktogramy s výraznými obrysy** (barevná emoji vyjdou šedě); ve hře zůstávají
  barevná emoji a piktogram s emoji musí být jasně „stejná věc“.
  Stránka `tisk.html` vykreslí arch přímo v prohlížeči (CSS v mm, `@page A4`) → tisk / PDF.
- **Phomemo Smart Mini Label Maker D30** (BT, tisk z aplikace v telefonu, štítky 12 × 40 mm, ~203 dpi):
  SPZ a karty. Krátký kód se vejde: Code128 `LA01` ≈ 22 × 8 mm, QR ≈ 10 × 10 mm, vedle text `LA-01`.
  Aplikace tiskárny by měla umět Code128 i QR sama (napsat `LA01`) – ověřit.
- **Visačky – tisk a laminace:**
  - visačka **38 × 52 mm**, na list A4 **5 × 5 = 25 visaček těsně vedle sebe** (tmavě šedé čáry = střih,
    jeden střih oddělí dvě visačky), nahoře **10 mm volno na dírku** (čárkovaný kroužek pro děrovačku),
    pod tím velké písmeno + piktogram, dole kód,
  - postup: vytisknout (100 %, bez okrajů) → vystříhat (zvládne hráč – čáry jsou výrazné) → do kapsy **A5** rozložit **3 × 3 s mezerami
    ~8 mm** (fólie se spojí jen tam, kde není papír) → laminovat → stříhat uprostřed mezer → děrovačka,
  - stránka **`tisk.html`** (na webu `…/Pumpar/tisk.html`) – zatím technický test velikostí kódů.
- **Termoštítky nelaminovat za tepla** (zčernají). Laminuje se jen laserový tisk.

## Hlas a písmena
- **Hlas = předgenerované audio soubory.** Hra jen přehrává soubory – žádné TTS za běhu
  (české hlasy ve `speechSynthesis` na Linuxu chybí / zní špatně). Zdroj hlasu lze kdykoli vyměnit,
  i po jednotlivých frázích. Výběr hlasu: viz Dev_notes.md.
- Hlas rodiče se nepoužívá. Google Překladač (neoficiální gTTS) se nepoužívá.
- Seznam frází jako jediný zdroj pravdy (např. `voice-phrases.json`: `klic → text`).
  Klíče bez diakritiky (`pismeno_M`, `pipni_zbozi`). Po přidání fráze znovu spustit generování.
- Služba `voice`: `say(klic)`, fronta (nepřekřikovat se), hlasitost, vypnutí.
- **Písmena:** TTS u samotného písmena často řekne jen „em“ → fráze typu „Em. M jako myčka.“
  Kde se ve hře objeví:
  - velké písmeno kategorie na štítcích; po pípnutí hlas řekne písmeno + slovo,
  - SPZ aut u stojanu – slabika + číslo (`LA-01`, viz SPZ aut),
  - paliva N = Natural, D = Diesel,
  - úkoly „Najdi a pípni zboží na M“ (hra ověří správnost),
  - postupné přidávání písmen (začít malou sadou).
