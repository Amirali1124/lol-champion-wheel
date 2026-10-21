# League of Legends random draft tools

Two small static sites, no backend and no build step:

| | |
|---|---|
| **[Summoner's Roulette](index.html)** | a 3D spinning wheel that picks a random champion |
| **[The Forge](forge/)** | rolls a random six-item build, rune page and summoner spells for a champion you pick |

Both are live on GitHub Pages: the wheel at the repository root, the Forge
under `/forge/`, linked to each other.

Built with plain HTML, CSS and JavaScript, plus [three.js](https://threejs.org)
for the wheel. The Forge's data is baked into `forge/data/*.js` at build time
from the ranked-game statistics, so the page itself makes no data requests
beyond the images it shows.

## Running it

Open `index.html` in a browser — that's it. It works straight off disk
(`file://`); the sword pointer is inlined in `sword-art.js` because browsers
block WebGL from loading a sibling image file in that mode.

To serve it instead:

```bash
python -m http.server 8000
```

## What's here

| File | |
|---|---|
| `index.html` | markup and control wiring for the wheel |
| `styles.css` | dark gaming theme, responsive layout |
| `script.js` | champion data, 3D wheel, spin physics, UI logic |
| `sword-art.js` | sword pointer art, inlined as a data URI |
| `sword.png` | source art for the pointer (not used at runtime) |
| `forge/` | the build generator, with its own README |

## The wheel

- **All 156 champions**, or 6 / 12 / 40 for a coarser wheel
- Lane filters (top / jungle / mid / bot / support) and name search, which compose
- Spin with a cinematic slow-down; the announced champion is exactly the segment
  the pointer lands on
- **Remove winners from the pool** so a draft can't repeat a pick
- Live "under the pointer" readout — at 156 segments each sliver is too thin to
  letter, so the name is surfaced here and ticks past as the wheel turns
- Champion names are drawn on the segments when the wheel is small enough
- Keyboard: <kbd>Space</kbd> or <kbd>Enter</kbd> to spin
- Screen-reader announcements, visible focus rings, `prefers-reduced-motion`

## The Forge

- **173 champions**, each with the build, rune page and numbers it actually
  runs in ranked
- Three difficulties: **Easy** rolls all six items from the champion's own
  damage pool, **Medium** rolls two from that pool and four from everywhere,
  **Hard** rolls all six from the whole legendary pool
- Every build gets boots, and never two pairs
- A codex of every champion's ranked build with games, win rate and pick rate
- The item pool is the legendary items in the Summoner's Rift shop that a
  champion actually builds, on patch 16.21

## Notes

- Champion lanes are a rough classification, not Riot's official data.
- Not affiliated with Riot Games. Champion and item names are property of
  Riot Games.

🤖 Generated with [Claude Code](https://claude.com/claude-code)