import {
  COLS, ROWS, DEFAULT_PACE, WATCHDOG_FACTOR, WATCHDOG_CHECK_MS,
} from './constants.js';

/**
 * Drives the verse sequence.
 *
 * Reliability rules (the app is meant to run unattended for hours):
 * - showVerse() always clears isTransitioning (try/finally), even if rendering throws.
 * - The next verse is scheduled only AFTER the current one has settled, so the
 *   pace is the real reading time.
 * - A watchdog force-advances if nothing has changed for WATCHDOG_FACTOR paces.
 * - Stopping is done through named "holds" (settings open, app hidden) plus a
 *   user pause; releasing them resumes the current verse instead of restarting.
 */
export class VerseRotator {
  constructor(board, soundEngine, verses, opts) {
    opts = opts || {};
    this.board = board;
    this.sound = soundEngine;
    this.verses = verses; // canonical (Mushaf) order
    this.pace = opts.pace || DEFAULT_PACE;
    this.onChange = opts.onChange || function () {};
    this.onPauseChange = opts.onPauseChange || function () {};

    this.order = this._buildOrder(opts.orderMode || 'shuffle', opts.savedOrder);
    this.position = this._clampPosition(opts.savedPosition);
    this.shownPosition = -1;

    this.isTransitioning = false;
    this.paused = false;
    this.holds = {};
    this.timer = null;
    this.watchdog = null;
    this.lastChangeAt = Date.now();

    this.arabicEl = document.getElementById('arabic-verse');
    this.refEl = document.getElementById('surah-ref');
  }

  get currentVerse() {
    return this.verses[this.order[this.position]];
  }

  /** Begin (or resume) rotation. Safe to call more than once. */
  start() {
    if (!this.watchdog) {
      this.watchdog = setInterval(() => this._checkWatchdog(), WATCHDOG_CHECK_MS);
    }
    this._resume();
  }

  /** Temporarily stop for a named reason (e.g. 'settings', 'hidden'). */
  hold(reason) {
    this.holds[reason] = true;
    this._clearTimer();
  }

  release(reason) {
    delete this.holds[reason];
    this._resume();
  }

  get isHeld() {
    return Object.keys(this.holds).length > 0;
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this._clearTimer();
    this.onPauseChange(true);
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.onPauseChange(false);
    this._resume();
  }

  togglePause() {
    if (this.paused) this.resume();
    else this.pause();
  }

  next() {
    this.position = (this.position + 1) % this.order.length;
    this.showVerse();
  }

  prev() {
    this.position = (this.position - 1 + this.order.length) % this.order.length;
    this.showVerse();
  }

  setPace(ms) {
    this.pace = ms;
    if (!this.isTransitioning) this._schedule();
  }

  /** Switch between 'shuffle' and 'sequential', keeping the current verse on screen. */
  setOrderMode(mode) {
    const currentVerseIndex = this.order[this.position];
    this.order = this._buildOrder(mode);
    this.position = Math.max(0, this.order.indexOf(currentVerseIndex));
    this.shownPosition = this.position;
    this.onChange();
  }

  /** Render the verse at this.position. Concurrent calls are coalesced. */
  async showVerse() {
    this._clearTimer();
    if (this.isTransitioning) return; // the running transition re-checks position when done
    this.isTransitioning = true;
    const target = this.position;

    try {
      const verse = this.verses[this.order[target]];

      this.arabicEl.classList.remove('visible');
      this.arabicEl.classList.add('exiting');
      this.refEl.classList.remove('visible');
      await this._delay(400);

      this.arabicEl.textContent = verse.arabic;
      this.arabicEl.classList.remove('exiting');
      this._fitArabic(verse.arabic);
      await this._delay(100);
      this.arabicEl.classList.add('visible');

      this.sound.playFlap();
      await this.board.displayMessage(this._wrapText(verse.english, COLS));

      this.refEl.textContent = `${verse.surah} · ${verse.ayah}`;
      this.refEl.classList.add('visible');
    } catch (e) {
      console.error('[VerseRotator] render failed, continuing:', e);
    } finally {
      this.isTransitioning = false;
      this.shownPosition = target;
      this.lastChangeAt = Date.now();
      this.onChange();
    }

    // User pressed next/prev while we were animating: catch up to it
    if (this.shownPosition !== this.position) {
      this.showVerse();
    } else {
      this._schedule();
    }
  }

  // --- internals ---------------------------------------------------------

  _resume() {
    if (this.isHeld || this.paused || this.isTransitioning) return;
    if (this.shownPosition !== this.position) this.showVerse();
    else this._schedule();
  }

  _schedule() {
    this._clearTimer();
    if (this.isHeld || this.paused) return;
    this.timer = setTimeout(() => this.next(), this._dwellFor(this.currentVerse));
  }

  _clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Long verses get extra reading time (~0.4s per word) beyond the chosen pace. */
  _dwellFor(verse) {
    const words = verse ? verse.english.split(' ').length : 0;
    return Math.max(this.pace, words * 400);
  }

  _checkWatchdog() {
    if (this.isHeld || this.paused) {
      this.lastChangeAt = Date.now();
      return;
    }
    const stalledFor = Date.now() - this.lastChangeAt;
    if (stalledFor > this.pace * WATCHDOG_FACTOR + 10000) {
      console.warn('[VerseRotator] watchdog: no change for', stalledFor, 'ms, forcing next');
      this.isTransitioning = false;
      this.lastChangeAt = Date.now();
      this.next();
    }
  }

  _buildOrder(mode, saved) {
    const n = this.verses.length;
    if (saved && saved.length === n) return saved.slice();
    const order = [];
    for (let i = 0; i < n; i++) order.push(i);
    if (mode === 'shuffle') {
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = order[i]; order[i] = order[j]; order[j] = t;
      }
    }
    return order;
  }

  _clampPosition(p) {
    return (typeof p === 'number' && p >= 0 && p < this.order.length) ? p : 0;
  }

  /** Shrink the Arabic line for long verses so it never crowds the board. */
  _fitArabic(text) {
    const len = text.length;
    let scale = 1;
    if (len > 140) scale = 0.7;
    else if (len > 100) scale = 0.8;
    else if (len > 70) scale = 0.9;
    this.arabicEl.style.setProperty('--arabic-scale', scale);
  }

  /**
   * Word-wrap text into lines that fit the board, centred vertically.
   * (All 113 bundled verses fit in 30x6; the ellipsis is only a safety net.)
   */
  _wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (test.length <= maxWidth) {
        currentLine = test;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word.length > maxWidth ? word.substring(0, maxWidth) : word;
      }
    }
    if (currentLine) lines.push(currentLine);

    if (lines.length > ROWS) {
      lines.length = ROWS;
      const lastLine = lines[ROWS - 1];
      lines[ROWS - 1] = lastLine.length > maxWidth - 3
        ? lastLine.substring(0, maxWidth - 3) + '...'
        : lastLine + '...';
    }

    const topPad = Math.floor((ROWS - lines.length) / 2);
    const padded = [];
    for (let i = 0; i < topPad; i++) padded.push('');
    for (const line of lines) padded.push(line);
    while (padded.length < ROWS) padded.push('');
    return padded.slice(0, ROWS);
  }

  _delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}
