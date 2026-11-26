// Builds the static site into dist/. No dependencies: `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const BASE = "/podcast/fra-fjoru-til-fjalls";
const ORIGIN = "https://www.skjaskot.is";
const INDEXABLE = false; // flip to true at launch, after sign-off
// The trial episode with Hinrik is not for official publication: it is marked reviewOnly in the
// episode register, so a launch build (INDEXABLE) leaves out its page and every link to it.
const VERSION = Date.now().toString(36);

const read = p => readFileSync(join(ROOT, p), "utf8");
const rnd = n => Math.round(n * 100) / 100;
const pol = (r, deg) => [rnd(r * Math.cos(deg * Math.PI / 180)), rnd(r * Math.sin(deg * Math.PI / 180))];
const P = d => `<path d="${d}"/>`;

// ---------- episode data ----------
const EP1 = {
  yt: "ftuyo6oNvjE",
  // [seconds, section id, title]
  chapters: [
    [4, "kafli-folkid", "Hugmyndin"],
    [280, "kafli-land", "Hart land, ríkt borð"],
    [524, "kafli-minningar", "Minningar og ömmumatur"],
    [613, "kafli-gormanudur", "Gamla tímatalið"],
    [1182, "kafli-terroir", "Terroir"],
    [1398, "kafli-nalgun", "Nálgun fram yfir uppskrift"],
    [1651, "kafli-smultron", "Smultronstället"],
    [2001, "kafli-fram", "Fram undan"]
  ],
  // [icon, name, place in the episode, origin] ordered from sea to heath.
  // origin: q = quarter (V N A S), belt = 0 sjór, 1 fjara, 2 akur, 3 heiði, 4 fjall, at = [lon, lat],
  // off / side = where the badge and its label sit on the big map.
  // DEMO DATA: the places are examples to show the system, not confirmed sourcing from the episode.
  larder: [
    ["i-igulker", "Ígulker", "Bryggjan", { q: "A", belt: 0, where: "Austfirðir", at: [-13.5, 64.6], off: [44, 40], side: "below" }],
    ["i-scallop", "Hörpuskel", "Sjórinn", { q: "V", belt: 0, where: "Breiðafjörður", at: [-23.0, 65.25], off: [-78, -2], side: "above" }],
    ["i-sol", "Söl", "Fjaran", { q: "S", belt: 1, where: "Suðurströndin", at: [-21.05, 63.83], off: [-58, 36], side: "below" }],
    ["i-kartafla", "Kartaflan", "Garðurinn", { q: "N", belt: 2, where: "Eyjafjörður", at: [-18.05, 65.72], off: [-20, -96], side: "left" }],
    ["i-gulrot", "Gulrót", "Garðurinn", { q: "S", belt: 2, where: "Flúðir", at: [-20.33, 64.13], off: [-125, -30], side: "left" }],
    ["i-hundasura", "Hundasúra", "Túnið", { q: "V", belt: 2, where: "Vestfirðir", at: [-22.6, 65.75], off: [-66, -52], side: "above" }],
    ["i-lamb", "Lamb", "Heiðin", { q: "A", belt: 3, where: "Norðausturland", at: [-15.6, 65.55], off: [70, -46], side: "above" }],
    ["i-blodberg", "Blóðberg", "Vegkanturinn", { q: "N", belt: 4, where: "Mývatnsöræfi", at: [-16.8, 65.5], off: [6, -124], side: "above" }]
  ]
};

// Trial episode with a guest, recorded 30 Oct 2026 before episode 1. No published video yet, so
// no `yt`: the page shows an empty frame and plain chapter times. Times are the screening cut v3
// (timeline + 11 s opening) and move when the episode is cut. No confirmed origins, so no marks.
const PILOT = {
  chapters: [
    [53, "kafli-tilraun", "Tilraun við borðið"],
    [384, "kafli-leidin", "Leiðin í eldhúsið"],
    [1057, "kafli-eldhus", "Veruleikinn í eldhúsinu"],
    [1289, "kafli-kennsla", "Kennari með puttana í pottinum"],
    [3382, "kafli-eldur", "Eldur og náttúra"],
    [3850, "kafli-kartafla", "Kartaflan"],
    [4336, "kafli-brennivin", "Brennivínið og stoltið"],
    [4773, "kafli-saga", "Sagan á diskinum"],
    [5872, "kafli-skyr", "Hvað er íslenskt?"],
    [6255, "kafli-omma", "Ömmumatur úr Hrísey"]
  ],
  larder: [
    ["i-kartafla", "Kartaflan", "Eyðieyjuhráefnið"],
    ["i-hundasura", "Hundasúra", "Túnið"],
    ["i-skyr", "Skyr", "Það eina íslenska"],
    ["i-fish", "Rauðspretta", "Grilluð heil"]
  ]
};

// ---------- the episode register: the one place an episode is entered ----------
// Every page that mentions an episode is drawn from this list: the front page, the episode list,
// the almanac, the people page, the origin page and the "other episodes" block on each episode
// page. checkSite() at the end of the build refuses to write a site where one of them is missing.
// Order is release order. Adding an episode: see "Nýr þáttur" in the README.
//   n          episode number, null for an extra such as the trial episode
//   reviewOnly built only while the site is in review (INDEXABLE false), never in a launch build
//   who        what the front-page card says when there is no guest
const EPISODES = [
  { ...EP1, slug: "gormanudur", file: "gormanudur.html", n: 1, month: 0,
    tag: "1. þáttur", stamp: "Þáttur 1", open: "Opna 1. þátt", watch: "Horfa á 1. þátt", back: "Aftur í 1. þátt",
    title: "Gormánuður: ferðalagið hefst", short: "Ferðalagið hefst", length: "Um 35 mín.", cta: "Horfa og lesa",
    frame: { seed: 5, lines: 4, from: 0.52 },
    blurb: "Þorvarður Goði og Kalli setjast tveir við borðið og segja hvert ferðinni er heitið: fólkið á bak við matinn, gamla tímatalið og leitin að leynistað hvers gests.",
    desc: "Í fyrsta þætti segja Þorvarður Goði og Karl Petersen frá því hvert ferðinni er heitið: fólkið á bak við matinn, gamla tímatalið og íslenskt hráefni.",
    who: { head: "Gestgjafarnir tveir", sub: "Karl Petersen og Þorvarður Goði", href: "/folkid/" }, guests: [] },
  { ...PILOT, slug: "hinrik", file: "hinrik.html", n: null, month: 0, reviewOnly: true,
    tag: "Tilraunaþáttur", stamp: "Tilraunaþáttur", open: "Opna tilraunaþáttinn", watch: "Lesa um tilraunaþáttinn", back: "Aftur í tilraunaþáttinn",
    title: "Tilraunaþáttur: sagan á diskinum", short: "Sagan á diskinum", length: "Ekki kominn út", cta: "Lesa",
    frame: { seed: 23, lines: 5, from: 0.44 },
    blurb: "Hinrik Carl Ellertsson matreiðslukennari er fyrsti gesturinn við borðið, í tilraun sem tekin var upp á undan 1. þætti: leiðin í eldhúsið, kartaflan, hundasúran og hvers vegna skyr er það eina sem kalla má íslenskt.",
    desc: "Tilraunaþáttur með Hinriki Carli Ellertssyni matreiðslukennara: leiðin í eldhúsið, kartaflan, hundasúran og hvers vegna skyr er það eina sem kalla má íslenskt.",
    guests: [{ name: "Hinrik Carl Ellertsson", role: "Matreiðslukennari í MK", status: "Bíður samþykkis gests" }] }
];
const SHOWN = EPISODES.filter(e => !(e.reviewOnly && INDEXABLE));
const LATEST = [...SHOWN].reverse().find(e => e.yt) || SHOWN[0];            // the newest episode that is out
const ORIGIN_EP = SHOWN.find(e => e.larder.some(l => l[3])) || LATEST;     // the episode whose origins the map shows
const HOST_STILLS = EP1.yt;                                                 // the hosts' portraits are stills from episode 1
const epHref = e => `${BASE}/thaettir/${e.slug}/`;

// ---------- the old calendar ----------
const MONTHS = ["Gormánuður", "Ýlir", "Mörsugur", "Þorri", "Góa", "Einmánuður", "Harpa", "Skerpla", "Sólmánuður", "Heyannir", "Tvímánuður", "Haustmánuður"];
const PERIODS = ["okt. – nóv.", "nóv. – des.", "des. – jan.", "jan. – feb.", "feb. – mars", "mars – apríl", "apríl – maí", "maí – júní", "júní – júlí", "júlí – ágúst", "ágúst – sept.", "sept. – okt."];
// month index -> episodes recorded in that month
const MONTH_NOTES = { 0: "sláturtíð" };
const MONTH_EPISODES = {};
for (const e of SHOWN) (MONTH_EPISODES[e.month] ||= []).push({ label: e.tag, href: `/thaettir/${e.slug}/` });

// ---------- icons (48 x 48, single-weight line) ----------
const fish = P("M5 24C12 14 27 13 35 24C27 35 12 34 5 24Z") + P("M35 24L44 16V32Z") + `<circle cx="13" cy="22" r="1"/>` + P("M19 18.5q3.5 5.5 0 11");
let thyme = P("M24 43V12");
for (const y of [36, 28, 20]) thyme += P(`M24 ${y}q-8 -1 -9 -7q8 0 9 7`) + P(`M24 ${y}q8 -1 9 -7q-8 0 -9 7`);
thyme += `<circle cx="24" cy="8.5" r="2.5"/><circle cx="18.5" cy="12" r="2"/><circle cx="29.5" cy="12" r="2"/>`;
let urchin = `<circle cx="24" cy="24" r="8"/>`;
for (let k = 0; k < 16; k++) { const [a, b] = pol(10.5, k * 22.5), [c, d] = pol(k % 2 ? 16.5 : 19.5, k * 22.5); urchin += P(`M${24 + a} ${24 + b}L${24 + c} ${24 + d}`); }
let frost = "";
for (let k = 0; k < 6; k++) {
  const ang = k * 60 - 90; const [x, y] = pol(18, ang); const [bx, by] = pol(11, ang);
  const [l1, l2] = pol(5.5, ang - 45), [r1, r2] = pol(5.5, ang + 45);
  frost += P(`M24 24L${24 + x} ${24 + y}`) + P(`M${rnd(24 + bx + l1)} ${rnd(24 + by + l2)}L${24 + bx} ${24 + by}L${rnd(24 + bx + r1)} ${rnd(24 + by + r2)}`);
}
let sun = `<circle cx="24" cy="24" r="8"/>`;
for (let k = 0; k < 8; k++) { const [a, b] = pol(12.5, k * 45), [c, d] = pol(19, k * 45); sun += P(`M${24 + a} ${24 + b}L${24 + c} ${24 + d}`); }
let fold = `<circle cx="24" cy="24" r="17.5"/><circle cx="24" cy="24" r="6"/>`;
for (let k = 0; k < 8; k++) { const [a, b] = pol(6, k * 45 + 22.5), [c, d] = pol(17.5, k * 45 + 22.5); fold += P(`M${24 + a} ${24 + b}L${24 + c} ${24 + d}`); }

const ICONS = {
  // ingredients
  "i-fish": fish,
  "i-scallop": P("M10 25A14 14 0 0 1 38 25L28 38H20Z") + P("M24 38L13.5 17M24 38L18.5 12.5M24 38V11M24 38L29.5 12.5M24 38L34.5 17") + P("M20 38v4h8v-4"),
  "i-sol": P("M24 43C20 35 28 31 24 23C21 17 26 12 24 6") + P("M24 43C16 37 18 31 13 27C10 24 12 19 9 14") + P("M24 43C32 37 30 31 35 27C38 24 36 19 39 14"),
  "i-blodberg": thyme,
  "i-hundasura": P("M24 5C32 13 34 23 30 29L36 35L24 31L12 35L18 29C14 23 16 13 24 5Z") + P("M24 10V44"),
  "i-kartafla": P("M9 26C7 16 18 9 28 11C38 13 43 22 39 30C35 38 20 41 14 35C11 32 9.5 29 9 26Z") + P("M16 28q2.5-2 5 0M30 21q2-1.5 4 0") + P("M27 11C27 8 28.5 6 31 5"),
  "i-gulrot": P("M21 17C24 12 32 13 34 19C35 23 33 25 31 27L10 44L21 17Z") + P("M18.5 26l5 3M15.5 33.5l4 2.5") + P("M29 14C28 9 30 6 33 4M31.5 15C34 11 38 9.5 42 10M33.5 18C37 16.5 40.5 17.5 44 20.5"),
  "i-igulker": urchin,
  "i-lamb": P("M12 32C7 32 5.5 26 9.5 23.5C8.5 18.5 14.5 15.5 18 18.5C20.5 13.5 27.5 13.5 29.5 18.5C33 17.5 36 20.5 34.5 24C37 26.5 35.5 32 31 32Z") + `<ellipse cx="39" cy="21.5" rx="3.6" ry="4.8" transform="rotate(25 39 21.5)"/>` + P("M36.5 17.5l-2.5-1.5") + P("M14 32v7M19 32v7M26 32v7M31 32v7"),
  "i-jardarber": P("M24 20C31 18 36 24 34 31C32 38 27 42 24 43C21 42 16 38 14 31C12 24 17 18 24 20Z") + P("M24 20C22 15 18 14 15 15C17 18 20 20 24 20M24 20C26 15 30 14 33 15C31 18 28 20 24 20") + P("M24 20C24 14 26 9 30 6") + `<circle cx="20" cy="27" r="0.9"/><circle cx="27.5" cy="26.5" r="0.9"/><circle cx="24" cy="32" r="0.9"/><circle cx="19.5" cy="33.5" r="0.9"/><circle cx="29" cy="33" r="0.9"/><circle cx="24" cy="38" r="0.9"/>`,
  // section marks
  "i-bord": `<circle cx="24" cy="25" r="9.5"/>` + P("M8.5 18A17.5 17.5 0 0 0 8.5 32M39.5 18A17.5 17.5 0 0 1 39.5 32M17 8.8A17.5 17.5 0 0 1 31 8.8"),
  "i-fjall": P("M4 40L18 15L24.5 25L31 12L44 40Z") + P("M14 40C19 34 29 34 35 40"),
  "i-thradur": P("M8 35C15 20 23 41 30 25S39 13 40 13") + `<circle cx="8" cy="35" r="3"/><circle cx="40" cy="13" r="3"/>`,
  "i-hnifur": P("M5 29H31V17C20 17 9 22 5 29Z") + P("M31 19H43V26H31") + `<circle cx="35" cy="22.5" r="0.9"/><circle cx="39.5" cy="22.5" r="0.9"/>`,
  "i-pottur": P("M11 21H37V34C37 38 34 41 30 41H18C14 41 11 38 11 34Z") + P("M8 21H40M5 27H11M37 27H43") + P("M20 16C20 12.5 28 12.5 28 16") + P("M18 9q2-2 0-4M24 8q2-2 0-4M30 9q2-2 0-4"),
  "i-eldur": P("M24 43C15 43 10.5 36 12.5 28.5C14 23 19 20 20 12C25 15 27.5 19.5 27.5 24C29.5 23 30.5 21 30.5 18.5C35.5 23.5 37.5 30 35.5 35.5C34 40 29.5 43 24 43Z") + P("M24 43C20 43 18.5 39 20.5 36C22 34 24 32.5 24 29.5C27 31.5 29.5 35 28.5 39C28 41.5 26 43 24 43Z"),
  "i-staup": P("M15 11H33L30 40H18Z") + P("M16.4 25H31.6"),
  "i-skyr": P("M7 24H41C41 34 34 40.5 24 40.5C14 40.5 7 34 7 24Z") + P("M13 24C14 18.5 20 16 25 19C28.5 16.5 33 19 34 24") + P("M30 21L40 6"),
  "i-gaffall": P("M24 44V22") + P("M16.5 5V15C16.5 19.5 19.5 22 24 22C28.5 22 31.5 19.5 31.5 15V5M24 5V15"),
  // months, gormánuður first
  "m-1": P("M31 41C15 41 8 27 16 16C24 6 41 10 41 24C41 33 32 37 27 33C23 30 24 23 29.5 23"),
  "m-2": frost,
  "m-3": P("M9 26H37C37 34 31 38 23 38C15 38 9 34 9 26Z") + P("M37 28h6") + P("M23 22C19 18 23 14 23 9C26 14 27 18 23 22Z"),
  "m-4": P("M6 21H42L37 35H11Z") + P("M13 21q3.5-7 7 0M21 21q3.5-8 7 0M29 21q3-6 6 0"),
  "m-5": P("M5 33C15 29 30 37 43 31") + P("M13 31.5A11 11 0 0 1 35 33") + P("M24 14V9M12.5 19l-3.5-3.5M35.5 19.5l3.5-3.5"),
  "m-6": fish,
  "m-7": P("M24 43V17") + P("M24 30C14 28 11 18 13 13C21 15 25 22 24 30Z") + P("M24 23C34 21 37 11 35 6C27 8 23 15 24 23Z"),
  "m-8": P("M24 5C32 15 36 25 36 31C36 38 30.5 43 24 43C17.5 43 12 38 12 31C12 25 16 15 24 5Z") + `<circle cx="20" cy="30" r="1"/><circle cx="27" cy="35" r="1"/><circle cx="26" cy="24" r="1"/>`,
  "m-9": sun,
  "m-10": P("M24 5V30M9 30H39M9 30v9M16.5 30v9M24 30v9M31.5 30v9M39 30v9"),
  "m-11": P("M8 10C20 12 30 18 38 30") + P("M17 12.5v6M27 18.5v6M35 26v6") + `<circle cx="17" cy="22" r="3.5"/><circle cx="27" cy="28" r="3.5"/><circle cx="35" cy="35.5" r="3.5"/>` + P("M12 10.5C13 6 17 5 20 6C19 10 16 12 12 10.5Z"),
  "m-12": fold
};
let SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>`;
for (const id in ICONS) SPRITE += `<symbol id="${id}" viewBox="0 0 48 48">${ICONS[id]}</symbol>`;
SPRITE += `{{LAND_DEFS}}</defs></svg>`;
const ico = (id, cls) => {
  if (!ICONS[id]) throw new Error("unknown icon " + id);
  return `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 48 48" aria-hidden="true"><use href="#${id}"/></svg>`;
};

// ---------- year wheel: twelve wedges, the current episode's month lit ----------
const wheel = (cls) => {
  const labels = cls === "lg";
  const R = 92, r = 46, gap = 2.5; let s = "";
  for (let i = 0; i < 12; i++) {
    const a0 = -90 + i * 30 + gap / 2, a1 = -90 + (i + 1) * 30 - gap / 2;
    const [x0, y0] = pol(r, a0), [x1, y1] = pol(R, a0), [x2, y2] = pol(R, a1), [x3, y3] = pol(r, a1);
    s += `<path class="w${i > 5 ? " s" : ""}${i === LATEST.month ? " on" : ""}" d="M${x0} ${y0}L${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 0 0 ${x0} ${y0}Z"/>`;
    if (labels) {
      const am = -90 + i * 30 + 15; const [lx, ly] = pol(R + 14, am); const c = Math.cos(am * Math.PI / 180);
      s += `<text x="${lx}" y="${rnd(ly + 4)}" text-anchor="${c > 0.05 ? "start" : c < -0.05 ? "end" : "middle"}"${i === LATEST.month ? ' class="on"' : ""}>${MONTHS[i]}</text>`;
    }
  }
  s += `<use href="#m-${LATEST.month + 1}" x="-18" y="-18" width="36" height="36"/>`;
  return `<svg class="wheel ${cls}" viewBox="${labels ? "-205 -130 410 260" : "-98 -98 196 196"}" role="img" aria-label="Matarárið: tólf mánuðir, ${MONTHS[LATEST.month].toLowerCase()} merktur">${s}</svg>`;
};

// ---------- front page scene: the land in cross-section, shore to summit ----------
const wave = (y, n) => { let d = `M0 ${y}`; for (let k = 0; k < n; k++) d += "q10 -6 20 0"; return `<path class="c1" d="${d}"/>`; };
let SCENE = `<svg class="scene" viewBox="0 0 760 420" preserveAspectRatio="xMaxYMax meet" role="img" aria-label="Þversnið af landinu frá fjöru til fjalls">`;
SCENE += wave(338, 9) + wave(352, 8) + wave(366, 6);
SCENE += `<path class="c1" d="M300 330C372 300 420 280 462 248C500 218 520 176 556 140C568 128 578 120 588 112L606 130L622 118L652 156C680 190 716 208 760 216"/>`;
SCENE += `<path class="c2" d="M410 350C462 322 500 296 530 262C556 232 572 204 596 184L612 198L628 190C660 224 704 244 760 250"/>`;
SCENE += `<path class="c1" d="M520 372C566 344 596 312 624 290C668 304 716 316 760 318"/>`;
SCENE += `<path class="t1" d="M150 322C215 318 250 306 300 290C360 270 392 250 430 226C476 197 498 150 540 108C556 92 566 80 580 66L604 92L622 74L664 128C690 160 720 178 760 186"/>`;
SCENE += `<circle class="dot" cx="580" cy="66" r="5"/>`;
SCENE += `<use href="#i-fish" x="40" y="296" width="36" height="36"/><use href="#i-sol" x="188" y="284" width="34" height="34"/><use href="#i-kartafla" x="328" y="236" width="34" height="34"/><use href="#i-lamb" x="434" y="166" width="40" height="40"/><use href="#i-blodberg" x="492" y="104" width="34" height="34"/>`;
SCENE += `<path class="base" d="M16 394H744"/>`;
for (const [x, label] of [[70, "SJÓR"], [205, "FJARA"], [345, "AKUR"], [455, "HEIÐI"], [585, "FJALL"]]) SCENE += `<path class="base" d="M${x} 389V399"/><text x="${x}" y="414">${label}</text>`;
SCENE += `</svg>`;

// ---------- origin: the same land in plan view ----------
// Sea lines step outward from the coast and land lines step inward toward the highlands, so the map
// reads like the cross-section seen from above. The dashed lines are the four old quarters.
const GEO = JSON.parse(read("src/geo/iceland.json"));
const r1 = n => Math.round(n * 10) / 10;
const GK = Math.cos(65 * Math.PI / 180), GS = GEO.W / ((GEO.lon1 - GEO.lon0) * GK);
const pr = ([lon, lat]) => [r1((lon - GEO.lon0) * GK * GS), r1((GEO.lat1 - lat) * GS)];
const geoLine = pts => "M" + pts.map(pr).map(p => p.join(" ")).join("L");
const mid = (a, b) => [r1((a[0] + b[0]) / 2), r1((a[1] + b[1]) / 2)];
const smooth = r => { // closed ring -> quadratic curves through the midpoints
  const n = r.length; let d = "M" + mid(r[n - 1], r[0]).join(" ");
  for (let i = 0; i < n; i++) d += "Q" + r[i].join(" ") + " " + mid(r[i], r[(i + 1) % n]).join(" ");
  return d + "Z";
};
SPRITE = SPRITE.replace("{{LAND_DEFS}}", `<path id="land-s" d="${smooth(GEO.small)}"/><clipPath id="land-s-clip"><use href="#land-s"/></clipPath>`);
const BELTS = ["Sjór", "Fjara", "Akur", "Heiði", "Fjall"];
const QNAME = { V: "Vestur", N: "Norður", A: "Austur", S: "Suður" };
// Schematic boundaries of the old landsfjórðungar: Hvítá in Borgarfjörður, Hrútafjörður, Langanes,
// Jökulsá á Sólheimasandi, joined across the highlands.
const J1 = [-20.4, 64.77], HOF = [-18.8, 64.82], J2 = [-17.9, 64.7];
const HRUT = [[-21.1, 65.15], [-21.05, 65.7], [-20.9, 66.9]];
const BORG = [[-21.95, 64.55], [-23.0, 64.45], [-26, 64.3]];
const LANG = [[-15.3, 66.1], [-14.5, 66.4], [-13.0, 67]];
const SOLH = [[-18.3, 64.35], [-19.15, 63.68], [-19.4, 63.5], [-19.5, 62.9]];
const rev = a => [...a].reverse();
const QUARTER = {
  V: [J1, ...HRUT, [-26, 67], ...rev(BORG)],
  N: [J1, HOF, J2, ...LANG, ...rev(HRUT)],
  A: [J2, ...SOLH, [-12.5, 62.9], [-12.5, 67], ...rev(LANG)],
  S: [J1, ...BORG, [-26, 62.9], ...rev(SOLH), J2, HOF]
};
const BOUNDS = [[J1, ...HRUT], [J1, ...BORG], [J2, ...LANG], [J2, ...SOLH], [J1, HOF, J2]];

const originMap = ep => {
  const u = (cls, w) => `<use href="#land" class="${cls}"${w ? ` stroke-width="${w}"` : ""}/>`;
  let m = `<svg class="omap" viewBox="-100 -72 830 580" role="img" aria-label="Kort af Íslandi með gömlu fjórðungamörkunum og uppruna hráefna þáttarins">`;
  m += `<defs><path id="land" d="${smooth(GEO.land)}"/><clipPath id="land-clip"><use href="#land"/></clipPath></defs>`;
  for (const d of [30, 19, 9]) m += u("sea", 2 * d + 1.2) + u("erase", 2 * d - 1.2);
  m += u("landfill") + `<g clip-path="url(#land-clip)">`;
  for (const [d, c] of [[66, "r3"], [44, "r2"], [25, "r2"], [10, "r1"]]) m += u(c, 2 * d + 1.5) + u("erase", 2 * d - 1.5);
  for (const b of BOUNDS) m += `<path class="bound" d="${geoLine(b)}"/>`;
  m += `</g>` + u("coast");
  for (const [x, y, t, a] of [[300, -52, "NORÐUR", "middle"], [300, 492, "SUÐUR", "middle"], [-92, 219, "VESTUR", "start"], [722, 219, "AUSTUR", "end"]]) m += `<text class="dir" x="${x}" y="${y}" text-anchor="${a}">${t}</text>`;
  m += `<path class="tick" d="M300 -44v12M300 462v12M-28 215h-12M656 215h12"/>`;
  const A = pr([-20.3, 63.42]), B = pr([-18.8, 64.8]);
  m += `<path class="red" d="M${A[0]} ${A[1]}L${B[0]} ${B[1]}"/><circle class="knot on" cx="${A[0]}" cy="${A[1]}" r="5"/><circle class="knot" cx="${B[0]}" cy="${B[1]}" r="5"/>`;
  m += `<text class="ab" x="${A[0] + 12}" y="${A[1] + 5}">A</text><text class="ab" x="${B[0] + 12}" y="${B[1] + 5}">B</text>`;
  for (const [id, name, , o] of ep.larder.filter(l => l[3])) {
    const [x, y] = pr(o.at), [dx, dy] = o.off, cx = r1(x + dx), cy = r1(y + dy), L = Math.hypot(dx, dy);
    m += `<path class="lead" d="M${x} ${y}L${r1(cx - dx / L * 21)} ${r1(cy - dy / L * 21)}"/><circle class="pin" cx="${x}" cy="${y}" r="4.5"/>`;
    m += `<circle class="badge" cx="${cx}" cy="${cy}" r="21"/><use class="pic" href="#${id}" x="${r1(cx - 15)}" y="${r1(cy - 15)}" width="30" height="30"/>`;
    const [tx, ty, an] = o.side === "below" ? [cx, cy + 37, "middle"] : o.side === "above" ? [cx, cy - 28, "middle"] : o.side === "right" ? [cx + 28, cy + 4, "start"] : [cx - 28, cy + 4, "end"];
    m += `<text class="nm" x="${tx}" y="${r1(ty)}" text-anchor="${an}">${name.toUpperCase()}</text>`;
  }
  return m + `</svg>`;
};
// The cross-section A–B: the front-page scene, flatter, with the five belts named.
const profile = () => {
  let v = `<svg class="profile" viewBox="0 0 760 250" role="img" aria-label="Þversnið A–B frá fjöru til fjalls">`;
  v += wave(188, 8).replace("M0", "M30") + wave(200, 7).replace("M0", "M30") + wave(212, 5).replace("M0", "M30");
  v += `<path class="c1" d="M300 196C380 178 440 166 500 138C552 114 590 84 628 62L646 76L662 66C690 96 722 110 760 116"/>`;
  v += `<path class="c2" d="M420 212C480 196 530 176 580 148C612 130 634 112 650 104L664 114L678 108C704 130 730 140 760 144"/>`;
  v += `<path class="t1" d="M150 184C210 182 256 174 310 160C380 142 430 128 486 100C540 73 574 44 612 22L634 42L650 28C676 62 716 84 760 92"/>`;
  v += `<circle class="dot" cx="612" cy="22" r="5"/>`;
  for (const [x, y, id] of [[52, 144, "i-scallop"], [198, 138, "i-sol"], [366, 100, "i-kartafla"], [520, 44, "i-lamb"], [660, 0, "i-blodberg"]]) v += `<use href="#${id}" x="${x}" y="${y}" width="36" height="36"/>`;
  v += `<path class="base" d="M16 226H744"/>`;
  [70, 215, 385, 540, 668].forEach((x, i) => { v += `<path class="base" d="M${x} 221V231"/><text x="${x}" y="246">${BELTS[i].toUpperCase()}</text>`; });
  v += `<circle class="knot on" cx="16" cy="226" r="5"/><circle class="knot" cx="744" cy="226" r="5"/><text class="ab" x="10" y="212">A</text><text class="ab" x="738" y="212">B</text>`;
  return v + `</svg>`;
};
// The mark: small map with the quarter shaded and a pin, plus five steps with the belt filled.
const miniMap = o => {
  const [x, y] = pr(o.at);
  return `<svg class="mini" viewBox="-14 -12 628 456" aria-hidden="true"><g clip-path="url(#land-s-clip)"><path class="mfill" d="M-20 -20H640V470H-20Z"/><path class="mlit" d="${geoLine(QUARTER[o.q])}Z"/></g><use class="mcoast" href="#land-s"/><circle class="mpin" cx="${x}" cy="${y}" r="26"/></svg>`;
};
const ladder = belt => {
  let l = `<svg class="ladder" viewBox="0 0 74 44" aria-hidden="true">`;
  for (let i = 0; i < 5; i++) { const h = 8 + i * 8; l += `<rect${i === belt ? ' class="on"' : ""} x="${i * 15 + 1}" y="${43 - h}" width="11" height="${h}"/>`; }
  return l + `</svg>`;
};
const rose = q => {
  const R = 30, r = 10; let o = `<svg class="rose" viewBox="-40 -40 80 80" aria-hidden="true">`;
  ["N", "A", "S", "V"].forEach((d, i) => {
    const a0 = -135 + i * 90 + 4, a1 = -45 + i * 90 - 4; const [x0, y0] = pol(r, a0), [x1, y1] = pol(R, a0), [x2, y2] = pol(R, a1), [x3, y3] = pol(r, a1);
    o += `<path${d === q ? ' class="on"' : ""} d="M${x0} ${y0}L${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 0 0 ${x0} ${y0}Z"/>`;
  });
  return o + `<path class="north" d="M0 -40v7"/></svg>`;
};
const mark = o => `<span class="mark" role="img" aria-label="Uppruni: ${QNAME[o.q]}, ${BELTS[o.belt].toLowerCase()}">${miniMap(o)}${ladder(o.belt)}</span><span class="label code">${QNAME[o.q]} · ${BELTS[o.belt]}</span>`;
const origins = ep => ep.larder.filter(l => l[3]).map(([id, n, , o]) => `<li class="card origin">
        <div class="origin-top">${ico(id)}<div><h3>${n}</h3><p class="small">${o.where}</p></div></div>
        ${mark(o)}
      </li>`).join("\n      ");

// ---------- small pieces ----------
const THREAD = `<svg class="thread" viewBox="0 0 1072 40" aria-hidden="true"><path d="M8 20C120 -8 250 48 373 20S620 -8 739 20S960 48 1064 22"/><circle class="on" cx="8" cy="20" r="7"/><circle cx="373" cy="20" r="7"/><circle cx="739" cy="20" r="7"/></svg>`;
const poster = yt => !yt ? "" : `<img class="poster" src="https://i.ytimg.com/vi/${yt}/maxresdefault.jpg" data-fallback="https://i.ytimg.com/vi/${yt}/hqdefault.jpg" alt="" decoding="async"><span class="scrim"></span>`;
const pad = n => String(n).padStart(2, "0");
const mmss = s => s < 3600 ? pad(Math.floor(s / 60)) + ":" + pad(s % 60) : Math.floor(s / 3600) + ":" + pad(Math.floor(s % 3600 / 60)) + ":" + pad(s % 60);
const chapters = ep => ep.chapters.map(([s, id, title]) =>
  `<li>${ep.yt ? `<a class="t" href="https://youtu.be/${ep.yt}?t=${s}" data-t="${s}">${mmss(s)}</a>` : `<span class="t">${mmss(s)}</span>`}<a class="textlink" href="#${id}">${title}</a></li>`).join("\n          ");
const larder = ep => ep.larder.map(([id, n, place, o]) => `<li>${ico(id)}<span class="name">${n}</span><span class="small">${place}</span>${o ? mark(o) : ""}</li>`).join("");
const months = (from, to) => {
  let s = "";
  for (let i = from; i < to; i++) {
    const eps = MONTH_EPISODES[i] || [], note = MONTH_NOTES[i];
    const label = eps.length > 1 ? eps.length + " þættir" : eps.length ? eps[0].label : "&nbsp;";
    const inner = `<span class="label">${label}</span>${ico("m-" + (i + 1))}<span class="name">${MONTHS[i]}</span><span class="small">${PERIODS[i]}${note ? " · " + note : ""}</span>`;
    // One episode: the whole cell is the link. Several: the cell lists them.
    if (eps.length === 1) s += `<a class="month has-ep" href="${BASE}${eps[0].href}">${inner}</a>`;
    else if (eps.length) s += `<div class="month has-ep">${inner}<span class="eps">${eps.map(e => `<a class="textlink" href="${BASE}${e.href}">${e.label}</a>`).join("")}</span></div>`;
    else s += `<div class="month">${inner}</div>`;
    s += "\n      ";
  }
  return s;
};
// ---------- blocks drawn from the episode register ----------
const epCard = (e, label) => `<div class="two">
      <a class="frame r16x9 film" href="${epHref(e)}" aria-label="${e.open}">
        <canvas class="contours" data-seed="${e.frame.seed}" data-lines="${e.frame.lines}" data-from="${e.frame.from}" aria-hidden="true"></canvas>${poster(e.yt)}
        <span class="frame-words">
          <span class="label stamp"><i></i>${e.stamp} · ${MONTHS[e.month]}</span>
          <span class="title">${e.short}</span>
        </span>
      </a>
      <div class="stack gap-2">
        ${label}
        <h2><a href="${epHref(e)}">${e.title}</a></h2>
        <p>${e.blurb}</p>
        <p><a class="textlink" href="${epHref(e)}">${e.cta}</a></p>
      </div>
    </div>`;
const EP_LIST = SHOWN.map(e => `<section class="section">
    ${epCard(e, `<p class="label stamp"><i></i>${e.tag} · ${MONTHS[e.month]} · ${e.length}</p>`)}
  </section>`).join("\n  ");
const LATEST_CARD = epCard(LATEST, `<p class="label" id="h-nyjast">Nýjasti þátturinn</p>`);
// Front page: the two newest episodes by who sits at the table, then what comes next.
const HOME_CARDS = (() => {
  const cards = SHOWN.slice(-2).map(e => e.guests.length
    ? `<div class="card"><p class="label">${e.tag}</p><h3><a href="${epHref(e)}">${e.guests.map(g => g.name).join(" og ")}</a></h3><p class="muted">${e.guests[0].role}</p></div>`
    : `<div class="card"><p class="label">${e.tag}</p><h3><a href="${BASE}${e.who.href}">${e.who.head}</a></h3><p class="muted">${e.who.sub}</p></div>`);
  let next = Math.max(0, ...SHOWN.map(e => e.n || 0)) + 1;
  const guestOut = SHOWN.some(e => e.n && e.guests.length);
  const teasers = [[guestOut ? "Næsti gestur" : "Fyrsti gesturinn", "Áskrifendur fréttabréfsins fá vísbendinguna fyrst."], ["Sá sem gesturinn mælir með", "Hver gestur bendir á þann næsta."]];
  while (cards.length < 3) { const [h, p] = teasers.shift(); cards.push(`<div class="card empty"><p class="label">${next++}. þáttur</p><h3>${h}</h3><p>${p}</p></div>`); }
  return cards.join("\n      ");
})();
const FOLK_EPISODES = SHOWN.map(e => `<div class="card">
          <p class="label stamp"><i></i>${e.tag} · ${MONTHS[e.month]}</p>
          <h3><a href="${epHref(e)}">${e.title}</a></h3>
          <p><a class="textlink" href="${epHref(e)}">${e.cta}</a></p>
        </div>`).join("\n        ");
const GUESTS = SHOWN.flatMap(e => e.guests.map(g => `<div class="card">
          <p class="label stamp"><i></i>${e.tag} · ${MONTHS[e.month]}</p>
          <h3><a href="${epHref(e)}">${g.name}</a></h3>
          <p class="muted">${g.role}</p>
          ${g.status ? `<div><span class="status">${g.status}</span></div>` : ""}
        </div>`)).join("\n        ");
const otherEpisodes = ep => {
  const rest = SHOWN.filter(e => e !== ep);
  return !rest.length ? "" : `<div class="aside-block">
        <p class="label">Aðrir þættir</p>
        ${rest.map(e => `<p><a class="textlink" href="${epHref(e)}">${e.title}</a><br><span class="muted">${e.tag} · ${MONTHS[e.month]}</span></p>`).join("\n        ")}
      </div>`;
};
const IS_MONTHS = ["janúar", "febrúar", "mars", "apríl", "maí", "júní", "júlí", "ágúst", "september", "október", "nóvember", "desember"];
const TODAY = new Date();
const BUILD_DATE = `${TODAY.getUTCDate()}. ${IS_MONTHS[TODAY.getUTCMonth()]} ${TODAY.getUTCFullYear()}`;
const FAVICON = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'><circle cx='100' cy='100' r='96' fill='#ece7d8'/><circle cx='100' cy='100' r='88' stroke='#16302a'/><path stroke='#16302a' d='M34 142C54 134 66 150 86 142S118 134 138 142S160 150 166 142'/><path stroke='#6f8a52' d='M40 108C70 104 86 82 112 84S150 110 162 104'/><path stroke='#16302a' d='M62 74L96 44L112 60L124 48L142 70'/><circle cx='96' cy='44' r='9' fill='#b5562b'/></svg>`);

// ---------- pages ----------
const PAGES = [
  { path: "/", file: "home.html", key: "home", title: "Frá fjöru til fjalls", desc: "Hlaðvarp um fólkið á bak við íslenskan mat. Karl Petersen og Þorvarður Goði bjóða því að borðinu, einum gesti í senn." },
  { path: "/thaettir/", file: "thaettir.html", key: "ep", title: "Þættir – Frá fjöru til fjalls", desc: "Allir þættir hlaðvarpsins Frá fjöru til fjalls." },
  ...SHOWN.map(e => ({ path: `/thaettir/${e.slug}/`, file: e.file, key: "ep", ep: e, title: `${e.title} – Frá fjöru til fjalls`, desc: e.desc })),
  { path: "/folkid/", file: "folkid.html", key: "folk", title: "Fólkið – Frá fjöru til fjalls", desc: "Gestgjafar hlaðvarpsins Frá fjöru til fjalls: Karl Petersen og Þorvarður Goði." },
  { path: "/uppruni/", file: "uppruni.html", key: "upp", title: "Uppruni – Frá fjöru til fjalls", desc: "Hvaðan kemur maturinn? Áttin á landinu og hæðin yfir sjó: kort, snið og upprunamerki hráefnanna." },
  { path: "/almanak/", file: "almanak.html", key: "alm", title: "Matarárið – Frá fjöru til fjalls", desc: "Matarárið eftir gamla íslenska tímatalinu, mánuð fyrir mánuð." },
  { path: "/404.html", file: "404.html", key: "", title: "Síðan fannst ekki – Frá fjöru til fjalls", desc: "Síðan fannst ekki." }
];

const shell = read("src/shell.html");
const fill = (s, map) => { for (const k in map) s = s.split("{{" + k + "}}").join(map[k]); return s; };

function render(page) {
  const ep = page.ep || LATEST;
  let body = read("src/pages/" + page.file);
  body = fill(body, {
    SCENE, THREAD, EP_LIST, LATEST_CARD, HOME_CARDS, FOLK_EPISODES, GUESTS,
    OTHER_EPISODES: otherEpisodes(page.ep), HOST_STILLS,
    LATEST_HREF: epHref(LATEST), LATEST_WATCH: LATEST.watch,
    ORIGIN_EP_LABEL: `${ORIGIN_EP.tag} · ${MONTHS[ORIGIN_EP.month]}`, ORIGIN_EP_HREF: epHref(ORIGIN_EP), ORIGIN_EP_BACK: ORIGIN_EP.back,
    "WHEEL:sm": wheel("sm"), "WHEEL:lg": wheel("lg"),
    POSTER: poster(ep.yt), YT: ep.yt || "",
    CHAPTERS: chapters(ep), LARDER: larder(ep),
    MAP: originMap(ORIGIN_EP), PROFILE: profile(), ORIGINS: origins(ORIGIN_EP), "ROSE": rose("V"), "LADDER": ladder(1),
    "MONTHS:winter": months(0, 6), "MONTHS:summer": months(6, 12)
  });
  body = body.replace(/\{\{ICON:([a-z0-9-]+)(?: ([a-z0-9 -]+))?\}\}/g, (m, id, cls) => ico(id, cls));
  const cur = k => (page.key === k ? ' aria-current="page"' : "");
  let html = fill(shell, {
    BODY: body, SPRITE, FAVICON, V: VERSION, BUILD_DATE,
    TITLE: page.title, DESC: page.desc,
    CANONICAL: ORIGIN + BASE + (page.path === "/404.html" ? "/" : page.path),
    ROBOTS: INDEXABLE ? "index,follow" : "noindex,nofollow",
    CUR_home: cur("home"), CUR_ep: cur("ep"), CUR_folk: cur("folk"), CUR_upp: cur("upp"), CUR_alm: cur("alm")
  });
  html = fill(html, { BASE });
  const left = html.match(/\{\{[A-Za-z_:0-9 -]+\}\}/);
  if (left) throw new Error(page.file + ": unresolved token " + left[0]);
  return html;
}

// ---------- write dist/ ----------
const DIST = join(ROOT, "dist");
const OUT = join(DIST, BASE);
rmSync(DIST, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
if (existsSync(join(ROOT, "public"))) cpSync(join(ROOT, "public"), OUT, { recursive: true });
const BUILT = {};
for (const page of PAGES) BUILT[page.path] = render(page);

// ---------- consistency check: an episode is on every page that should carry it, or the build fails ----------
function checkSite() {
  const err = [];
  const need = ["slug", "file", "tag", "stamp", "open", "watch", "back", "title", "short", "length", "cta", "blurb", "desc", "frame", "chapters", "larder", "guests"];
  for (const e of EPISODES) {
    for (const k of need) if (e[k] === undefined || e[k] === "") err.push(`${e.slug || "?"}: vantar "${k}" í þáttaskrána`);
    if (!e.guests?.length && !e.who) err.push(`${e.slug}: hvorki gestur né "who" fyrir forsíðuspjaldið`);
    if (!(e.month >= 0 && e.month < 12)) err.push(`${e.slug}: mánuður utan 0–11`);
    else if (e.month !== 0) err.push(`${e.slug}: ${MONTHS[e.month]} á engan lit enn. --month í site.css er fastur á gormánuði; bættu við lit mánaðarins áður en þátturinn fer inn`);
    if (EPISODES.filter(x => x.slug === e.slug).length > 1) err.push(`${e.slug}: slóðin er tvítekin`);
  }
  const link = e => `${BASE}/thaettir/${e.slug}/"`;
  const everywhere = [["/thaettir/", "þáttalistann"], ["/almanak/", "almanakið"], ["/folkid/", "Fólkið"]];
  for (const e of SHOWN) {
    const own = BUILT[`/thaettir/${e.slug}/`];
    if (!own) { err.push(`${e.slug}: síðan var ekki byggð`); continue; }
    for (const [, id, title] of e.chapters) if (!own.includes(`id="${id}"`)) err.push(`${e.slug}: kaflinn "${title}" (#${id}) er ekki í texta síðunnar`);
    for (const [path, name] of everywhere) if (!BUILT[path].includes(link(e))) err.push(`${e.slug}: vantar í ${name} (${path})`);
    for (const o of SHOWN) if (o !== e && !BUILT[`/thaettir/${o.slug}/`]?.includes(link(e))) err.push(`${e.slug}: vantar í „Aðrir þættir“ á síðu ${o.slug}`);
    for (const g of e.guests) if (!BUILT["/folkid/"].includes(g.name)) err.push(`${e.slug}: gesturinn ${g.name} er ekki á Fólkið`);
  }
  if (!BUILT["/"].includes(link(LATEST))) err.push(`forsíðan vísar ekki á nýjasta þáttinn (${LATEST.slug})`);
  for (const e of SHOWN.slice(-2)) if (!BUILT["/"].includes(e.tag)) err.push(`${e.slug}: vantar á forsíðuspjöldin`);
  for (const e of EPISODES.filter(e => !SHOWN.includes(e)))
    for (const path in BUILT) {
      if (BUILT[path].includes(`/thaettir/${e.slug}/`)) err.push(`${e.slug}: á ekki að sjást í útgáfu en er á ${path}`);
      for (const g of e.guests) if (BUILT[path].includes(g.name)) err.push(`${e.slug}: nafn gestsins ${g.name} er á ${path} í útgáfu`);
    }
  if (err.length) throw new Error("Samræmisathugun féll:\n  - " + err.join("\n  - "));
  return `${SHOWN.length} ${SHOWN.length === 1 ? "þáttur" : "þættir"} á ${Object.keys(BUILT).length} síðum`;
}
const CHECK = checkSite();

for (const page of PAGES) {
  const file = page.path.endsWith("/") ? join(OUT, page.path, "index.html") : join(OUT, page.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, BUILT[page.path]);
}
writeFileSync(join(DIST, "404.html"), BUILT["/404.html"]);
writeFileSync(join(OUT, "site.css"), read("src/site.css"));
writeFileSync(join(OUT, "site.js"), read("src/site.js"));
writeFileSync(join(DIST, "_redirects"), [
  `/ ${BASE}/ 302`,
  `/podcast ${BASE}/ 302`,
  `/podcast/ ${BASE}/ 302`
].join("\n") + "\n");
writeFileSync(join(DIST, "_headers"), [
  "/*",
  ...(INDEXABLE ? [] : ["  X-Robots-Tag: noindex, nofollow"]),
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: strict-origin-when-cross-origin"
].join("\n") + "\n");
console.log(`built ${PAGES.length} pages -> dist${BASE}/ (version ${VERSION}, indexable: ${INDEXABLE})\nsamræmi: ${CHECK}`);
