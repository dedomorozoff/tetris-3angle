import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const game = new Game(canvas, ctx);

let lastTime = 0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    game.update(deltaTime);
    game.draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
