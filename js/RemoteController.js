import { KEY } from './constants.js';
import { TvPlatform } from './TvPlatform.js';

/**
 * LG Magic Remote / D-pad / keyboard input.
 *
 * Main screen:  ◀ ▶ previous/next · OK, ▲ ▼ show controls · Play/Pause keys
 *               · GREEN settings · BACK exit to Home (webOS requirement)
 * Overlays (settings, control bar) get first refusal on every key.
 */
export class RemoteController {
  constructor(verseRotator, soundEngine, settings, controlBar) {
    this.rotator = verseRotator;
    this.sound = soundEngine;
    this.settings = settings;
    this.controlBar = controlBar;
    this._cursorTimer = null;

    this._bindEvents();
  }

  _bindEvents() {
    document.addEventListener('keydown', (e) => this._onKey(e));

    // Web Audio can only start after a user gesture
    const initAudio = () => this.sound.init();
    document.addEventListener('keydown', initAudio, { once: true });
    document.addEventListener('click', initAudio, { once: true });

    // Magic Remote pointer: show the cursor + controls while it moves, hide when idle
    document.addEventListener('mousemove', () => this._onPointerMove());
  }

  _onPointerMove() {
    document.body.classList.add('pointer-active');
    clearTimeout(this._cursorTimer);
    this._cursorTimer = setTimeout(() => document.body.classList.remove('pointer-active'), 4000);
    if (!this.settings.isOpen && !this.controlBar.isOpen) this.controlBar.show();
  }

  _onKey(e) {
    if (this.settings.handleKey(e)) return;
    if (this.controlBar.handleKey(e)) return;

    switch (e.keyCode) {
      case KEY.RIGHT:
      case KEY.FAST_FORWARD:
      case KEY.CH_UP:
        e.preventDefault();
        this.rotator.next();
        break;

      case KEY.LEFT:
      case KEY.REWIND:
      case KEY.CH_DOWN:
        e.preventDefault();
        this.rotator.prev();
        break;

      case KEY.OK:
        e.preventDefault();
        if (this.rotator.paused) this.rotator.resume(); // matches the "Paused" badge text
        else this.controlBar.show(1);
        break;

      case KEY.UP:
      case KEY.DOWN:
        e.preventDefault();
        this.controlBar.show(1);
        break;

      case KEY.PLAY:
        e.preventDefault();
        this.rotator.resume();
        break;

      case KEY.PAUSE:
      case KEY.STOP:
        e.preventDefault();
        this.rotator.pause();
        break;

      case 32: // Space (keyboard testing)
        e.preventDefault();
        this.rotator.togglePause();
        break;

      case KEY.GREEN:
      case 83: // S (keyboard testing)
        e.preventDefault();
        this.settings.open();
        break;

      case 70: // F (browser testing)
        this._toggleFullscreen();
        break;

      case KEY.BACK:
      case 27: // Escape
        e.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen();
        else TvPlatform.exitApp();
        break;
    }
  }

  _toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }
}
