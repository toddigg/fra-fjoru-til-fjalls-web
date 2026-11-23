// Regenerates src/geo/iceland.json: Iceland's coastline, simplified for the origin map.
// Only needed if the outline should change. The site build itself has no dependencies.
//   npm i --no-save world-atlas topojson-client && node tools/geo.mjs
// Source: Natural Earth 1:10m via the world-atlas package (public domain).
import fs from "node:fs";
import { feature } from "topojson-client";
const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-10m.json", "utf8"));
const ice = feature(topo, topo.objects.countries).features.find(f => f.properties.name === "Iceland");
const polys = ice.geometry.type === "Polygon" ? [ice.geometry.coordinates] : ice.geometry.coordinates;
const area = r => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
const main = polys.map(p => p[0]).sort((a, b) => area(b) - area(a))[0];
// equirectangular, scaled at 65°N; W is the width of the drawing in SVG units
const W = 600, lon0 = -24.6, lon1 = -13.4, lat1 = 66.6, lat0 = 63.2;
const k = Math.cos(65 * Math.PI / 180), s = W / ((lon1 - lon0) * k);
const proj = ([lon, lat]) => [(lon - lon0) * k * s, (lat1 - lat) * s];
const dp = (pts, eps) => { // Douglas-Peucker
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1; const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = 0, mi = -1; const [x1, y1] = pts[a], [x2, y2] = pts[b]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs(dy * (pts[i][0] - x1) - dx * (pts[i][1] - y1)) / L; if (d > md) { md = d; mi = i; } }
    if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
};
const simplify = eps => {
  const q = main.map(proj); let fi = 0, fd = 0;
  q.forEach((pt, i) => { const d = Math.hypot(pt[0] - q[0][0], pt[1] - q[0][1]); if (d > fd) { fd = d; fi = i; } });
  return dp(q.slice(0, fi + 1), eps).concat(dp(q.slice(fi), eps).slice(1, -1)).map(([x, y]) => [Math.round(x * 2) / 2, Math.round(y * 2) / 2]);
};
const out = { source: "Natural Earth 1:10m (public domain)", W, H: Math.round((lat1 - lat0) * s), lon0, lon1, lat1, land: simplify(2.8), small: simplify(7) };
fs.writeFileSync("src/geo/iceland.json", JSON.stringify(out) + "\n");
console.log("land", out.land.length, "small", out.small.length, "H", out.H);
