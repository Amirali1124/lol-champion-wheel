# The Forge

A random League of Legends build generator. Pick a champion, choose a
difficulty, and roll six items, a rune page and two summoner spells.

It lives in its own folder, next to the Summoner's Roulette wheel that sits in
the repository root:

```
E:\claude\lol\
  index.html      the champion wheel
  forge\
    index.html    The Forge, this page
```

No backend, no build step. Open `forge/index.html` in a browser, or serve the
repository root and visit `/forge/`:

```bash
python -m http.server 8000
```

## The three difficulties

| Tier | Items | Runes and spells |
|---|---|---|
| **Easy** | All six rolled from the champion's own damage pool | Rolled at random |
| **Medium** | Two rolled from that pool, four from every legendary item | Rolled at random |
| **Hard** | All six rolled from every legendary item | Rolled at random |

A champion's damage pool is the items that suit them: spell damage for a
mage, attack damage for a marksman, plus the shared tank items every
champion can use. A champion's class follows the build they actually run in
ranked, so Ezreal rolls attack damage items and Azir rolls spell damage
ones.

**Every build has boots.** If the roll does not pick a pair, one is swapped
in: on Easy the pair comes from the champion's own pool, so a mage's build
keeps its damage type.

The pool is the legendary items in the Summoner's Rift shop, which is the
one shop Draft Pick, Ranked Draft and Ranked Solo/Duo all share. The list
comes from [lolshop.gg](https://lolshop.gg/), which sorts every item into
Riot's own shop rarities: legendaries, epics, basics, starters, boots and
consumables. Riot's own item data does not state the rarity, and the recipe
lists cannot tell a legendary item from an epic one, because a legendary
item may share a component with another.

Two filters cut it down further, and both matter:

- **Riot's own shop flags.** lolshop.gg also lists items Riot has announced
  for the patch but not yet put on sale. An item is in the pool only if it
  can be bought on Summoner's Rift right now.
- **Someone has to build it.** A legendary item that no champion builds in
  the current patch is not in the pool. That is what keeps the
  ultimate-shop items out: Riot sells them, lolshop.gg does not list them,
  and no champion builds them.

The result is 118 items, every one of them a legendary that a real ranked
build contains.

A rolled build never contains the same item twice, and never two pairs of
boots, so it is always a build a player could actually shop for.

## The data

Every champion's build, rune page and numbers are real: the most-played
ranked build on patch 16.21, across 619,584 ranked games.

- **The legendary item list** comes from
  [lolshop.gg](https://lolshop.gg/), which sorts every item in the shop into
  Riot's own rarities.
- **Builds, pick rates, win rates and the rune pages** come from u.gg's
  public stats API.
- **Champion names, titles, roles, item names and costs, and the summoner
  spells** come from Riot's Data Dragon.
- **Splash art** comes from CommunityDragon; **perk icons** from a mirror of
  Riot's static assets.

All of it is baked into `data/*.js` at build time, so the page itself makes
no data requests beyond the images it shows.

To rebuild the data (needs network access):

```bash
cd source
python fetch-lolshop-items.py   # lolshop.gg's legendary list
python fetch-raw-builds.py      # every champion's ranked build
python build-dataset.py         # turns both into the files in ../data
```

`source/` also holds the cached Riot responses, so `build-dataset.py` runs
offline.

## What's here

| File | |
|---|---|
| `index.html` | markup for both views |
| `styles.css` | the dark "data terminal" style: one ground, one accent, no ornament |
| `app.js` | the rolling rules, the picker and the codex |
| `data/*.js` | the dataset, one file per kind |
| `source/` | the scripts and cached data that produced `data/` |

## The two views

- **Forge** — the champion's build, its six items, its rune page, how the roll
  compares with the meta build, and where the champion stands.
- **Champion codex** — all 173 champions with their ranked build, games, win
  rate and pick rate, sortable and filterable, with the most built items and
  the most played champions below.

## Notes

- Not affiliated with Riot Games. Champion and item names are property of
  Riot Games.
- Champion lanes are a rough classification, taken from the sibling project's
  list and filled in from Riot's own tags where that list is short.
