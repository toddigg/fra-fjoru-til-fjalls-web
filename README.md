# Frá fjöru til fjalls — vefur

Vefur hlaðvarpsins *Frá fjöru til fjalls* (Skjáskot). Kyrrstæðar síður, byggðar með einu Node-skripti og birtar sem Cloudflare Worker með static assets.

- Slóð: `/podcast/fra-fjoru-til-fjalls/` (sama slóð á prufuslóð og á skjaskot.is)
- Prufa: https://fra-fjoru-til-fjalls.toddigodi.workers.dev/podcast/fra-fjoru-til-fjalls/
- Worker: `fra-fjoru-til-fjalls`

## Uppbygging

| Skrá | Hlutverk |
| --- | --- |
| `build.mjs` | Byggir `dist/`. Teiknar táknin, árshringinn og landsniðið; fyllir sniðmát. |
| `src/shell.html` | Rammi allra síðna: haus, valmynd, fótur. |
| `src/pages/*.html` | Efni hverrar síðu. |
| `src/site.css`, `src/site.js` | Útlit og hegðun. |
| `public/` | Skrár sem fara óbreyttar á vefinn (ljósmyndir o.fl.) undir `/podcast/fra-fjoru-til-fjalls/`. |
| `wrangler.jsonc` | Stillingar fyrir Cloudflare. |

## Að byggja

```
node build.mjs
```

Engar npm-háðir. Úttakið fer í `dist/`, sem er ekki í git.

## Birting

Push á `main` byggir og birtir sjálfkrafa þegar repóið er tengt Workernum í Cloudflare (Workers Builds).

Stillingar í Cloudflare (Settings → Builds):

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Workers Builds keyrir ekki `build`-skipunina í `wrangler.jsonc`, svo Build command verður að vera stillt í Cloudflare. Hún í `wrangler.jsonc` er fyrir `wrangler dev` og `wrangler deploy` á eigin vél.

## Reglur

- Síðurnar eru merktar `noindex` þar til `INDEXABLE` er sett á `true` í `build.mjs`.
- Texti um þætti er unninn upp úr samtalinu sjálfu og bíður yfirferðar Karls Petersen áður en hann fer í loftið.
- Tenging við `skjaskot.is/podcast*` er sérstakt skref sem bíður samþykkis.
