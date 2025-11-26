export class Grid {
    constructor(rows, cols, sideLength) {
        this.rows = rows;
        this.cols = cols;
        this.sideLength = sideLength;
        this.height = sideLength * Math.sqrt(3) / 2;

        // 2D array storing color strings or null
        this.matrix = Array(rows).fill().map(() => Array(cols).fill(null));
    }

    draw(ctx) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.drawTriangle(ctx, r, c, this.matrix[r][c] || '#222');
            }
        }
    }

    drawTriangle(ctx, r, c, color) {
        const x = c * this.sideLength / 2;
        const y = r * this.height;

        ctx.fillStyle = color;

        // Add glow
        if (color !== '#222') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();

        if (c % 2 === 0) {
            // Pointing UP
            // (x, y+h) -> (x+side, y+h) -> (x+side/2, y)
            ctx.moveTo(x, y + this.height);
            ctx.lineTo(x + this.sideLength, y + this.height);
            ctx.lineTo(x + this.sideLength / 2, y);
        } else {
            // Pointing DOWN
            // (x+side/2, y) -> (x+1.5side, y) -> (x+side, y+h)
            // Vertices: (side/2, 0), (1.5side, 0), (side, h) relative to row top
            ctx.moveTo(x, y);
            ctx.lineTo(x + this.sideLength, y);
            ctx.lineTo(x + this.sideLength / 2, y + this.height);
        }

        ctx.closePath();
        ctx.fill();

        // Reset shadow for stroke
        ctx.shadowBlur = 0;

        // Stroke for grid lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    isValid(r, c) {
        return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
    }

    isOccupied(r, c) {
        return this.isValid(r, c) && this.matrix[r][c] !== null;
    }

    clearFullRows() {
        let linesCleared = 0;
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.matrix[r].every(cell => cell !== null)) {
                // Remove this row
                this.matrix.splice(r, 1);
                // Add new empty row at top
                this.matrix.unshift(Array(this.cols).fill(null));
                linesCleared++;
                r++; // Check same index again (since rows shifted down)
            }
        }
        return linesCleared;
    }
}
