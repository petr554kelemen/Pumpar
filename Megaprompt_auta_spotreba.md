# Megaprompt: Auta se spotřebou 🚗⛽ (vylepšení 2)

> Pro AI asistenta (Claude / Codex / Gemini), který bude úlohu provádět v repozitáři Pumpar.
> Nejdřív si přečti `README.md` a `Dev_notes.md` (pokyny v `CLAUDE.md`). Komunikuj česky.
> Předchozí megaprompt (výsledková listina 🏆) je hotový – pravidla jsou v README → Výsledková listina.

## 1. Nápad (rodič, 2026-11-27)
Na začátku si hráč **pípne svá autíčka do hry** (štítky SPZ `LA01`… / `KE01`…). Jakmile se spustí odpočet směny,
**autům ubývá benzín** – každé má **jinou spotřebu**. Hráč si může vyvolat **obrazovku se stavem nádrží**.
Nádrž smí klesnout **až na 0** – takové auto samo nedojede; hráč má **odtahovku – říká jí „vlečka“**
(skutečné autíčko) a auto k benzínce doveze. **Když benzín dojde, nic zlého se nestane** – auto prostě pojede
s vlečkou (klidně víckrát). Ve hře se proto všude používá slovo **vlečka** (README → Slova hráče, ne naše). Podle seznamu si hráč **sám najde auto, které potřebuje dotankovat**.
Hra proto musí **přepočítat, kolik auto spálilo za uběhlý čas**. „To začne být zábava.“

Matematika skrytá ve hře (README → Zásady návrhu): porovnávání (které auto má nejmíň?), rozsahy (kolik se vejde
do nádrže), odečítání v čase (nádrž viditelně ubývá), plánování (koho dřív, než mu dojde).

## 2. Co platí už teď (neměnit)
- SPZ = slabika + 2 číslice (`LA01` hráč, `KE01` rodič), `parseCode` → `druh: 'auto'` (`codes.ts`).
  **SPZ ≠ konkrétní autíčko** – přiřazení je měnitelné (README → SPZ aut, plán Garáž).
- Herní den (`den.ts`): odpočet směny 20 min začíná odemčením / vstupem zákazníka, končí uzávěrkou.
- Stojan: předvolba = plná nádrž, bargraf `stavNadrze` (do poloviny oranžová, od poloviny zelená, přetečení
  červená), benzín se platí v obchodě, 1 L ≈ 1 tečka, platit jde nejvýš 20 teček (největší karta).
- ❤️ za benzín jen od poloviny předvolby; listina 🏆, PIN `1111`, vše ostatní z README.

## 3. Pravidla (rozhodnutí rodiče 2026-11-27; čísla jsou výchozí hodnoty do dílny ✏️)
**Tempo:** spotřeba se nastaví tak, aby hráč **nemusel jen tankovat** – musí mít čas i na dofukování 🛞
a nákup 🛒. Během směny má pár aut dojít na rezervu, na 0 jen občas. Ladění čísel = TODO (Dev_notes).
### 3.1 Auta ve hře
- **Pípnutí SPZ, kterou hra ještě nezná → auto se přidá** (příjezd, zvuk, SPZ jako tabulka). Hlavně na začátku,
  ale přidat jde kdykoli (hráč přinese další autíčko). Známá SPZ se znovu nepřidá.
- Každé auto dostane při přidání **kapacitu nádrže** a **spotřebu** – náhodně z tabulky, ať se auta liší:
  - kapacita **10 / 15 / 20 L** (vejde se do jedné platby kartou; stejná čísla jako karty – hráč je zná),
  - spotřeba **malá / střední / velká** = za celou směnu (20 min) spálí cca **3 / 5 / 8 L** (výchozí odhad,
    s ohledem na tempo výše – doladí se hraním),
  - **start: nádrž na ⅔ kapacity, na začátku každého kola** (kolo jako u karet: po odemčení benzínky a po
    restartu `K000`; nový den = nové kolo, takže ráno zase ⅔).
  Spotřebu hráč **nevidí** – pozná ji jen tím, jak rychle auto ubývá (pozorování = zábava).
- Auta se pamatují v prohlížeči (`localStorage`), aby přežila obnovení stránky. Smazání / nové rozdělení
  rodičovským kódem `9…` nebo z obrazovky nádrží (dílna ✏️).

### 3.2 Ubývání benzínu
- Benzín ubývá **jen během běžící směny** (před otevřením a po zavření stojí). Rovnoměrně podle spotřeby.
- **Nepočítat v časovači po krocích** – stav se dopočítá vždy, když je potřeba:
  `stav(t) = max(0, stav₀ − spotřeba × (čas směny mezi t₀ a t))`, kde čas směny = jen úsek, kdy den byl
  `otevreno` / `zavirani`. Uložit u auta `stav₀` (setiny L) a `t₀`; při každé změně (tankování) nový `t₀`.
- **Nové kolo / nový den:** všechny nádrže zpět na ⅔ (viz 3.1).
- **Rezerva:** pod **¼ kapacity** sloupec **bliká červeně** („jede na rezervu“).
- Nádrž **0** = auto stojí (sloupec prázdný, šedé, ikona 🪫 – **ne ❌**, nic špatného se nestalo; jede s vlečkou).

### 3.3 Obrazovka stavu nádrží 🅿️
- Nová scéna `ParkovisteScene` (klíč `Parkoviste`, ikona v navigaci 🅿️, vedle ⛽).
- **Seznam aut jako bargrafy s výraznou SPZ** (rodič: hráč umí porovnávat znaky → SPZ je hlavní vodítko,
  velká a čitelná jako skutečná tabulka – bílá, černé písmo, modrý pruh, jako ve `ScanTestScene`).
  Ke každé SPZ **vodorovný sloupec nádrže** (délka = kapacita, takže větší nádrž je i delší sloupec) s čárkou
  poloviny, stejné barvy jako u stojanu (pod polovinou oranžová, nad zelená), vedle **číslo litrů**
  (čísla vždy dvakrát). Malé emoji auta (🚙 / 🚗) jen doplňkem. Sloupce se **živě zmenšují**.
- **Rezerva bliká červeně**, prázdné auto 🪫 šedé.
- **Neřadit** podle stavu – najít, komu dochází, je hráčova práce (pořadí = pořadí přidání).
- Pípnutí SPZ na této obrazovce = auto se zvýrazní (najdi ho) / přidá, je-li nové.

### 3.4 Tankování konkrétního auta
- **U stojanu pípnutí SPZ = auto přijelo** (README to plánuje): nahoře SPZ + auto, **bargraf ukazuje skutečnou
  nádrž auta**: nejdřív stav, pak přibývá natankované. **Plná nádrž = kapacita auta** (nahrazuje předvolbu
  jako „plnou“), přetečení = víc než se vejde (červená, jako dnes).
- Předvolba zůstává hráčova volba (kolik chce natankovat); hra nehlídá shodu s „kolik chybí“ – hráč si to
  odhadne z bargrafu. Pomůcka do dílny: rozdíl prázdné části bargrafu zvýraznit.
- Po zaplacení v obchodě se stav auta zvýší o natankované (nejvýš kapacita) a `t₀` = teď.
  Nezaplacený benzín (storno `K000`) auto nedostane.
- Bez pípnuté SPZ tankování funguje jako dnes („neznámé auto“).
- **Odměny (listina 🏆) zatím neladit:** ❤️ za benzín zůstává podle poloviny předvolby, i když s auty
  přestane úplně sedět. Listina je jen závěrečná informace a na průběh hry nemá vliv (rodič) → **TODO
  na postupné doladění** (Dev_notes), ne součást této úlohy.

### 3.5 Vlečka 🚛
- Auto s nádrží **0 k stojanu samo nepřijede**: pípnutí jeho SPZ u stojanu = auto se neukáže, jen 🪫 +
  zatřesení a ikona 🚛 (nápověda „potřebuje vlečku“). Žádné ❌ – není to chyba.
- **Odtah:** hráč pípne **vlečku**, pak SPZ prázdného auta → vlečka ho přiveze ke stojanu (animace:
  🚛 táhne auto). Pak se tankuje normálně. Kolikrát za den, je jedno.
- **Kód vlečky – viz oddíl 7, otázka 1** (písmeno V je obsazené vysavačem).
- Kód přidat do README → Formát kódů (tabulka) a do `parseCode` (`druh: 'vlecka'`), hlas později.
- **Kanystr ⛽🧴** (hráč ho má, ale kód pro něj ve hře není) → zatím ne, WISH: dolít pár litrů prázdnému autu
  na parkovišti bez vlečky.

## 4. Co naprogramovat
### 4.1 Služba `src/services/auta.ts` (bez Phaseru, s testy)
- `Auto { spz, kapacita (setiny L), spotreba (setiny L za minutu směny), stav0, t0 }`, `Garaz` (načíst /
  uložit `localStorage` `pumpar.auta`, v testech úložiště v paměti jako u `Denik`).
- `noveKolo()` (všechny nádrže na ⅔), `naRezerve(auto)`, `pridej(spz, rng)`, `najdi(spz)`, `stav(auto, ted, den)` (dopočet jen za čas směny), `dotankuj(spz, setiny, ted)`,
  `jePrazdne`, `TABULKA_AUT` (kapacity, spotřeby – návrh do dílny).
- Čas směny mezi dvěma okamžiky: doplnit do `den.ts` funkci typu `msSmenyMezi(t0, t1)` (respektuje začátek
  směny, ukončení 🔒 i konec odpočtu). Přes víc dní: dny se nepamatují – vzít jen dnešní směnu a u auta
  při novém dni převést stav (viz 3.2).
- Testy: rovnoměrné ubývání, stop před otevřením a po zavření, nikdy pod 0, dotankování nad kapacitu =
  kapacita, opakovaný výpočet nemění výsledek (žádné „dvojí odečtení“), načtení po obnovení stránky.

### 4.2 Scény
- `ParkovisteScene` (3.3), ikona 🅿️ v `nav.ts`; listina 🏆 zůstává.
- `StationScene`: poslech `scan` → `auto` (příjezd, bargraf nádrže auta), `odtah` (3.5); `ucet.ts` si pamatuje
  SPZ auta, aby obchod po zaplacení auto dotankoval.
- `ShopScene`: po zaplacení benzínu `garaz.dotankuj(spz, …)`; deník zapíše SPZ (listina může u ⛽ ukázat SPZ).
- Přidání auta: kdekoli, kde se SPZ pípne a scéna ji jinak nepoužije (🅿️, ⛽) – ne v obchodě a ne u dveří.

## 5. Pravidla jsou zákon
Je to **nové pravidlo pro hráče** (auta mají spotřebu, odtah). Nejdřív prototyp pro rodiče, ukázka v dílně ✏️,
platí až po „orazítkování“ hráčem. Čísla (kapacity, spotřeby, start nádrže) jen v tabulce `TABULKA_AUT`.

## 6. Postup a hotovo, když
1. Služba + testy → `den.ts` čas směny → 🅿️ → stojan (SPZ, nádrž auta) → obchod (dotankování) → vlečka.
2. `npm run typecheck`, `npm test` čisté; ověřit v headless Chrome (hra se musí načíst; na testování dev server
   s `cacheDir` mimo Dropbox – `vite preview` vrací prohlížeči 404, viz Dev_notes BUG). Čas zrychlit přes
   posunutý `Date.now` nebo krátkou směnu jen v testu: pípnout `LA01`, `LA02`, `KE01` → 🅿️ tři auta na ⅔ →
   po čase různé stavy → rezerva bliká → jedno na 0 (šedé) → u stojanu SPZ prázdného = 🪫 → vlečka + SPZ = přivezeno →
   natankovat → zaplatit → 🅿️ ukazuje doplněnou nádrž.
3. Kód commitovat průběžně, README (Formát kódů: vlečka; slovo „vlečka“ do Slova hráče; nová sekce Auta se spotřebou) a Dev_notes na konci.

## 7. Otevřené otázky
1. **Kód vlečky:** písmeno kódu = první písmeno slova (učí se písmena), ale **V = vysavač**. Možnosti:
   **(a)** vlečka dostane V a číslo z vlastní řady (`V9xx`) – hlas „Vé jako vlečka“, vysavač jiná čísla;
   **(b)** jiné písmeno, např. `T` („tahač“) – nesedí na hráčovo slovo;
   **(c)** vlečka = jedna z hráčových SPZ, určená jako vlečka (měnitelné přiřazení).
   Rozhodne uživatel (případně s hráčem v dílně ✏️).
