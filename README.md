# ⛽ Čerpací stanice

Webová hra pro předškoláka (5 let): čerpací stanice, tankování, obchod a placení „tečkami“.
Nápady na rozšíření pochází od samotného hráče – hra má být jednoduchá, hlasitá, barevná, s velkými tlačítky.

Tento soubor popisuje **co hra je a jak je navržena**. Průběh práce, plán, TODO a chyby
jsou v [Dev_notes.md](Dev_notes.md).

## Soubory
- `cerpaci_stanice_simulator_pro_male_pumpare.html` – současná funkční verze (jeden soubor, čisté HTML/JS,
  bez Phaseru – stojan, obchod se 6 produkty, bankovky 15/20/25 teček).
- `gemini-code-1794737833330.md`, `Myslenkova_mapa_gemini-code-1794737980748.txt` – původní plán
  a myšlenková mapa (Gemini). Číselné kódy 1xx–4xx z nich jsou nahrazeny (viz Formát kódů).
- `hlas_test_vety.txt` – testovací věty pro výběr hlasu.
- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` – pokyny pro AI asistenty (stejný obsah).

## Cílový hráč
Předškolák (5 let) se základními znalostmi počtů, bez čtenářských dovedností:
- počítá vzestupně do 30, sčítá malá čísla, orientuje se v rozsahu,
- rozumí „menší / větší“, zatím hlavně v grafickém zobrazení,
- **nečte** – hra se musí obejít bez textu,
- zvládá jednoduché ovládání techniky (spárování telefonu, zapnutí Bluetooth),
- symbol **X / ❌ chápe jako „chyba“**.

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

## Technické řešení
- **Hra běží na notebooku s Linuxem** (Chrome/Chromium).
- **Engine: Phaser 3** (+ Vite). Současná HTML verze se převede do Phaser scén.
- **Telefon = vzdálená čtečka a platební terminál.** K dispozici Android i iPhone.
  - Skenování kamerou na obou (Android: `BarcodeDetector`, iPhone/záloha: ZXing).
  - NFC nálepky (NTAG, Web NFC) jsou k dispozici, ale odloženy – později bonus jen pro Android.
- **Spojení telefon ↔ NB: PeerJS (WebRTC)**, párování přes QR kód zobrazený na NB. Bez vlastního serveru.
- **Hosting: GitHub Pages (HTTPS)** – nutné kvůli kameře v telefonu. Hra na NB může běžet i z `localhost`.
- **USB čtečka (HID)** – chová se jako klávesnice (kód + Enter); vyvíjí se a testuje psaním na klávesnici.
  Deklaruje i 2D kódy → **QR kódy lze používat vedle Code128** (čte je i telefon).
  - **Pozor na české rozložení klávesnice:** čtečka posílá klávesy dle US layoutu, s CZ layoutem
    přijde `P101` jako `Pě0ě` (číslice → `+ěščřžýáíé`, prohozené Y/Z). Řešení: nastavit jazyk
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

Kategorie jsou návrh, hráč je může upravit. Úkoly typu „Pípni něco na Es“ / „Dones všechno na Pé“.

## Tisk štítků
- **Herní štítky (zboží, bankovky, karty) se tisknou na laserové tiskárně na archy štítků A4.**
  - Stránka `tisk.html` vykreslí arch přímo v prohlížeči (CSS v mm, `@page A4`) → tisk / PDF.
  - Štítek: velké písmeno kategorie, piktogram, cena tečkami (až 30) + číslice, Code128 a/nebo QR.
  - **Černobíle** → na štítcích **černé piktogramy s výraznými obrysy**, ne barevná emoji (vyjdou šedě).
    Ve hře na obrazovce zůstávají barevná emoji; piktogram a emoji musí být jasně „stejná věc“.
  - Tisk ovládá rodič, hráč podává papíry.
  - Bankovky a karty lze tisknout na papír/tvrdší papír a vystřihnout.
- **Phomemo Smart Mini Label Maker D30** (BT, tisk z aplikace v telefonu, štítky 12 × 40 mm)
  se pro herní štítky **nepoužívá** – příliš malé. Případně později pro drobnosti, které tiskne hráč sám.
- Při případném termotisku: nelaminovat za tepla (termopapír zčerná) – izolepa nebo studená laminace.

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
  - SPZ aut u stojanu (písmena + číslice),
  - paliva N = Natural, D = Diesel,
  - úkoly „Najdi a pípni zboží na M“ (hra ověří správnost),
  - postupné přidávání písmen (začít malou sadou).
