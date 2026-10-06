# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-10-06

First LG Content Store release (LG requires a file version of at least 1.0.0). Same app as 0.2.1, plus:

### Fixed
- `appinfo.json` now points `icon` at an 80x80 PNG and `largeIcon` at a 130x130 PNG, as webOS requires (both were the 512x512 image).

## [0.2.1] - 2026-10-06

LG Content Store submission readiness.

### Changed
- App ID is now `com.ublaze.quranflipboardtv`: LG Seller Lounge reported `com.ublaze.quranflipboard` as already in use. A Developer Mode install of an earlier version shows up as a separate app; remove it once.

### Fixed
- Splash background was almost entirely black; LG requires a non-black splash. New 1920x1080 emerald splash with the split-flap logo.
- App tile colour (`iconColor`) now matches the icon background (`#0D0D0D`), as LG QA checks.
- All on-screen text and controls now sit inside a 5% TV safe area (96 px / 54 px at 1080p).
- Privacy policy: correctly states that display preferences and the current verse are stored on the TV; removed an inaccurate "public domain" claim about the translation; contact is now GitHub Issues.

### Added
- `docs/Store-Metadata.md`: field-by-field values for every Seller Lounge registration menu.
- Store screenshots (`docs/store/`) and a navigation flow chart for the UX scenario.
- `tests/soak.mjs` (long unattended run: stall, memory and DOM checks) and `tests/screenshots.mjs`.

## [0.2.0] - 2026-10-05

### Fixed
- **Verses stopped after the first one on the TV.** `build.js` rewrote every `?.` to `.`, turning a no-op line in `Board.js` into `querySelector(':scope').remove`, which threw on every verse. The rotator never cleared its "transitioning" flag, so nothing advanced again.
- Any render error could freeze rotation permanently. `showVerse()` now always clears its state, and a watchdog forces the next verse after three silent paces.
- Reading time was ~8.5 s instead of the chosen 12 s, because the timer counted the flip animation. The pace now starts after the board settles.
- Settings were lost on every launch, and "Shuffle" had no effect.
- Leaving Settings open stopped rotation indefinitely.
- `webOSTVjs/webOSTV.js` was referenced but not packaged. TV services are now called directly.
- Text under LG's 20 px minimum (hints 14–16 px, values 18 px).
- `inset` and flexbox `gap` (Chromium 84+) replaced for webOS 5 (Chromium 68).
- The Magic Remote cursor was hidden everywhere.

### Added
- Auto-hiding control bar (OK): Previous · Pause · Next · Settings.
- Pause/resume with the Play/Pause/Stop keys and a "Paused" badge; FF/REW and CH± change verse.
- Resume on the same verse with saved settings after relaunch.
- Screensaver veto via `com.webos.service.tvpower`, with a muted-video fallback.
- Slow layout drift for OLED burn-in protection.
- Arabic text auto-fits long verses.
- Translation attribution in Settings.
- `docs/TV-Setup.md`, headless end-to-end test (`tests/e2e.mjs`).
- The build fails on `?.` / `??` and on leftover module syntax.

### Changed
- Settings reduced to four plain options: Show, Pace, Order, Flap sound. They save instantly and close after 20 s idle.
- Flap sound is off by default.
- UP/DOWN now show the control bar (LEFT/RIGHT still change verse).
- Removed the static verse counter.

## [0.1.0] - 2026-03-29

### Added
- First version: split-flap board, 113 verses, Arabic + English, settings overlay, webOS packaging.
