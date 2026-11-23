// Builds the static site into dist/. No dependencies: `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const BASE = "/podcast/fra-fjoru-til-fjalls";
const ORIGIN = "https://www.skjaskot.is";
const INDEXABLE = false; // flip to true at launch, after sign-off
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
  // [icon, name, place] ordered from sea to heath
  larder: [
    ["i-igulker", "Ígulker", "Bryggjan"], ["i-scallop", "Hörpuskel", "Sjórinn"], ["i-sol", "Söl", "Fjaran"],
    ["i-kartafla", "Kartaflan", "Garðurinn"], ["i-gulrot", "Gulrót", "Garðurinn"], ["i-hundasura", "Hundasúra", "Túnið"],
    ["i-lamb", "Lamb", "Heiðin"], ["i-blodberg", "Blóðberg", "Vegkanturinn"]
  ]
};

// ---------- the old calendar ----------
const MONTHS = ["Gormánuður", "Ýlir", "Mörsugur", "Þorri", "Góa", "Einmánuður", "Harpa", "Skerpla", "Sólmánuður", "Heyannir", "Tvímánuður", "Haustmánuður"];
const PERIODS = ["okt. – nóv.", "nóv. – des.", "des. – jan.", "jan. – feb.", "feb. – mars", "mars – apríl", "apríl – maí", "maí – júní", "júní – júlí", "júlí – ágúst", "ágúst – sept.", "sept. – okt."];
// month index -> episode recorded in that month
const MONTH_EPISODES = { 0: { label: "1. þáttur", href: "/thaettir/gormanudur/", note: "sláturtíð" } };

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
SPRITE += `</defs></svg>`;
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
    s += `<path class="w${i > 5 ? " s" : ""}${i === 0 ? " on" : ""}" d="M${x0} ${y0}L${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 0 0 ${x0} ${y0}Z"/>`;
    if (labels) {
      const am = -90 + i * 30 + 15; const [lx, ly] = pol(R + 14, am); const c = Math.cos(am * Math.PI / 180);
      s += `<text x="${lx}" y="${rnd(ly + 4)}" text-anchor="${c > 0.05 ? "start" : c < -0.05 ? "end" : "middle"}"${i === 0 ? ' class="on"' : ""}>${MONTHS[i]}</text>`;
    }
  }
  s += `<use href="#m-1" x="-18" y="-18" width="36" height="36"/>`;
  return `<svg class="wheel ${cls}" viewBox="${labels ? "-205 -130 410 260" : "-98 -98 196 196"}" role="img" aria-label="Matarárið: tólf mánuðir, gormánuður merktur">${s}</svg>`;
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

// ---------- small pieces ----------
const THREAD = `<svg class="thread" viewBox="0 0 1072 40" aria-hidden="true"><path d="M8 20C120 -8 250 48 373 20S620 -8 739 20S960 48 1064 22"/><circle class="on" cx="8" cy="20" r="7"/><circle cx="373" cy="20" r="7"/><circle cx="739" cy="20" r="7"/></svg>`;
const poster = yt => `<img class="poster" src="https://i.ytimg.com/vi/${yt}/maxresdefault.jpg" data-fallback="https://i.ytimg.com/vi/${yt}/hqdefault.jpg" alt="" decoding="async"><span class="scrim"></span>`;
const mmss = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
const chapters = ep => ep.chapters.map(([s, id, title]) =>
  `<li><a class="t" href="https://youtu.be/${ep.yt}?t=${s}" data-t="${s}">${mmss(s)}</a><a class="textlink" href="#${id}">${title}</a></li>`).join("\n          ");
const larder = ep => ep.larder.map(([id, n, place]) => `<li>${ico(id)}<span class="name">${n}</span><span class="small">${place}</span></li>`).join("");
const months = (from, to) => {
  let s = "";
  for (let i = from; i < to; i++) {
    const e = MONTH_EPISODES[i];
    const inner = `<span class="label">${e ? e.label : "&nbsp;"}</span>${ico("m-" + (i + 1))}<span class="name">${MONTHS[i]}</span><span class="small">${PERIODS[i]}${e && e.note ? " · " + e.note : ""}</span>`;
    s += e ? `<a class="month has-ep" href="${BASE}${e.href}">${inner}</a>` : `<div class="month">${inner}</div>`;
    s += "\n      ";
  }
  return s;
};
const FAVICON = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'><circle cx='100' cy='100' r='96' fill='#ece7d8'/><circle cx='100' cy='100' r='88' stroke='#16302a'/><path stroke='#16302a' d='M34 142C54 134 66 150 86 142S118 134 138 142S160 150 166 142'/><path stroke='#6f8a52' d='M40 108C70 104 86 82 112 84S150 110 162 104'/><path stroke='#16302a' d='M62 74L96 44L112 60L124 48L142 70'/><circle cx='96' cy='44' r='9' fill='#b5562b'/></svg>`);

// ---------- pages ----------
const PAGES = [
  { path: "/", file: "home.html", key: "home", title: "Frá fjöru til fjalls", desc: "Hlaðvarp um fólkið á bak við íslenskan mat. Karl Petersen og Þorvarður Goði bjóða því að borðinu, einum gesti í senn." },
  { path: "/thaettir/", file: "thaettir.html", key: "ep", title: "Þættir – Frá fjöru til fjalls", desc: "Allir þættir hlaðvarpsins Frá fjöru til fjalls." },
  { path: "/thaettir/gormanudur/", file: "gormanudur.html", key: "ep", ep: EP1, title: "Gormánuður: ferðalagið hefst – Frá fjöru til fjalls", desc: "Í fyrsta þætti segja Þorvarður Goði og Karl Petersen frá því hvert ferðinni er heitið: fólkið á bak við matinn, gamla tímatalið og íslenskt hráefni." },
  { path: "/folkid/", file: "folkid.html", key: "folk", title: "Fólkið – Frá fjöru til fjalls", desc: "Gestgjafar hlaðvarpsins Frá fjöru til fjalls: Karl Petersen og Þorvarður Goði." },
  { path: "/almanak/", file: "almanak.html", key: "alm", title: "Matarárið – Frá fjöru til fjalls", desc: "Matarárið eftir gamla íslenska tímatalinu, mánuð fyrir mánuð." },
  { path: "/404.html", file: "404.html", key: "", title: "Síðan fannst ekki – Frá fjöru til fjalls", desc: "Síðan fannst ekki." }
];

const shell = read("src/shell.html");
const fill = (s, map) => { for (const k in map) s = s.split("{{" + k + "}}").join(map[k]); return s; };

function render(page) {
  const ep = page.ep || EP1;
  let body = read("src/pages/" + page.file);
  body = fill(body, {
    SCENE, THREAD,
    "WHEEL:sm": wheel("sm"), "WHEEL:lg": wheel("lg"),
    POSTER: poster(ep.yt), YT: ep.yt,
    CHAPTERS: chapters(ep), LARDER: larder(ep),
    "MONTHS:winter": months(0, 6), "MONTHS:summer": months(6, 12)
  });
  body = body.replace(/\{\{ICON:([a-z0-9-]+)(?: ([a-z0-9 -]+))?\}\}/g, (m, id, cls) => ico(id, cls));
  const cur = k => (page.key === k ? ' aria-current="page"' : "");
  let html = fill(shell, {
    BODY: body, SPRITE, FAVICON, V: VERSION,
    TITLE: page.title, DESC: page.desc,
    CANONICAL: ORIGIN + BASE + (page.path === "/404.html" ? "/" : page.path),
    ROBOTS: INDEXABLE ? "index,follow" : "noindex,nofollow",
    CUR_home: cur("home"), CUR_ep: cur("ep"), CUR_folk: cur("folk"), CUR_alm: cur("alm")
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
for (const page of PAGES) {
  const file = page.path.endsWith("/") ? join(OUT, page.path, "index.html") : join(OUT, page.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, render(page));
}
writeFileSync(join(DIST, "404.html"), render(PAGES[PAGES.length - 1]));
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
console.log(`built ${PAGES.length} pages -> dist${BASE}/ (version ${VERSION}, indexable: ${INDEXABLE})`);
