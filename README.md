# Summoner's Roulette

A 3D spinning wheel that picks a random League of Legends champion. All 156
champions can go on the wheel at once, with live lane filters and search.

Built with plain HTML, CSS and JavaScript plus [three.js](https://threejs.org)
for the wheel itself. No build step.

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
| `index.html` | markup and control wiring |
| `styles.css` | dark gaming theme, responsive layout |
| `script.js` | champion data, 3D wheel, spin physics, UI logic |
| `sword-art.js` | sword pointer art, inlined as a data URI |
| `sword.png` | source art for the pointer (not used at runtime) |

## Features

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

## Notes

- Champion lanes are a rough classification, not Riot's official data.
- Not affiliated with Riot Games. Champion names are property of Riot Games.

🤖 Generated with [Claude Code](https://claude.com/claude-code)