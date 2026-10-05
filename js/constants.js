// Grid dimensions — wider than FlipOff to fit verse translations
export const COLS = 30;
export const ROWS = 6;

// Timing (ms)
export const SCRAMBLE_DURATION = 900;
export const FLIP_DURATION = 300;
export const STAGGER_DELAY = 20;

// Reading-time ("pace") options in ms. Timer starts AFTER the board has settled,
// so this is the real time the verse stays readable on screen.
export const PACE_OPTIONS = [10000, 15000, 25000, 45000];
export const PACE_LABELS = { 10000: 'Quick (10s)', 15000: 'Calm (15s)', 25000: 'Slow (25s)', 45000: 'Very slow (45s)' };
export const DEFAULT_PACE = 15000;

// Watchdog: if no verse has changed for this many paces, force-advance.
export const WATCHDOG_FACTOR = 3;
export const WATCHDOG_CHECK_MS = 20000;

// Menus close themselves after this long without input, so the app never stays parked on a menu.
export const MENU_IDLE_MS = 20000;
export const CONTROL_BAR_IDLE_MS = 6000;
export const ARABIC_FADE_DURATION = 1200;

// Characters used in scramble animation
export const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,-:;!?\' ';

// Scramble colors — Islamic-inspired palette (gold, emerald, teal, deep blue)
export const SCRAMBLE_COLORS = [
  '#C8A961', // gold
  '#2D6A4F', // emerald
  '#00B4D8', // teal
  '#1B4965', // deep navy
  '#E8D5B7', // warm cream
  '#FFFFFF', // white
];

// Colors that need dark text for contrast
export const LIGHT_COLORS = ['#E8D5B7', '#FFFFFF', '#C8A961'];

// Accent bar color pairs (cycled per verse)
export const ACCENT_PAIRS = [
  ['#C8A961', '#2D6A4F'], // gold + emerald
  ['#00B4D8', '#1B4965'], // teal + navy
  ['#E8D5B7', '#C8A961'], // cream + gold
  ['#2D6A4F', '#00B4D8'], // emerald + teal
];

// Scramble config
export const SCRAMBLE_STEPS = 12;
export const SCRAMBLE_STEP_MS = Math.floor(SCRAMBLE_DURATION / 12);

// webOS key codes
export const KEY = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  OK: 13,      // Enter/OK
  BACK: 461,   // webOS Back button
  RED: 403,
  GREEN: 404,
  YELLOW: 405,
  BLUE: 406,
  PLAY: 415,
  PAUSE: 19,
  STOP: 413,
  FAST_FORWARD: 417,
  REWIND: 412,
  CH_UP: 33,
  CH_DOWN: 34,
};
