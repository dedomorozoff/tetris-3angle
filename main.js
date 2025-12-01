import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function setupResponsiveCanvas(canvas) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;

    const baseWidth = 480;
    const baseHeight = 640;
    const aspect = baseHeight / baseWidth;

    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    const availableWidth = Math.min(vw * 0.95, baseWidth); // 95% ширины экрана
    const maxCanvasHeight = Math.max(320, Math.min(baseHeight, vh * 0.92)); // ~92% высоты телефона

    let targetHeight = maxCanvasHeight;
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
