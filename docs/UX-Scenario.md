# Quran FlipBoard — UX Scenario Document

## App Overview
**App Name:** Quran FlipBoard
**App ID:** com.ublaze.quranflipboard
**Version:** 0.2.0
**Category:** Life / Education
**Description:** A beautiful split-flap (flip-board) display that cycles through Quran verses with authentic mechanical animation. Displays Arabic text in elegant calligraphy alongside English translation on a retro airport departure board. Designed as an ambient display / digital screensaver for LG TVs.

---

## Scenario 1: App Launch
1. User selects "Quran FlipBoard" from the LG Home launcher
2. Splash screen displays briefly (gold 8-point star on dark background)
3. App immediately begins displaying a verse. No setup is required.
4. Arabic text fades in at the top of the screen
5. English translation appears on the split-flap board with scramble animation
6. Surah name and ayah number appear below the board in gold text
7. A hint "Press OK for controls · ◀ ▶ previous / next" fades in for a few seconds, then disappears
8. On later launches the app continues from the verse it was showing last time, with the user's saved settings

## Scenario 2: Auto-Rotation (unattended)
1. Each verse stays fully readable for the chosen pace (default 15 s; long verses get extra time), then the next verse flips in
2. Rotation continues indefinitely with no user input
3. The app asks webOS not to start the TV screensaver while it is running
4. The whole layout drifts by a few pixels over ~12 minutes to protect OLED panels
5. If the TV switches input or the app goes to the background, rotation pauses and resumes on the same verse when it returns

## Scenario 3: Manual Navigation (D-Pad)
1. RIGHT (or FF / CH+) → next verse; LEFT (or REW / CH−) → previous verse
2. Auto-rotation continues from the new verse
3. OK, UP or DOWN → shows the control bar (Previous · Pause · Next · Settings), focused on Pause
4. LEFT/RIGHT move focus within the bar; OK activates; the bar hides itself after 6 s or on BACK/UP/DOWN
5. Moving the Magic Remote pointer shows the cursor and the control bar; all buttons are clickable

## Scenario 4: Pause
1. User selects Pause in the control bar, or presses the remote's Pause/Stop key
2. A "Paused · press OK or Play to continue" badge appears top-right; the verse stays on screen
3. OK or Play resumes rotation

## Scenario 5: Settings Panel
1. User opens Settings from the control bar (⚙) or presses the GREEN button
2. Four options are displayed with the first one focused (gold border):
   - **Show:** Arabic + English / Arabic only / English only
   - **Pace:** Quick (10 s) / Calm (15 s) / Slow (25 s) / Very slow (45 s)
   - **Order:** Shuffle / In order (Mushaf order)
   - **Flap sound:** On / Off (default Off)
3. UP/DOWN move between rows; LEFT/RIGHT/OK change the value; changes apply and save immediately
4. The panel shows the translation attribution (Sahih International)
5. BACK or GREEN closes the panel. It also closes itself after 20 s without input.
6. Rotation is held while the panel is open and resumes on the same verse afterwards

## Scenario 6: Display Modes
1. **Arabic + English (default):** Arabic calligraphy above the flip-board, English translation on the board
2. **Arabic only:** only the Arabic calligraphy is shown, board is hidden
3. **English only:** only the split-flap board is shown, Arabic section is hidden

## Scenario 7: Exit App (BACK Button)
1. When a menu (control bar or Settings) is open: BACK closes it
2. On the main screen: BACK exits the app and returns to LG Home

## Scenario 8: Screensaver Behavior
1. The app requests webOS not to show the screensaver while verses are rotating
2. If the TV does not allow this request, the app keeps the TV active with a hidden, muted looping video
3. On OLED TVs the system's own OLED Care features (Screen Shift, Logo Luminance) remain active

## Scenario 9: App Relaunch
1. If the app is relaunched while already running, it continues rotating from the current verse
2. Shuffle order is kept between launches so verses are not repeated until the cycle completes

---

## Navigation Summary

| Input | Main Screen | Control Bar | Settings Panel |
|-------|------------|-------------|----------------|
| LEFT/RIGHT | Prev/Next verse | Move focus | Change value |
| UP/DOWN | Show control bar | Hide bar | Move between rows |
| OK/Enter | Show control bar (resume if paused) | Activate button | Change value |
| PLAY / PAUSE / STOP | Resume / Pause | Resume / Pause | — |
| FF / REW, CH+ / CH− | Next / Prev verse | Next / Prev verse | — |
| GREEN | Open settings | — | Close settings |
| BACK | Exit to Home | Hide bar | Close settings |

---

## Content
- 113 curated Quran verses from 74 surahs
- Arabic text with full tashkeel (diacritical marks)
- English translations (Sahih International)
- Themes: mercy, patience, gratitude, trust, remembrance, forgiveness, guidance, prayer
- All content is the Holy Quran — universally respected religious text
- No user-generated content, no external data fetching, no account required
