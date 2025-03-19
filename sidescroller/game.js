const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

// Set canvas size
canvas.width = 800;
canvas.height = 300;

// Game constants
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const OBSTACLE_SPEED = 5;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_HEIGHT = 40;

// Game state
let score = 0;
let gameOver = false;
let player = {
    x: 50,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    velocityY: 0,
    isJumping: false
};

let obstacles = [];

// Event listeners
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else if (!player.isJumping) {
            jump();
        }
    }
});

// Game functions
function jump() {
    player.isJumping = true;
    player.velocityY = JUMP_FORCE;
}

function resetGame() {
    score = 0;
    gameOver = false;
    obstacles = [];
    player.y = canvas.height - 60;
    player.velocityY = 0;
    player.isJumping = false;
    scoreElement.textContent = `Score: ${score}`;
    gameOverElement.classList.add('hidden');
}

function createObstacle() {
    obstacles.push({
        x: canvas.width,
        y: canvas.height - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT
    });
}

function update() {
    if (gameOver) return;

    // Update player
    player.velocityY += GRAVITY;
    player.y += player.velocityY;

    // Ground collision
    if (player.y > canvas.height - 60) {
        player.y = canvas.height - 60;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= OBSTACLE_SPEED;
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++;
            scoreElement.textContent = `Score: ${score}`;
        }
    }

    // Check collisions
    for (const obstacle of obstacles) {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            gameOver = true;
            gameOverElement.classList.remove('hidden');
            break;
        }
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();

    // Draw player
    ctx.fillStyle = '#333';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw obstacles
    ctx.fillStyle = '#666';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
setInterval(createObstacle, 2000);
gameLoop(); 