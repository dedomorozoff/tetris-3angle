import { Grid } from './grid.js';
import { SHAPES } from './shapes.js';
import { Piece } from './piece.js';

export class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // Grid setup
        this.sideLength = 40;
        this.cols = Math.floor(this.width / (this.sideLength / 2)) - 1;
        this.rows = Math.floor(this.height / (this.sideLength * Math.sqrt(3) / 2));

        this.grid = new Grid(this.rows, this.cols, this.sideLength);

        this.piece = null;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.score = 0;
        this.gameOver = false;
        this.paused = false;

        this.spawnPiece();
        this.setupInput();

        console.log(`Game initialized: ${this.rows}x${this.cols}`);
    }

    setupInput() {
        // Клавиатура
        document.addEventListener('keydown', (e) => {
            if (!this.piece || this.gameOver) return;

            switch (e.key) {
                case 'ArrowLeft':
                    this.movePiece(0, -1);
                    break;
                case 'ArrowRight':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowDown':
                    this.movePiece(1, 0);
                    this.dropCounter = 0; // Reset drop timer on manual drop
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                case 'Spacebar':
                    this.togglePause();
                    break;
                case 'r':
                case 'R':
                    this.resetGame();
                    break;
            }
        });

        // Сенсорные / экранные кнопки / мышь
        const bindControl = (selector, handler) => {
            const el = document.querySelector(selector);
            if (!el) return;

            const onPress = (event) => {
                event.preventDefault();
                if (!this.piece || this.gameOver) return;
                handler();
            };

            // pointerdown работает и с мышью, и с тачем
            el.addEventListener('pointerdown', onPress);
        };

        bindControl('[data-action="left"]', () => this.movePiece(0, -1));
        bindControl('[data-action="right"]', () => this.movePiece(0, 1));
        bindControl('[data-action="down"]', () => {
            this.movePiece(1, 0);
            this.dropCounter = 0;
        });
        bindControl('[data-action="rotate"]', () => this.rotatePiece());

        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this.togglePause();
            });
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this.resetGame();
            });
        }
    }

    spawnPiece() {
        const shapeKeys = Object.keys(SHAPES);
        const randomKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
        const shape = SHAPES[randomKey];

        // Start in middle
        const startCol = Math.floor(this.cols / 2);
        const startRow = 0;

        this.piece = new Piece(shape, startRow, startCol);

        // Check if spawn is valid
        if (!this.isValidMove(this.piece, 0, 0)) {
            this.gameOver = true;
            // Draw one last time to show the collision
            this.draw();
            setTimeout(() => alert('Game Over! Score: ' + this.score), 10);
        }
    }

    movePiece(dr, dc) {
        if (this.isValidMove(this.piece, dr, dc)) {
            this.piece.row += dr;
            this.piece.col += dc;
        }
    }

    rotatePiece() {
        if (!this.piece) return;
        const nextCells = this.piece.getNextRotationCells();
        if (this.isValidCells(nextCells)) {
            this.piece.rotate();
        }
    }

    isValidMove(piece, dr, dc) {
        const cells = piece.getCells(dr, dc);
        return this.isValidCells(cells);
    }

    isValidCells(cells) {
        for (const [r, c] of cells) {
            if (!this.grid.isValid(r, c)) return false;
            if (this.grid.isOccupied(r, c)) return false;
        }
        return true;
    }

    update(deltaTime) {
        if (this.gameOver || this.paused) return;

        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.dropPiece();
            this.dropCounter = 0;
        }
    }

    dropPiece() {
        if (this.isValidMove(this.piece, 1, 0)) {
            this.piece.row++;
        } else {
            this.lockPiece();
        }
    }

    lockPiece() {
        const cells = this.piece.getCells();
        for (const [r, c] of cells) {
            this.grid.matrix[r][c] = this.piece.color;
        }

        const cleared = this.grid.clearFullRows();
        if (cleared > 0) {
            this.score += cleared * 100;
            document.getElementById('score').innerText = `Счет: ${this.score}`;
        }

        this.spawnPiece();
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.grid.draw(this.ctx);

        if (this.piece) {
            this.piece.draw(this.ctx, this.grid);
        }

        if (this.gameOver || this.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            const text = this.gameOver ? 'GAME OVER' : 'PAUSED';
            this.ctx.fillText(text, this.width / 2, this.height / 2);
        }
    }

    togglePause() {
        if (this.gameOver) return;
        this.paused = !this.paused;
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = this.paused ? '▶' : '⏸';
        }
    }

    resetGame() {
        this.grid = new Grid(this.rows, this.cols, this.sideLength);
        this.piece = null;
        this.dropCounter = 0;
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.innerText = `Счет: ${this.score}`;
        }
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = '⏸';
        }
        this.spawnPiece();
    }
}
