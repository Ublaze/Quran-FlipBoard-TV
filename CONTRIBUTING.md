# Contributing to Quran FlipBoard

Thanks for helping. This is a small, dependency-free project; please keep it that way.

## Ground rules

- **Respect the content.** Verses must be quoted exactly, with correct tashkeel, the right surah and ayah reference, and a credited translation. No commentary or interpretation on screen.
- **Never truncate a verse.** Every English translation must fit the 30 × 6 board. Run the wrap check described below before adding verses.
- **No `?.` or `??`.** webOS 5 runs Chromium 68. `node build.js` fails if you use them. Also avoid flexbox `gap`, `inset` and other CSS newer than Chromium 68.
- **10-foot UI.** Text is at least 20 px at 1920×1080, focus is always visible, and every action works with the D-pad alone.

## Development loop

```bash
node build.js
python -m http.server 8765 -d dist-src
# open http://localhost:8765 ; keys: arrows, Enter (OK), Escape (BACK), S (GREEN), Space (pause), F (fullscreen)
node tests/e2e.mjs   # must stay 100% green
```

Test on the bundle in `dist-src/`, not the raw `js/` modules: the TV runs the bundle.

## Adding verses

Add entries to `data/verses.js` (`arabic`, `english`, `surah`, `ayah`). Keep translations to 180 characters or fewer, and check that they wrap into 6 lines of 30 characters.

## Pull requests

1. One focused change per PR.
2. Update `CHANGELOG.md` under an "Unreleased" heading.
3. Include a screenshot for any visual change, and say which TV/webOS version you tested on, if any.
