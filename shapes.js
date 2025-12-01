export const SHAPES = {
    TRIANGLE: {
        color: '#FF0000',
        rotations: [
            // UP
            [[0, 0], [1, -1], [1, 0], [1, 1]],
            // DOWN (inverted)
            [[0, 0], [-1, -1], [-1, 0], [-1, 1]]
        ]
    },

    BAR: {
        color: '#00FFFF',
        rotations: [
            // Horizontal
            [[0, 0], [0, 1], [0, 2], [0, 3]],
            // Vertical (stacked)
            [[0, 0], [1, 0], [2, 0], [3, 0]],
            // Diagonal / Slanted?
            [[0, 0], [1, 1], [2, 2], [3, 3]]
        ]
    },

    CHEVRON: {
        color: '#FFFF00',
        rotations: [
            // Horizontal
            [[0, 0], [0, 1], [0, 2], [1, 1]],
            // Vertical-ish
            [[0, 0], [1, 0], [2, 0], [1, -1]]
        ]
    },

    HOOK: {
        color: '#0000FF',
        rotations: [
            [[0, 0], [1, 0], [2, 0], [2, 1]],
            [[0, 0], [0, 1], [0, 2], [1, 0]]
        ]
    },

    HEX: {
        color: '#00FF00',
        rotations: [
            // 4 triangles forming a rhombus/hex part
            [[0, 0], [0, 1], [1, 0], [1, 1]],
            // Rotated 60 degrees
            [[0, 0], [1, -1], [1, 0], [2, 0]],
            // Rotated 120 degrees
            [[0, 0], [0, 1], [1, 1], [1, 2]]
        ]
    }
};
