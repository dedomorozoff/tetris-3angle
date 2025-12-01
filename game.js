import { Grid } from './grid.js';
import { SHAPES } from './shapes.js';
import { Piece } from './piece.js';

export class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // Grid setup - calculate optimal size to fill canvas proportionally
        const desiredCols = 23; // Желаемое количество колонок для баланса игры
        
        // Calculate sideLength based on canvas width
        // Formula: width = (cols * sideLength/2) + sideLength/2
        this.sideLength = (this.width * 2) / (desiredCols + 1);
        this.cols = desiredCols;
        
        // Calculate rows to fill height
        const triangleHeight = this.sideLength * Math.sqrt(3) / 2;
        this.rows = Math.floor(this.height / triangleHeight);

        this.grid = new Grid(this.rows, this.cols, this.sideLength);

        this.piece = null;
        this.nextPiece = null;
        this.dropInterval = 1000;
        this.dropCounter = 0;
        this.score = 0;
        this.gameOver = false;
        this.paused = false;

        // Next piece preview canvas
        this.nextCanvas = document.getElementById('next-piece-canvas');
        this.nextCtx = this.nextCanvas ? this.nextCanvas.getContext('2d') : null;

        // Bag system for better randomization
        this.shapeBag = [];
        this.fillShapeBag();

        this.generateNextPiece();
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

    fillShapeBag() {
        // Add all shapes to the bag
        const shapeKeys = Object.keys(SHAPES);
        this.shapeBag = [...shapeKeys];
        
        // Shuffle the bag using Fisher-Yates algorithm
        for (let i = this.shapeBag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shapeBag[i], this.shapeBag[j]] = [this.shapeBag[j], this.shapeBag[i]];
        }
    }

    generateNextPiece() {
        // If bag is empty, refill it
        if (this.shapeBag.length === 0) {
            this.fillShapeBag();
        }
        
        // Take the next shape from the bag
        const shapeKey = this.shapeBag.pop();
        this.nextPiece = SHAPES[shapeKey];
    }

    spawnPiece() {
        // Use the next piece
        const shape = this.nextPiece;

        // Start in middle
        const startCol = Math.floor(this.cols / 2);
        const startRow = 0;

        this.piece = new Piece(shape, startRow, startCol);

        // Generate new next piece
        this.generateNextPiece();
        this.drawNextPiece();

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

    drawNextPiece() {
        if (!this.nextCtx || !this.nextPiece) return;

        const canvas = this.nextCanvas;
        const ctx = this.nextCtx;

        // Clear canvas (transparent)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Create a temporary piece for preview
        const previewPiece = new Piece(this.nextPiece, 0, 0);
        
        // Calculate bounds of the shape
        const cells = previewPiece.getCells();
        let minRow = Infinity, maxRow = -Infinity;
        let minCol = Infinity, maxCol = -Infinity;
        
        for (const [r, c] of cells) {
            minRow = Math.min(minRow, r);
            maxRow = Math.max(maxRow, r);
            minCol = Math.min(minCol, c);
            maxCol = Math.max(maxCol, c);
        }

        // Calculate size and center
        const shapeWidth = (maxCol - minCol + 1) * (this.sideLength / 2);
        const shapeHeight = (maxRow - minRow + 1) * (this.sideLength * Math.sqrt(3) / 2);
        
        const scale = Math.min(
            (canvas.width * 0.7) / shapeWidth,
            (canvas.height * 0.7) / shapeHeight
        );

        const scaledSide = this.sideLength * scale;
        const offsetX = (canvas.width - shapeWidth * scale) / 2 - minCol * (scaledSide / 2);
        const offsetY = (canvas.height - shapeHeight * scale) / 2 - minRow * (scaledSide * Math.sqrt(3) / 2);

        // Draw each triangle
        for (const [r, c] of cells) {
            const isUpward = (r + c) % 2 === 0;
            const x = c * (scaledSide / 2) + offsetX;
            const y = r * (scaledSide * Math.sqrt(3) / 2) + offsetY;

            ctx.fillStyle = previewPiece.color;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;

            ctx.beginPath();
            if (isUpward) {
                ctx.moveTo(x, y + scaledSide * Math.sqrt(3) / 2);
                ctx.lineTo(x + scaledSide / 2, y);
                ctx.lineTo(x + scaledSide, y + scaledSide * Math.sqrt(3) / 2);
            } else {
                ctx.moveTo(x, y);
                ctx.lineTo(x + scaledSide, y);
                ctx.lineTo(x + scaledSide / 2, y + scaledSide * Math.sqrt(3) / 2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#000000';
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
        this.nextPiece = null;
        this.dropCounter = 0;
        this.score = 0;
        this.gameOver = false;
        this.paused = false;
        
        // Reset bag system
        this.shapeBag = [];
        this.fillShapeBag();
        
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.innerText = `Счет: ${this.score}`;
        }
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = '⏸';
        }
        this.generateNextPiece();
        this.spawnPiece();
    }
}
