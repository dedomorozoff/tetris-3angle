import { Game } from './game.js';
import { Grid } from './grid.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function setupResponsiveCanvas(canvas) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const isTabletPortrait = window.matchMedia('(max-width: 1024px) and (orientation: portrait)').matches;
    const isTabletLandscape = window.matchMedia('(min-width: 769px) and (max-width: 1024px) and (orientation: landscape)').matches;
    
    if (!isMobile && !isTabletPortrait && !isTabletLandscape) return;

    const baseWidth = 480;
    const baseHeight = 624;
    const aspect = baseHeight / baseWidth;

    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    let availableWidth, maxCanvasHeight;

    if (isTabletLandscape) {
        // Планшет в ландшафте - используем высоту экрана
        maxCanvasHeight = Math.min(baseHeight, vh * 0.85);
        availableWidth = Math.min(vw * 0.6, baseWidth);
    } else if (isTabletPortrait) {
        // Планшет в портрете - больше места
        availableWidth = Math.min(vw * 0.9, baseWidth);
        maxCanvasHeight = Math.min(baseHeight, vh * 0.75);
    } else {
        // Мобильный телефон
        availableWidth = Math.min(vw * 0.95, baseWidth);
        maxCanvasHeight = Math.max(320, Math.min(baseHeight, vh * 0.92));
    }

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

// Обработка изменения ориентации и размера экрана для планшетов
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        setupResponsiveCanvas(canvas);
        
        // Пересоздаем игру только если размер значительно изменился
        if (Math.abs(canvas.width - oldWidth) > 50 || Math.abs(canvas.height - oldHeight) > 50) {
            const oldScore = game.score;
            const wasPaused = game.paused;
            game.canvas = canvas;
            game.width = canvas.width;
            game.height = canvas.height;
            
            // Пересчитываем размеры сетки
            const desiredCols = 23;
            game.sideLength = (game.width * 2) / (desiredCols + 1);
            game.cols = desiredCols;
            const triangleHeight = game.sideLength * Math.sqrt(3) / 2;
            game.rows = Math.floor(game.height / triangleHeight);
            
            game.grid = new Grid(game.rows, game.cols, game.sideLength);
            game.score = oldScore;
            game.paused = wasPaused;
            
            console.log(`Canvas resized: ${canvas.width}x${canvas.height}, Grid: ${game.rows}x${game.cols}`);
        }
    }, 300);
});

let lastTime = 0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    game.update(deltaTime);
    game.draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
