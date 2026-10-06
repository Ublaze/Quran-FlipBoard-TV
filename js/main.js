import { Board } from './Board.js';
import { SoundEngine } from './SoundEngine.js';
import { VerseRotator } from './VerseRotator.js';
import { RemoteController } from './RemoteController.js';
import { Settings, loadSettings } from './Settings.js';
import { ControlBar } from './ControlBar.js';
import { Store } from './Store.js';
import { TvPlatform } from './TvPlatform.js';
import { VERSES } from '../data/verses.js';

document.addEventListener('DOMContentLoaded', () => {
  const state = loadSettings();
  const saved = Store.load();
  const pauseBadge = document.getElementById('pause-badge');

  const board = new Board();
  const sound = new SoundEngine();
  let controlBar = null;

  const rotator = new VerseRotator(board, sound, VERSES, {
    pace: state.pace,
    orderMode: state.order,
    savedOrder: saved.order,
    savedPosition: saved.position,
    // Remember where we are so a relaunch continues from the same verse
    onChange: () => Store.save({ order: rotator.order, position: rotator.position }),
    onPauseChange: (paused) => {
      pauseBadge.classList.toggle('visible', paused);
      if (controlBar) controlBar.setPaused(paused);
    },
  });

  const settings = new Settings(rotator, sound, state);
  controlBar = new ControlBar(rotator, settings);
  new RemoteController(rotator, sound, settings, controlBar);

  rotator.start();
  TvPlatform.keepScreenAwake();
  showStartHint();

  // Relaunched from the launcher while already running: just make sure we're moving
  document.addEventListener('webOSRelaunch', () => {
    rotator.release('hidden');
    rotator.resume();
  });

  // TV switched input / app backgrounded: hold, then resume the same verse
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) rotator.hold('hidden');
    else rotator.release('hidden');
  });
});

/** One gentle hint on launch so people know OK opens the controls. */
function showStartHint() {
  const hint = document.getElementById('nav-hint');
  const menuOpen = () => document.getElementById('control-bar').classList.contains('visible')
    || document.getElementById('settings-overlay').classList.contains('open');
  setTimeout(() => { if (!menuOpen()) hint.classList.add('visible'); }, 2500);
  setTimeout(() => hint.classList.remove('visible'), 9500);
}
