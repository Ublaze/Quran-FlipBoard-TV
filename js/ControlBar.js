import { KEY, CONTROL_BAR_IDLE_MS } from './constants.js';

// Inline SVG icons: TV system fonts don't reliably include the media glyphs
const CB_ICONS = {
  prev: '<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.7a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.7a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/></svg>',
};

/**
 * Small auto-hiding bar: Previous / Play-Pause / Next / Settings.
 * Shown by OK, UP/DOWN or pointer movement; hides itself after CONTROL_BAR_IDLE_MS.
 * Rotation keeps running while it is visible.
 */
export class ControlBar {
  constructor(verseRotator, settings) {
    this.rotator = verseRotator;
    this.settings = settings;
    this.el = document.getElementById('control-bar');
    this.isOpen = false;
    this._timer = null;

    this.buttons = [
      { id: 'prev', label: 'Previous', icon: CB_ICONS.prev, run: () => this.rotator.prev() },
      { id: 'play', label: 'Pause', icon: CB_ICONS.pause, run: () => this.rotator.togglePause() },
      { id: 'next', label: 'Next', icon: CB_ICONS.next, run: () => this.rotator.next() },
      { id: 'settings', label: 'Settings', icon: CB_ICONS.settings, run: () => { this.hide(); this.settings.open(); } },
    ];
    this.focusIndex = 1;
    this._build();
  }

  _build() {
    this.el.innerHTML = '';
    this.buttons.forEach((b, i) => {
      const btn = document.createElement('div');
      btn.className = 'cb-btn';
      btn.innerHTML = `<span class="cb-icon"></span><span class="cb-label"></span>`;
      btn.querySelector('.cb-icon').innerHTML = b.icon;
      btn.querySelector('.cb-label').textContent = b.label;
      btn.addEventListener('mouseenter', () => { this.focusIndex = i; this._render(); this._bump(); });
      btn.addEventListener('click', () => { this.focusIndex = i; this._activate(); });
      b.el = btn;
      this.el.appendChild(btn);
    });
    this._render();
  }

  /** Reflect paused state on the play button. */
  setPaused(paused) {
    const b = this.buttons[1];
    b.icon = paused ? CB_ICONS.play : CB_ICONS.pause;
    b.label = paused ? 'Play' : 'Pause';
    b.el.querySelector('.cb-icon').innerHTML = b.icon;
    b.el.querySelector('.cb-label').textContent = b.label;
  }

  show(focusIndex) {
    if (typeof focusIndex === 'number') this.focusIndex = focusIndex;
    this.isOpen = true;
    this.el.classList.add('visible');
    // The launch hint sits in the same spot; once the bar is open the hint has done its job
    const hint = document.getElementById('nav-hint');
    if (hint) hint.classList.remove('visible');
    this._render();
    this._bump();
  }

  hide() {
    this.isOpen = false;
    clearTimeout(this._timer);
    this.el.classList.remove('visible');
  }

  _bump() {
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.hide(), CONTROL_BAR_IDLE_MS);
  }

  _render() {
    this.buttons.forEach((b, i) => b.el.classList.toggle('focused', i === this.focusIndex));
  }

  _activate() {
    this.buttons[this.focusIndex].run();
    if (this.isOpen) this._bump();
  }

  /** Handle keydown while visible. Returns true if consumed. */
  handleKey(e) {
    if (!this.isOpen) return false;

    switch (e.keyCode) {
      case KEY.LEFT:
        this.focusIndex = Math.max(0, this.focusIndex - 1);
        break;
      case KEY.RIGHT:
        this.focusIndex = Math.min(this.buttons.length - 1, this.focusIndex + 1);
        break;
      case KEY.OK:
        e.preventDefault();
        this._activate();
        return true;
      case KEY.UP:
      case KEY.DOWN:
      case KEY.BACK:
      case 27:
        e.preventDefault();
        this.hide();
        return true;
      default:
        return false; // let media keys etc. fall through
    }
    e.preventDefault();
    this._render();
    this._bump();
    return true;
  }
}
