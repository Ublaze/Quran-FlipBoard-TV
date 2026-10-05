import { Tile } from './Tile.js';
import { COLS, ROWS, STAGGER_DELAY, ACCENT_PAIRS } from './constants.js';

export class Board {
  constructor() {
    this.grid = document.getElementById('tile-grid');
    this.board = document.getElementById('board');
    this.tiles = [];
    this.accentIndex = 0;
    this._init();
    this._onResize = this._calcTileSize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  _init() {
    // Calculate optimal tile size for the viewport
    this._calcTileSize();

    // Set grid template
    this.grid.style.gridTemplateColumns = `repeat(${COLS}, var(--tile-size))`;
    this.grid.style.gridTemplateRows = `repeat(${ROWS}, var(--tile-size))`;

    // Create tiles
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const tile = new Tile();
        this.grid.appendChild(tile.element);
        row.push(tile);
      }
      this.tiles.push(row);
    }
  }

  /** Dynamically calculate tile size to fit the viewport */
  _calcTileSize() {
    // Read actual computed values from DOM
    const appStyle = getComputedStyle(document.getElementById('app'));
    const boardStyle = getComputedStyle(this.board);
    const gridStyle = getComputedStyle(this.grid);

    const appPadH = parseFloat(appStyle.paddingLeft) + parseFloat(appStyle.paddingRight);
    const boardPadH = parseFloat(boardStyle.paddingLeft) + parseFloat(boardStyle.paddingRight);
    const gap = parseFloat(gridStyle.gap) || parseFloat(gridStyle.rowGap) || 4;

    const availableWidth = window.innerWidth - appPadH - boardPadH;
    const availableHeight = window.innerHeight * 0.42;

    const maxTileW = Math.floor((availableWidth - (COLS - 1) * gap) / COLS);
    const maxTileH = Math.floor((availableHeight - (ROWS - 1) * gap) / ROWS);
    const tileSize = Math.max(20, Math.min(maxTileW, maxTileH, 70)); // clamp 20-70px

    document.documentElement.style.setProperty('--tile-size', `${tileSize}px`);
  }

  /**
   * Display a message on the board.
   * @param {string[]} lines - Array of strings, one per row (max ROWS).
   *                           Each line is center-padded to COLS.
   */
  displayMessage(lines) {
    const formatted = this._formatLines(lines);
    const promises = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const targetChar = formatted[r][c];
        const tile = this.tiles[r][c];
        const delay = (r * COLS + c) * STAGGER_DELAY;
        promises.push(tile.scrambleTo(targetChar, delay));
      }
    }

    // Cycle accent bar colors
    this._cycleAccents();

    return Promise.all(promises);
  }

  /** Format lines into a ROWS x COLS character grid, centered */
  _formatLines(lines) {
    const result = [];
    for (let r = 0; r < ROWS; r++) {
      const line = (lines[r] || '').toUpperCase();
      if (line.length >= COLS) {
        result.push(line.substring(0, COLS));
      } else {
        // Center-pad
        const padLeft = Math.floor((COLS - line.length) / 2);
        const padRight = COLS - line.length - padLeft;
        result.push(' '.repeat(padLeft) + line + ' '.repeat(padRight));
      }
    }
    return result;
  }

  /** Cycle accent bar corner colors */
  _cycleAccents() {
    const pair = ACCENT_PAIRS[this.accentIndex % ACCENT_PAIRS.length];
    this.accentIndex++;

    // Colours are read by the ::before/::after pseudo-elements in board.css
    this.board.style.setProperty('--accent-before', pair[0]);
    this.board.style.setProperty('--accent-after', pair[1]);
  }

  /** Clear all tiles instantly */
  clear() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.tiles[r][c].stop();
        this.tiles[r][c].setChar(' ');
      }
    }
  }
}
