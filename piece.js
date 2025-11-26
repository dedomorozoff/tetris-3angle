export class Piece {
    constructor(shape, row, col) {
        this.shape = shape;
        this.row = row;
        this.col = col;
        this.rotationIndex = 0;
        this.color = shape.color;
    }

    getCells(dr = 0, dc = 0, rotationIndex = this.rotationIndex) {
        const rotation = this.shape.rotations[rotationIndex];
        return rotation.map(([r, c]) => [this.row + r + dr, this.col + c + dc]);
    }

    getNextRotationCells() {
        const nextIndex = (this.rotationIndex + 1) % this.shape.rotations.length;
        return this.getCells(0, 0, nextIndex);
    }

    rotate() {
        this.rotationIndex = (this.rotationIndex + 1) % this.shape.rotations.length;
    }

    draw(ctx, grid) {
        const cells = this.getCells();
        for (const [r, c] of cells) {
            // Use grid's drawTriangle method but don't fill the grid matrix yet
            grid.drawTriangle(ctx, r, c, this.color);
        }
    }
}
