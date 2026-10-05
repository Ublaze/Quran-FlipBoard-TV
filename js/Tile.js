import {
  CHAR_SET,
  SCRAMBLE_COLORS,
  LIGHT_COLORS,
  SCRAMBLE_STEPS,
  SCRAMBLE_STEP_MS,
  FLIP_DURATION,
} from './constants.js';

export class Tile {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'tile';

    this.charEl = document.createElement('span');
    this.charEl.className = 'tile-char';
    this.charEl.textContent = ' ';
    this.el.appendChild(this.charEl);

    this.currentChar = ' ';
    this._scrambleTimer = null;
  }

  get element() {
    return this.el;
  }

  /** Scramble to a target character with colored backgrounds */
  scrambleTo(char, delay = 0) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (char === this.currentChar) {
          resolve();
          return;
        }

        this.el.classList.add('scrambling');
        let step = 0;

        this._scrambleTimer = setInterval(() => {
          if (step < SCRAMBLE_STEPS) {
            // Random character
            const randChar = CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
            this.charEl.textContent = randChar;

            // Cycling background color
            const color = SCRAMBLE_COLORS[step % SCRAMBLE_COLORS.length];
            this.el.style.backgroundColor = color;

            // Light/dark text contrast
            if (LIGHT_COLORS.includes(color)) {
              this.el.classList.add('light-bg');
            } else {
              this.el.classList.remove('light-bg');
            }

            step++;
          } else {
            // Settle to final character
            clearInterval(this._scrambleTimer);
            this._scrambleTimer = null;

            this.el.classList.remove('scrambling', 'light-bg');
            this.el.style.backgroundColor = '';
            this.charEl.textContent = char;
            this.currentChar = char;

            // Settle animation
            this.el.classList.add('settling');
            if (char !== ' ') {
              this.el.classList.add('active');
            } else {
              this.el.classList.remove('active');
            }

            setTimeout(() => {
              this.el.classList.remove('settling');
              resolve();
            }, FLIP_DURATION);
          }
        }, SCRAMBLE_STEP_MS);
      }, delay);
    });
  }

  /** Instantly set character without animation */
  setChar(char) {
    this.charEl.textContent = char;
    this.currentChar = char;
    if (char !== ' ') {
      this.el.classList.add('active');
    } else {
      this.el.classList.remove('active');
    }
  }

  /** Stop any running scramble */
  stop() {
    if (this._scrambleTimer) {
      clearInterval(this._scrambleTimer);
      this._scrambleTimer = null;
    }
    this.el.classList.remove('scrambling', 'settling', 'light-bg');
    this.el.style.backgroundColor = '';
  }
}
