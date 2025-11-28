# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Triangle Tetris is a small, framework-free HTML5/Canvas game. The entry point is `index.html`, which loads a single ES6 module bundle (`main.js`). Game logic is implemented in a few focused JavaScript modules with no external build, test, or dependency tooling.

## How to run the game

This project does not require a build step.

- Open `index.html` in any modern browser (Chrome, Firefox, Edge). On Windows you can run from the repo root:
  - PowerShell: `start index.html`
  - cmd.exe: `start index.html`
- Alternatively, serve the folder via a simple static server if the browser blocks `file://` module imports.
  - PowerShell (Python 3 installed): `python -m http.server 8000`
  - Then open `http://localhost:8000/index.html` in your browser.

There is no test or lint tooling configured in this repository.

## High-level architecture

### Entry point and game loop

- `index.html`
  - Declares the `<canvas id="game-canvas">` element and a simple UI panel (score + controls help).
  - Loads `main.js` as an ES6 module.
- `main.js`
  - Instantiates `Game` from `game.js` with the canvas and 2D rendering context.
  - Owns the `requestAnimationFrame` loop.
    - On each animation frame it computes `deltaTime`, calls `game.update(deltaTime)` then `game.draw()`.
  - All per-frame logic lives behind the `Game` class; `main.js` stays very thin.

### Core game domain model

- `game.js` — orchestration and game state
  - Constructs the triangular `Grid` (rows/cols inferred from canvas dimensions and triangle side length).
  - Manages the currently active `Piece`, score, timers, and game-over state.
  - Input handling:
    - Listens to `keydown` on `document` and maps arrow keys to `movePiece`, `dropPiece`, and `rotatePiece`.
    - Resets the gravity timer when the user manually drops with ArrowDown.
  - Gravity and locking:
    - `update(deltaTime)` accumulates a `dropCounter`; once it exceeds `dropInterval`, invokes `dropPiece()`.
    - `dropPiece()` attempts to move the piece down one row; on collision, calls `lockPiece()`.
    - `lockPiece()` writes the active piece cells into `grid.matrix`, clears full rows via `grid.clearFullRows()`, updates the score and spawns the next piece.
  - Collision and validity:
    - Uses `isValidMove(piece, dr, dc)` and `isValidCells(cells)` to ensure moves and rotations stay within bounds and avoid occupied cells.
  - Rendering:
    - `draw()` clears the canvas, draws the static grid, then overlays the active piece.
    - On game over, draws a semi-transparent overlay and centered "GAME OVER" text, and also alerts once when spawn fails.

- `piece.js` — falling piece representation
  - Encapsulates a tetriamond instance: its `shape` definition, `row`/`col` origin, `rotationIndex`, and `color`.
  - Coordinate system:
    - Each shape rotation is an array of relative `[rowOffset, colOffset]` pairs.
    - `getCells(dr = 0, dc = 0, rotationIndex = this.rotationIndex)` converts these offsets into absolute grid coordinates, optionally with trial deltas and a trial rotation.
  - Rotation and preview:
    - `getNextRotationCells()` computes the cells for the next rotation state without mutating `rotationIndex`.
    - `rotate()` advances `rotationIndex` modulo the number of rotations.
  - Rendering:
    - `draw(ctx, grid)` delegates actual triangle drawing to `grid.drawTriangle` for consistency with the static grid.

- `grid.js` — triangular playfield
  - Represents the board as a 2D `matrix[rows][cols]` of either `null` (empty) or a color string (occupied).
  - Geometric mapping:
    - Each logical column corresponds to a triangle base width of `sideLength / 2` in canvas space.
    - Each row step maps to a vertical offset of `height = sideLength * sqrt(3) / 2`.
    - Even and odd columns alternate triangle orientation:
      - Even columns: upward-pointing triangles.
      - Odd columns: downward-pointing triangles.
  - Rendering:
    - `draw(ctx)` iterates all cells and calls `drawTriangle` with either the stored color or the background grid color `#222`.
    - `drawTriangle(ctx, r, c, color)` computes vertex positions based on `(r, c)` and draws a filled triangle with:
      - Neon glow (via `shadowBlur`/`shadowColor`) for occupied cells.
      - Subtle grid lines (`strokeStyle = '#333'`).
  - Board logic:
    - `isValid(r, c)` bounds-checks coordinates.
    - `isOccupied(r, c)` returns true if within bounds and the matrix cell is non-null.
    - `clearFullRows()` scans from bottom up, removes any row where all cells are non-null, unshifts new empty rows at the top, and returns the number of cleared lines.

- `shapes.js` — tetriamond definitions
  - Exports a `SHAPES` object keyed by shape name: `TRIANGLE`, `BAR`, `CHEVRON`, `HOOK`, `HEX`.
  - Each shape provides:
    - `color`: the neon color used for drawing.
    - `rotations`: an array of rotations; each rotation is an array of `[rowOffset, colOffset]` pairs relative to the piece origin.
  - Rotations include non-trivial patterns (e.g., diagonal bar) tuned to the underlying triangular grid.

### UI and styling

- `style.css`
  - Centers the `#layout` container on a dark background with box-shadow and rounded corners.
  - Arranges `#game-container` (canvas) and `#ui-panel` (score + controls text) in a horizontal flex layout.
  - Applies neon styling to the score label and subtle glow to the title.
- `index.html` also contains a basic control legend in Russian, mirroring the keyboard bindings in `Game.setupInput`.

## Working with and extending the codebase

- New gameplay features (e.g., new piece types, scoring rules, or advanced rotation behaviors) usually require coordinated changes in:
  - `shapes.js` (shape definition and rotations),
  - `piece.js` (how rotations are computed and visualized), and
  - `game.js` (spawn logic, scoring, and collision rules).
- Visual tweaks to the board or triangles are done in `grid.js` (geometry, glow, grid lines) and `style.css` (layout and overall theme).
- Input behavior changes should go through `Game.setupInput()` in `game.js`; `main.js` does not handle input directly.
