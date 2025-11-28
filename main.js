import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function setupResponsiveCanvas(canvas) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;

    const baseWidth = 480;
    const baseHeight = 640;
    const aspect = baseHeight / baseWidth;

    const availableWidth = Math.min(window.innerWidth, baseWidth);
    const reservedForUI = 110; // запас под нижние кнопки и отступы
    const availableHeight = Math.max(320, window.innerHeight - reservedForUI);

    let targetHeight = availableHeight;
    let targetWidth = Math.round(targetHeight / aspect);

    if (targetWidth > availableWidth) {
        targetWidth = availableWidth;
        targetHeight = Math.round(targetWidth * aspect);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
}

setupResponsiveCanvas(canvas);

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
