import { KEY, PACE_OPTIONS, PACE_LABELS, DEFAULT_PACE, MENU_IDLE_MS } from './constants.js';
import { Store } from './Store.js';

/**
 * Settings overlay: four plain choices, saved instantly, D-pad + Magic Remote.
 * Auto-closes after MENU_IDLE_MS without input so the display never stays parked here.
 */

const SHOW_MODES = ['both', 'arabic', 'english'];
const SHOW_LABELS = { both: 'Arabic + English', arabic: 'Arabic only', english: 'English only' };
const ORDER_MODES = ['shuffle', 'sequential'];
const ORDER_LABELS = { shuffle: 'Shuffle', sequential: 'In order' };

export const DEFAULT_SETTINGS = {
  show: 'both',
  pace: DEFAULT_PACE,
  order: 'shuffle',
  sound: false, // ambient TV: silent by default
};

export function loadSettings() {
  const saved = Store.load().settings || {};
  const s = Object.assign({}, DEFAULT_SETTINGS, saved);
  if (SHOW_MODES.indexOf(s.show) < 0) s.show = DEFAULT_SETTINGS.show;
  if (PACE_OPTIONS.indexOf(s.pace) < 0) s.pace = DEFAULT_SETTINGS.pace;
  if (ORDER_MODES.indexOf(s.order) < 0) s.order = DEFAULT_SETTINGS.order;
  s.sound = s.sound === true;
  return s;
}

function cycle(list, value, dir) {
  const i = list.indexOf(value);
  return list[(i + dir + list.length) % list.length];
}

export class Settings {
  constructor(verseRotator, soundEngine, state) {
    this.rotator = verseRotator;
    this.sound = soundEngine;
    this.state = state;
    this.overlay = document.getElementById('settings-overlay');
    this.isOpen = false;
    this.focusIndex = 0;
    this.rows = [];
    this._idleTimer = null;

    this._buildUI();
    this.applyAll();
  }

  _buildUI() {
    const panel = document.getElementById('settings-panel');
    panel.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'Settings';
    panel.appendChild(title);

    this.rows = [];

    this._addRow(panel, 'Show', () => SHOW_LABELS[this.state.show], dir => {
      this.state.show = cycle(SHOW_MODES, this.state.show, dir);
      this._applyShow();
    });

    this._addRow(panel, 'Pace', () => PACE_LABELS[this.state.pace], dir => {
      this.state.pace = cycle(PACE_OPTIONS, this.state.pace, dir);
      this.rotator.setPace(this.state.pace);
    });

    this._addRow(panel, 'Order', () => ORDER_LABELS[this.state.order], dir => {
      this.state.order = cycle(ORDER_MODES, this.state.order, dir);
      this.rotator.setOrderMode(this.state.order);
    });

    this._addRow(panel, 'Flap sound', () => (this.state.sound ? 'On' : 'Off'), () => {
      this.state.sound = !this.state.sound;
      this._applySound();
      if (this.state.sound) this.sound.playFlap(); // audible preview
    });

    const hint = document.createElement('div');
    hint.id = 'settings-hint';
    hint.textContent = '◀ ▶ change   ·   BACK close   ·   saved automatically';
    panel.appendChild(hint);

    const about = document.createElement('div');
    about.id = 'settings-about';
    about.textContent = 'English translation: Sahih International  ·  Arabic typeface: Amiri Quran';
    panel.appendChild(about);

    this._updateFocus();
  }

  _addRow(panel, label, getValueFn, change) {
    const row = document.createElement('div');
    row.className = 'setting-row';
    row.innerHTML = `
      <span class="setting-label">${label}</span>
      <span class="setting-value">
        <span class="setting-arrow">&#x25C0;</span>
        <span class="val-text"></span>
        <span class="setting-arrow">&#x25B6;</span>
      </span>
    `;

    const valText = row.querySelector('.val-text');
    const index = this.rows.length;
    this.rows.push({ el: row, getValueFn, valText, change });
    valText.textContent = getValueFn();

    // Magic Remote pointer: hover focuses, click changes
    row.addEventListener('mouseenter', () => {
      this.focusIndex = index;
      this._updateFocus();
      this._bumpIdle();
    });
    row.addEventListener('click', () => {
      this.focusIndex = index;
      this._change(1);
    });

    panel.appendChild(row);
  }

  _change(dir) {
    this.rows[this.focusIndex].change(dir);
    this._refreshValues();
    this._updateFocus();
    this._save();
    this._bumpIdle();
  }

  _updateFocus() {
    this.rows.forEach((r, i) => r.el.classList.toggle('focused', i === this.focusIndex));
  }

  _refreshValues() {
    this.rows.forEach(r => { r.valText.textContent = r.getValueFn(); });
  }

  _save() {
    Store.save({ settings: this.state });
  }

  applyAll() {
    this._applyShow();
    this._applySound();
  }

  _applyShow() {
    document.body.setAttribute('data-show', this.state.show);
  }

  _applySound() {
    this.sound.enabled = this.state.sound;
  }

  _bumpIdle() {
    clearTimeout(this._idleTimer);
    if (this.isOpen) this._idleTimer = setTimeout(() => this.close(), MENU_IDLE_MS);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.focusIndex = 0;
    this.rotator.hold('settings');
    this._refreshValues();
    this._updateFocus();
    this.overlay.classList.add('open');
    this._bumpIdle();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    clearTimeout(this._idleTimer);
    this.overlay.classList.remove('open');
    this.rotator.release('settings');
  }

  /** Handle keydown when settings is open. Returns true if consumed. */
  handleKey(e) {
    if (!this.isOpen) return false;
    e.preventDefault();
    this._bumpIdle();

    switch (e.keyCode) {
      case KEY.UP:
        this.focusIndex = (this.focusIndex - 1 + this.rows.length) % this.rows.length;
        this._updateFocus();
        break;
      case KEY.DOWN:
        this.focusIndex = (this.focusIndex + 1) % this.rows.length;
        this._updateFocus();
        break;
      case KEY.RIGHT:
      case KEY.OK:
        this._change(1);
        break;
      case KEY.LEFT:
        this._change(-1);
        break;
      case KEY.BACK:
      case KEY.GREEN:
      case 27: // Escape
        this.close();
        break;
    }
    return true; // consume all keys while open
  }
}
