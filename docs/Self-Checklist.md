# Quran FlipBoard — Self-Checklist

## App Information
- **App Name:** Quran FlipBoard
- **App ID:** com.ublaze.quranflipboard
- **Version:** 0.2.0
- **Tester:** [Your Name]
- **Date:** [Test Date]

---

## Content Checks

| # | Item | Result | Notes |
|---|------|--------|-------|
| C1 | No sexually offensive material | PASS | App displays only Quran verses |
| C2 | No realistic violence or weapons | PASS | Text-only display |
| C3 | No discrimination by region/gender/religion/ethnicity | PASS | Universal Quran verses, respectful presentation |
| C4 | No content encouraging underage smoking/drinking | PASS | N/A |
| C5 | No drug-related content | PASS | N/A |
| C6 | No gambling mechanics or real-money currency | PASS | N/A |
| C7 | No religious or national bias | PASS | Quran presented as informational/spiritual content without commentary or interpretation bias |

---

## UX Checks

| # | Item | Result | Notes |
|---|------|--------|-------|
| U1 | All 4 arrow keys work throughout the app | PASS | Main: LEFT/RIGHT=prev/next verse, UP/DOWN=show control bar. Control bar: LEFT/RIGHT move focus, UP/DOWN hide. Settings: UP/DOWN rows, LEFT/RIGHT values |
| U2 | OK button works throughout the app | PASS | Main: shows control bar (resumes if paused). Control bar: activates focused button. Settings: changes value |
| U3 | BACK button on entry page returns to Home screen | PASS | window.close() called, returns to LG Home (only when no menu is open) |
| U4 | BACK button in sub-screens navigates back correctly | PASS | Closes control bar / Settings first; exits on the next press |
| U5 | Every interactive element has visible focus effect | PASS | Settings rows and control-bar buttons show gold border + highlight; Magic Remote hover moves focus |
| U6 | Minimum button size 75x75 px (at 1920x1080) | PASS | Control-bar buttons 120x100 px; settings rows full-width, 80 px tall |
| U7 | Minimum font size 20 px (at 1920x1080) | PASS | Smallest text is 20px (hints, attribution, control labels); fixed in 0.2.0, where 0.1.0 had 14-18px hints |
| U8 | Loading indicator shown during content fetch | N/A | App is fully offline, no network requests, no loading states |
| U9 | Magic Remote scroll direction matches wheel button | N/A | No scrollable content — all navigation is discrete (prev/next) |
| U10 | App works in both 1920x1080 and 1280x720 | PASS | Dynamic tile sizing adapts to viewport; responsive CSS breakpoints for both |

---

## Privacy / Security Checks

| # | Item | Result | Notes |
|---|------|--------|-------|
| P1 | No hardcoded passwords in source code | PASS | No authentication, no passwords |
| P2 | No API keys or tokens in source code | PASS | No external APIs used |
| P3 | No PEM private keys in source code | PASS | No encryption keys |
| P4 | No credentials in filenames | PASS | Clean file naming |
| P5 | Sensitive data encrypted if stored locally | N/A | Only display preferences and the current verse position are stored (localStorage); no personal data |
| P6 | No variables named passwd/pwd/password/credential/token | PASS | Verified via code search |

---

## Additional Notes
- App requires no network connectivity (fully offline)
- App requires no special permissions
- App has no in-app purchases
- App has no advertisements
- All fonts are bundled (Amiri / Amiri Quran, OFL licensed)
- Audio is generated via Web Audio API (no external audio files)
- Memory footprint is minimal (~1 MB total package size)
