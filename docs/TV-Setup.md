# Quran FlipBoard: TV setup for always-on use

The app is built to run unattended: it starts playing by itself, keeps rotating forever,
resumes on the same verse after a relaunch, and asks the TV not to start its screensaver.
A few things are controlled by the TV, not the app. This page covers them.

## 1. Install (Developer Mode, before Content Store approval)

```bash
node build.js
ares-package dist-src -o dist
ares-install --device <your-tv> dist/com.ublaze.quranflipboardtv_1.0.0_all.ipk
ares-launch --device <your-tv> com.ublaze.quranflipboardtv
```

Developer Mode installs expire after the Dev Mode session lapses (50 h, extendable in the
Developer Mode app). Re-install if the app disappears.

## 2. Open it automatically when the TV turns on

LG does **not** let a third-party app launch itself at power-on. There is no API for it
(confirmed on the LG developer forum). The closest you can get:

1. **Settings → General → (System →) Quick Start+ → On.**
   With Quick Start+, "off" is a standby, and the TV usually returns to the app that was on
   screen when it was switched off. Leave Quran FlipBoard open when you turn the TV off.
2. **Settings → General → (System → Additional Settings →) Home Settings → Home Auto Launch → Off.**
   Stops the Home bar from popping up over the app on power-on.

Menu paths differ slightly between webOS versions. Search for "Quick Start" or "Home Auto Launch"
in the settings search if the path above does not match your model.

For true boot-to-app, LG's commercial modes (Hotel / Signage / "Pro:Centric") support it.
Consumer TVs do not.

## 3. Screensaver and OLED dimming

- The app asks webOS not to show the screensaver (`com.webos.service.tvpower` →
  `registerScreenSaverRequest`, answered with `ack:false`). This works in Developer Mode;
  a retail store install may refuse the call. If it does, the app automatically falls back
  to a hidden muted looping video, which keeps the TV in "media playing" state.
- **Check on your TV:** leave the app running untouched for 15+ minutes. If the LG
  screensaver still appears, tell me what model / webOS version it is.
- OLED panels also run their own **Screen Shift** and **Logo Luminance Adjustment**
  (Settings → Display → OLED Care). Leave these ON: they protect the panel and
  don't stop the app. The app also slowly drifts its whole layout by a few pixels
  every ~12 minutes for the same reason.
- **Auto power-off:** Settings → General → (System →) Timers / Eco → "Auto Power Off"
  and "Turn off after 4 hours of inactivity" will switch the TV off if no remote key is
  pressed. Turn these off if you want it running all day.

## 4. Remote controls

| Key | Main screen | Control bar | Settings |
|-----|-------------|-------------|----------|
| ◀ ▶ | Previous / next verse | Move between buttons | Change value |
| ▲ ▼ | Show control bar | Hide bar | Move between rows |
| OK | Show control bar (resumes if paused) | Press button | Change value |
| ⏯ Play / ⏸ Pause | Resume / pause | same | — |
| ⏩ ⏪ / CH + − | Next / previous verse | same | — |
| GREEN | Open settings | — | Close |
| BACK | Exit to Home | Hide bar | Close |
| Magic Remote pointer | Shows control bar + cursor | Point and click | Point and click |

Menus close themselves after 20 seconds without input, and rotation carries on.
