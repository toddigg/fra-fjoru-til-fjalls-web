# Frá fjöru til fjalls — vefur

Vefur hlaðvarpsins *Frá fjöru til fjalls* (Skjáskot). Kyrrstæðar síður, byggðar með einu Node-skripti og birtar sem Cloudflare Worker með static assets.

- Slóð: `/podcast/fra-fjoru-til-fjalls/` (sama slóð á prufuslóð og á skjaskot.is)
- Prufa: https://fra-fjoru-til-fjalls.toddigodi.workers.dev/podcast/fra-fjoru-til-fjalls/
- Worker: `fra-fjoru-til-fjalls`

## Uppbygging

| Skrá | Hlutverk |
| --- | --- |
| `build.mjs` | Byggir `dist/`. Geymir þáttaskrána (`EPISODES`), teiknar táknin, árshringinn og landsniðið, fyllir sniðmát og keyrir samræmisathugun. |
| `src/shell.html` | Rammi allra síðna: haus, valmynd, fótur. |
| `src/pages/*.html` | Efni hverrar síðu. |
| `src/site.css`, `src/site.js` | Útlit og hegðun. |
| `src/geo/iceland.json` | Strandlína Íslands fyrir upprunakortið (Natural Earth). Endurgerð með `tools/geo.mjs`. |
| `public/` | Skrár sem fara óbreyttar á vefinn (ljósmyndir o.fl.) undir `/podcast/fra-fjoru-til-fjalls/`. |
| `wrangler.jsonc` | Stillingar fyrir Cloudflare. |

## Nýr þáttur

Þáttur er skráður á einum stað, í `EPISODES` í `build.mjs`. Forsíðan, þáttalistinn, almanakið, Fólkið, Uppruni og „Aðrir þættir“ á hverri þáttasíðu eru teiknuð upp úr þeirri skrá. Það á aldrei að handskrifa heiti, númer eða slóð þáttar inn í aðra síðu.

1. **Efnið.** Afrit úr Hreimi, yfirfarið. Texti síðunnar er unninn upp úr samtalinu sjálfu og engu bætt við. Beinar tilvitnanir eru orðréttar úr afritinu.
2. **Síðan.** Ný skrá í `src/pages/`, byggð á `gormanudur.html` (gestgjafarnir tveir) eða `hinrik.html` (þáttur með gesti). Þáttur án myndbands sleppir `{{POSTER}}` og spilunarhnappnum úr myndrammanum. Hver kafli fær `id="kafli-…"`.
3. **Skráin.** Ein færsla í `EPISODES`: slóð, skrá, númer, mánuður, heiti, stutt heiti á myndramma, lengd, ágrip, lýsing, kaflar, hráefni, gestir. `yt` bætist við þegar myndbandið er komið á YouTube; þá verður númeraður þáttur „nýjasti þátturinn“ á forsíðunni (aukaþáttur án númers, eins og tilraunaþátturinn, verður það ekki). Kaflatímar eru sekúndur inn í klippið sem er á YouTube. Myndin í rammanum kemur frá YouTube: ef þátturinn er með upphlaðna smámynd (sem ber eigin titil) er `still: 1`, `2` eða `3` sett til að nota ramma úr myndbandinu sjálfu. `reviewOnly: true` heldur þætti utan útgáfu.
4. **Byggja.** `node build.mjs`. Samræmisathugunin stöðvar bygginguna ef þátt vantar á síðu sem á að sýna hann, ef kafli í skránni er ekki í textanum, ef mánuðurinn á engan lit, eða ef `reviewOnly`-þáttur lekur inn í útgáfu.
5. **Skoða.** Smella í gegn á prufuslóðinni: forsíða → þættir → þáttasíða → fólkið → almanak.
6. **Samþykki.** Karl Petersen les textann. Gestur samþykkir það sem um hann er sagt áður en það fer af prufuslóð.

Það sem athugunin sér ekki og þarf mannsauga: orðalag, hvort tilvitnun er rétt eftir höfð, ljósmyndir, og persónulegar upplýsingar um gest.

## Að byggja

```
node build.mjs
```

Engar npm-háðir. Úttakið fer í `dist/`, sem er ekki í git.

## Birting

**Núna (prufuslóð):** Workers Builds er ekki tengt enn. Prufuvefurinn er birtur í þremur skrefum: `main` er ýtt, `dist/` er sett inn í greinina `staging-dist`, og Workerinn `fra-fjoru-til-fjalls` er festur á það commit (`REF` í kóða Workersins).

**Þegar Workers Builds er tengt:** push á `main` byggir og birtir sjálfkrafa og skrefin tvö á eftir falla niður.

Stillingar í Cloudflare (Settings → Builds):

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Workers Builds keyrir ekki `build`-skipunina í `wrangler.jsonc`, svo Build command verður að vera stillt í Cloudflare. Hún í `wrangler.jsonc` er fyrir `wrangler dev` og `wrangler deploy` á eigin vél.

## Reglur

- Síðurnar eru merktar `noindex` þar til `INDEXABLE` er sett á `true` í `build.mjs`.
- Tilraunaþátturinn með Hinriki er ekki ætlaður til opinberrar birtingar (`reviewOnly`). Hann sést aðeins á prufuslóð.
- Texti um þætti er unninn upp úr samtalinu sjálfu og bíður yfirferðar Karls Petersen áður en hann fer í loftið.
- Tenging við `skjaskot.is/podcast*` er sérstakt skref sem bíður samþykkis.
