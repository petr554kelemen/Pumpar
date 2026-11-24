import Phaser from 'phaser';
import { bus, type GameEvents } from '../services/eventBus.ts';
import * as beep from '../services/beep.ts';
import { type Disk, type KoloId, type StavKola, cenaKola, cenaVyberu, noveAuto } from '../services/air.ts';
import { penezenka } from '../services/penezenka.ts';
import { KARTY, type KartaNaObrazovce, PanelKaret, krizek } from './kartyPanel.ts';
import { addNav, type SceneKey } from './nav.ts';

const ZLUTA = 0xf1c40f;
/** Barvy disků (cena podle barvy – viz air.ts): ráfek a paprsky. */
const BARVA_DISKU: Readonly<Record<Disk, { rafek: number; paprsky: number }>> = {
  modry: { rafek: 0x3498db, paprsky: 0x1b4f72 },
  cerveny: { rafek: 0xe74c3c, paprsky: 0x78281f },
  zeleny: { rafek: 0x2ecc71, paprsky: 0x145a32 },
};

/** Plánek auta ze shora; kola v rozích nakreslená z boku (kulatá s ráfkem), aby bylo vidět splasknutí. */
/** Střed plochy stání; auto s vozíkem stojí výš, aby se vozík vešel. */
const AUTO = { x: 430, y: 395 };
const Y_S_VOZIKEM = 305;
const R_KOLA = 42;
/** Pozice kol vůči středu karoserie; vozík je za autem na oji. */
const KOLO_POZICE: Readonly<Record<KoloId, { x: number; y: number }>> = {
  LP: { x: -138, y: -105 },
  PP: { x: 138, y: -105 },
  LZ: { x: -138, y: 105 },
  PZ: { x: 138, y: 105 },
  LV: { x: -128, y: 275 },
  PV: { x: 128, y: 275 },
};

interface Kolo {
  id: KoloId;
  obal: Phaser.GameObjects.Container;
  g: Phaser.GameObjects.Graphics;
  ramecek: Phaser.GameObjects.Graphics;
  podhustene: boolean;
  disk: Disk;
  vybrane: boolean;
  /** Zaplacené a hotové (dofouknuté nebo zkontrolované) – ukazuje ✅. */
  zkontrolovane: boolean;
  /** 0 = splasklé (rozplácnuté), 1 = plné. */
  plnost: number;
  napoveda: Phaser.GameObjects.Arc[];
}

type Stav = 'vyber' | 'placeni' | 'odjezd';

// Dofukování kol (nápad hráče): auto jako plánek ze shora, kola z boku – splasklé má dole plošku.
// Cena dofouknutí podle barvy disku (modrý 2, červený 3, zelený 5), kontrola plného kola 1.
// Hráč vybere kola, zaplatí jednou peněžní kartou (stejná sada K001–K007 jako v obchodě, klepnutím nebo
// pípnutím; zůstatek společný na celý herní den). Málo teček = odmítnuto. Tečky z karty odletí ke kolům.
export class AirScene extends Phaser.Scene {
  private stav: Stav = 'vyber';
  private auto!: Phaser.GameObjects.Container;
  private kola: Kolo[] = [];
  private panel!: PanelKaret;
  private dalsiAuto!: Phaser.GameObjects.Text;

  constructor() {
    super('Air' satisfies SceneKey);
  }

  create(): void {
    this.stav = 'vyber';
    this.kola = [];
    addNav(this);

    // Světlá plocha stání (beton) – černé pneumatiky na ní jsou dobře vidět, i ploška splasklého kola.
    this.add.rectangle(AUTO.x, AUTO.y, 560, 610, 0xb3bcc4).setStrokeStyle(4, 0xd5dbe0).setName('stani');
    this.panel = new PanelKaret(this, (kn) => this.plat(kn));
    this.vytvorAuto(0);
    this.auto.y = this.cilY;

    this.dalsiAuto = this.add
      .text(780, 50, '🚗 ➡️', { fontSize: '56px', backgroundColor: '#37404c', padding: { x: 18, y: 4 } })
      .setOrigin(0.5)
      .setName('dalsi_auto')
      .setInteractive({ useHandCursor: true });
    this.dalsiAuto.on('pointerdown', () => this.zkusOdjet());

    const odhlasit = bus.on('scan', (d) => this.onScan(d));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, odhlasit);
  }

  // ---------- Auto ----------

  /** Kam auto zajede (s vozíkem výš). */
  private cilY = AUTO.y;

  private vytvorAuto(y: number): void {
    const nove = noveAuto();
    this.cilY = nove.vozik ? Y_S_VOZIKEM : AUTO.y;
    this.auto = this.add.container(AUTO.x, y).setName('auto');
    if (nove.vozik) this.auto.add(this.kresliVozik());
    const g = this.add.graphics().setName('auto_karoserie');
    // Karoserie ze shora
    g.fillStyle(0xc0392b);
    g.fillRoundedRect(-85, -165, 170, 330, 45);
    g.fillStyle(0x85c1e9);
    g.fillRoundedRect(-62, -95, 124, 50, 12); // přední sklo
    g.fillRoundedRect(-58, 70, 116, 36, 10); // zadní sklo
    g.fillStyle(0xa93226);
    g.fillRoundedRect(-62, -40, 124, 105, 14); // střecha
    g.fillStyle(0xf9e79f);
    g.fillCircle(-55, -152, 10); // světla
    g.fillCircle(55, -152, 10);
    this.auto.add(g);

    this.kola = nove.kola.map(({ id, stav }) => this.vytvorKolo(id, stav));
  }

  /** Vozík ze shora: oj a korba, kola LV/PV na jedné nápravě. */
  private kresliVozik(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setName('vozik');
    g.fillStyle(0x34495e);
    g.fillRect(-6, 160, 12, 60); // oj
    g.fillStyle(0x7f8c8d);
    g.fillRoundedRect(-85, 210, 170, 135, 10); // korba
    g.fillStyle(0x95a5a6);
    g.fillRoundedRect(-73, 222, 146, 111, 6); // ložná plocha
    return g;
  }

  private vytvorKolo(id: KoloId, { podhustene, disk }: StavKola): Kolo {
    const p = KOLO_POZICE[id];
    const g = this.add.graphics();
    const ramecek = this.add.graphics();
    const obal = this.add.container(p.x, p.y, [ramecek, g]).setName(`kolo_${id}`);
    obal.setSize(R_KOLA * 2.6, R_KOLA * 2.4).setInteractive({ useHandCursor: true });
    const kolo: Kolo = {
      id,
      obal,
      g,
      ramecek,
      podhustene,
      disk,
      vybrane: false,
      zkontrolovane: false,
      plnost: podhustene ? 0 : 1,
      napoveda: [],
    };
    obal.on('pointerdown', () => this.klepniNaKolo(kolo));
    this.auto.add(obal);
    this.kresliKolo(kolo);
    return kolo;
  }

  /** Kolo z boku. Splasklé (plnost 0) má dole plošku a boky vyboulené do stran; ráfek klesne níž. */
  private kresliKolo(k: Kolo): void {
    const t = k.plnost;
    const R = R_KOLA;
    const ploska = R * Phaser.Math.Linear(0.66, 1, t); // y spodní plošky (1 = žádná ploška)
    const boule = (1 - t) * 0.4; // vyboulení boků u země
    const body: Phaser.Math.Vector2[] = [];
    for (let a = 0; a < 360; a += 5) {
      const rad = Phaser.Math.DegToRad(a);
      const y = Math.min(Math.sin(rad) * R, ploska);
      const dole = Math.max(0, y / R); // 0 nahoře/uprostřed, 1 u země
      body.push(new Phaser.Math.Vector2(Math.cos(rad) * R * (1 + boule * dole * dole), y));
    }

    const g = k.g;
    g.clear();
    g.fillStyle(0x1b1b1b);
    g.fillPoints(body, true);
    // Ráfek s paprsky (jako 🛞); u splasklého kola klesne k zemi.
    const ry = (1 - t) * R * 0.05;
    const barva = BARVA_DISKU[k.disk];
    g.fillStyle(barva.rafek);
    g.fillCircle(0, ry, R * 0.52);
    g.lineStyle(5, barva.paprsky);
    for (let i = 0; i < 5; i++) {
      const rad = Phaser.Math.DegToRad(-90 + i * 72);
      g.lineBetween(0, ry, Math.cos(rad) * R * 0.46, ry + Math.sin(rad) * R * 0.46);
    }
    g.fillStyle(0x34495e);
    g.fillCircle(0, ry, R * 0.16);

    k.ramecek.clear();
    if (k.vybrane) {
      k.ramecek.lineStyle(5, ZLUTA);
      k.ramecek.strokeCircle(0, 0, R * (1 + boule) + 10);
    }
  }

  private klepniNaKolo(k: Kolo): void {
    if (this.stav !== 'vyber') return;
    if (k.zkontrolovane) {
      // Už hotové (✅) – není co dělat.
      beep.tick(260, 0.08);
      this.tweens.add({ targets: k.obal, scale: { from: 1.08, to: 1 }, duration: 150 });
      return;
    }
    k.vybrane = !k.vybrane;
    beep.tick(k.vybrane ? 760 : 520, 0.06);
    this.kresliKolo(k);
    this.prekresliNapovedu(k);
  }

  /** Tečky ceny vedle vybraného kola – podle barvy disku, 1 za kontrolu. Vždy zobrazené (barvy mají různé ceny). */
  private prekresliNapovedu(k: Kolo): void {
    k.napoveda.forEach((t) => t.destroy());
    k.napoveda = [];
    if (!k.vybrane) return;
    const p = KOLO_POZICE[k.id];
    const smer = Math.sign(p.x);
    const pocet = cenaKola(k);
    for (let i = 0; i < pocet; i++) {
      const t = this.add
        .circle(p.x + smer * (R_KOLA * 1.5 + 22), p.y + (i - (pocet - 1) / 2) * 26, 10, ZLUTA)
        .setStrokeStyle(2, 0xfef9e7)
        .setName(`napoveda_${k.id}_${i + 1}`);
      this.auto.add(t);
      this.tweens.add({ targets: t, scale: { from: 0, to: 1 }, duration: 180, delay: i * 60, ease: 'Back.Out' });
      k.napoveda.push(t);
    }
  }

  // ---------- Placení ----------

  private onScan({ info }: GameEvents['scan']): void {
    if (this.stav !== 'vyber' || info.druh !== 'karta') return;
    // Aktivní peněžní karta = jako klepnutí na ni. Neaktivní, služební nebo neznámá karta = kritická chyba ❌
    // (stejně jako v obchodě).
    const kn = this.panel.najdi(info.kod);
    if (kn) this.plat(kn);
    else krizek(this, KARTY.x, 360);
  }

  private plat(kn: KartaNaObrazovce): void {
    if (this.stav !== 'vyber') return;
    const vybrana = this.kola.filter((k) => k.vybrane);
    if (vybrana.length === 0) {
      // Nejdřív vybrat kola.
      beep.tick(300, 0.08);
      this.kola.filter((k) => !k.zkontrolovane).forEach((k) =>
        this.tweens.add({ targets: k.obal, scale: { from: 1.15, to: 1 }, duration: 250 }),
      );
      return;
    }

    const cena = cenaVyberu(vybrana);
    const pred = penezenka().zustatek(kn.karta.kod) ?? 0;
    if (!penezenka().zaplat(kn.karta.kod, cena).ok) {
      this.panel.odmitni(kn);
      return;
    }

    this.stav = 'placeni';
    beep.tick(880, 0.1);
    vybrana.forEach((k) => {
      k.napoveda.forEach((t) => t.destroy());
      k.napoveda = [];
    });

    // Tečky z karty odletí ke kolům (odečítání viditelně): 3 k dofukovanému, 1 ke kontrolovanému.
    const cile = vybrana.flatMap((k) => Array.from({ length: cenaKola(k) }, () => k));
    this.panel.odeberTecky(kn, pred, cena).forEach((start, i) => {
      const kolo = cile[i];
      if (!kolo) return;
      const cil = this.svetovaPozice(kolo);
      const letici = this.add.circle(start.x, start.y, 10, ZLUTA).setDepth(20);
      this.tweens.add({
        targets: letici,
        x: cil.x,
        y: cil.y,
        duration: 450,
        delay: i * 140,
        ease: 'Quad.InOut',
        onComplete: () => {
          beep.tick(600 + (i % 3) * 120, 0.05);
          letici.destroy();
        },
      });
    });

    // Číslo zůstatku se změní, až tečky doletí.
    this.time.delayedCall(cena * 140 + 450, () => this.panel.prekresli(kn));
    // Po doletu teček foukání kol jedno po druhém.
    this.time.delayedCall(cena * 140 + 500, () => this.nafoukni(vybrana, 0));
  }

  private nafoukni(kola: Kolo[], index: number): void {
    const k = kola[index];
    if (!k) {
      this.hotovo();
      return;
    }
    if (!k.podhustene) {
      // Plné kolo – jen kontrola tlaku: krátké „psst“ a ✅.
      beep.tick(2600, 0.04);
      this.tweens.add({
        targets: k.obal,
        scale: { from: 1.12, to: 1 },
        duration: 400,
        onComplete: () => {
          this.oznacHotove(k);
          this.nafoukni(kola, index + 1);
        },
      });
      return;
    }
    const stav = { t: k.plnost };
    this.tweens.add({
      targets: stav,
      t: 1,
      duration: 1300,
      ease: 'Sine.Out',
      onUpdate: () => {
        k.plnost = stav.t;
        this.kresliKolo(k);
      },
      onComplete: () => {
        k.podhustene = false;
        k.plnost = 1;
        this.oznacHotove(k);
        this.nafoukni(kola, index + 1);
      },
    });
    // Syčení vzduchu – rychlé tiché cvakání
    this.time.addEvent({ delay: 90, repeat: 13, callback: () => beep.tick(2400 + Math.random() * 600, 0.02) });
  }

  /** Kolo je zaplacené a v pořádku: zrušit výběr, cink a ✅ nad kolem. */
  private oznacHotove(k: Kolo): void {
    k.vybrane = false;
    k.zkontrolovane = true;
    this.kresliKolo(k);
    beep.tick(1320, 0.18); // cink
    const p = KOLO_POZICE[k.id];
    const fajfka = this.add
      .text(p.x, p.y - R_KOLA - 30, '✅', { fontSize: '40px', padding: { x: 6, y: 10 } })
      .setOrigin(0.5)
      .setName(`hotovo_${k.id}`);
    this.auto.add(fajfka);
    this.tweens.add({ targets: fajfka, scale: { from: 0, to: 1 }, duration: 250, ease: 'Back.Out' });
  }

  /** Po nafouknutí: zbývají-li prázdná kola, dá se doplatit; jinak oslava. */
  private hotovo(): void {
    this.stav = 'vyber';
    if (this.kola.some((k) => k.podhustene)) {
      beep.tick(700, 0.08);
      return;
    }
    beep.win();
    this.tweens.add({ targets: this.dalsiAuto, scale: { from: 0.6, to: 1 }, duration: 300, ease: 'Back.Out' });
  }

  /** S prázdným kolem se nejezdí: nad prázdnými koly zabliká ❗ a auto zůstane. */
  private zkusOdjet(): void {
    if (this.stav !== 'vyber') return;
    const prazdna = this.kola.filter((k) => k.podhustene);
    if (prazdna.length === 0) {
      this.odjed();
      return;
    }
    beep.error();
    this.tweens.add({
      targets: this.auto,
      x: { from: AUTO.x - 8, to: AUTO.x + 8 },
      duration: 70,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.auto.setX(AUTO.x),
    });
    for (const k of prazdna) {
      const p = KOLO_POZICE[k.id];
      const vykricnik = this.add
        .text(p.x, p.y - R_KOLA - 38, '❗', { fontSize: '64px', padding: { x: 8, y: 14 } })
        .setOrigin(0.5)
        .setName(`varovani_${k.id}`);
      this.auto.add(vykricnik);
      this.tweens.add({
        targets: vykricnik,
        alpha: { from: 1, to: 0.1 },
        duration: 220,
        yoyo: true,
        repeat: 3,
        onComplete: () => vykricnik.destroy(),
      });
    }
  }

  private odjed(): void {
    this.stav = 'odjezd';
    this.dalsiAuto.setVisible(false);
    beep.tick(500, 0.1);
    const stare = this.auto;
    this.tweens.add({ targets: stare, y: -700, duration: 900, ease: 'Quad.In', onComplete: () => stare.destroy() });

    this.time.delayedCall(700, () => {
      this.vytvorAuto(1100);
      this.tweens.add({
        targets: this.auto,
        y: this.cilY,
        duration: 1000,
        ease: 'Quad.Out',
        onComplete: () => {
          this.stav = 'vyber';
          this.dalsiAuto.setVisible(true);
        },
      });
    });
  }

  private svetovaPozice(k: Kolo): { x: number; y: number } {
    const p = KOLO_POZICE[k.id];
    return { x: this.auto.x + p.x, y: this.auto.y + p.y };
  }
}
