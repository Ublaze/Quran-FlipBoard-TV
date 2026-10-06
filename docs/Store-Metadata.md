# Quran FlipBoard: LG Seller Lounge submission pack

Values for every mandatory menu in **Seller Lounge → Applications → Create App**, in the order the
registration screen shows them. Click **SAVE** after each menu (its checkbox turns red when complete).

| Menu | Mandatory |
|------|-----------|
| File Upload · Images · Service Country Info. · Display Info. · Service Info. · Feature Info. · Test Info. · Self-check list · Defect Info. | Yes |
| App CTS · Alpha Test · webOS Cloud Test Lab | No (Cloud Test Lab is a free pre-test, worth running) |

---

## 1. File Upload

| Field | Value |
|-------|-------|
| App ID | `com.ublaze.quranflipboard` (taken from the IPK) |
| IPK | `dist/com.ublaze.quranflipboard_0.2.1_all.ipk` (agree to "configure from IPK") |
| File Type | Web (auto) |
| Chipset | Web → **All** |
| Service Platform / SDK | All webOS platforms offered (app targets webOS 5+ / Chromium 68 and up) |
| Resolution | Graphics 1920 x 1080 FHD (from appinfo.json) |
| File Version | `0.2.1` |

## 2. Images

| Field | File | Spec check |
|-------|------|------------|
| App Icon | `assets/storeIcon.png` (400x400) | ≥400x400, square, opaque, not rounded ✓ |
| App Tile Color | `#0D0D0D` | must match the icon background (`#0D0D0D`) ✓ |
| Screenshots (up to 6, first = primary, shown on Apps home on webOS 6+) | `docs/store/screenshot-1-main.png` … (1920x1080) | no duplicates ✓ |
| Splash Screen Background | `assets/splashBackground.png` (1920x1080) | not black, minimal text ✓ |
| Launcher Background | same as splash (only used on 2014–2015 TVs) | optional |

## 3. Service Country Info.

- Countries: **Select Available Countries** (all regions where LG Apps operates).
- App Service Language: **English** (required for global apps). Verse text is Arabic; UI is English.

## 4. Display Info.

- Default Display on TV: **English**
- **App Title:** `Quran FlipBoard`
- **App Description (English):**

> Turn your LG TV into a calm ambient display of the Holy Quran. Each verse appears in elegant Arabic calligraphy while its English translation (Sahih International) settles into place on a retro split-flap board, like an old airport departure board.
>
> It starts playing as soon as you open it and keeps going on its own: no account, no setup, no internet needed.
>
> • 113 carefully chosen verses from 74 surahs, with full tashkeel
> • Arabic + English, Arabic only, or English only
> • Choose the pace: 10, 15, 25 or 45 seconds per verse
> • Shuffle or Mushaf order; continues from the same verse next time
> • Press OK for Previous / Pause / Next / Settings; Magic Remote supported
> • Gentle on OLED screens: the layout drifts slowly to prevent burn-in
> • Optional split-flap sound (off by default)

- If Russia is selected in countries: title/description must also be entered in Russian (or deselect Russia).

## 5. Service Info.

| Field | Value |
|-------|-------|
| Category | **Life** (alternative: Education) |
| App Version | `0.2.1` |
| App Rating | **All ages** (if Brazil is selected, use LG's Assessment of Content Rating) |
| Content Rating (adult content) | **No adult content** |
| Tag Keywords | `quran islamic verses ayah surah arabic muslim ambient screensaver flipboard` |
| Contact: Seller website | `https://github.com/Ublaze/Quran-FlipBoard-TV/issues` |
| Contact: E-mail | leave empty (if given, the email is shown on TV instead of the website) |
| Data collection (mandatory if UK selected) | Privacy policy: `https://ublaze.github.io/Quran-FlipBoard-TV/privacy-policy.html` · Data collected: **none** · Shared data: **none** · Storage location: **on the TV only** (display preferences + current verse position) |

## 6. Feature Info.

| Field | Value |
|-------|-------|
| Device Requirement(s) | **None** |
| Remote Controller | **Both Magic and general remote** |
| DIAL | No |

## 7. Test Info.

| Field | Value |
|-------|-------|
| Reference E-mail | (your verified seller email is used automatically) |
| UX Scenario File | `docs/lg-templates/UX_Scenario_QuranFlipBoard_0.2.1.pptx` (filled from LG template 4.4) |
| Note for Tester | see below |
| Test Account / Voucher | **Not applicable** |
| Test IPK / URL | **Not applicable** |
| Geo IP Block | **No** |
| Billing | **Not applicable** (free, no purchases) |
| In-App Ad | **Not applicable** (no ads) |
| Player Specification | none (no video/audio playback; sound effect is synthesised) |

**Note for Tester:**

> Ambient display app. No sign-in, network, purchases or ads. On launch it immediately shows a verse and advances automatically (default 15 s reading time after each flip animation of about 4 s), indefinitely.
> Remote: LEFT/RIGHT = previous/next verse. OK, UP or DOWN = show control bar (Previous · Pause · Next · Settings), which hides after 6 s. Play/Pause/Stop keys pause and resume; FF/REW and CH+/− change verse. GREEN = Settings (4 options, saved instantly; closes after 20 s idle). BACK closes the bar or Settings, and on the main screen exits to Home.
> The app asks webOS not to start the screensaver while it runs (tvpower registerScreenSaverRequest), and falls back to a hidden muted video if that is refused. Settings and current verse persist across relaunch and power cycles.

## 8. Self-check list

Fill online from `docs/lg-templates/Self_Checklist_QuranFlipBoard_0.2.1.xlsx` (every row is Pass or NA with a comment).
Note: the list resets whenever the app version changes.

## 9. Defect Info.

First submission: nothing to declare / "Not applicable".

## 10. Submit

Agree to the Seller Agreement → **Confirm**. Leave "release with minor defects" **unticked** (seller is liable).
Expect 1–4 weeks: Pretest → Function Test → Content Test → Approval.
