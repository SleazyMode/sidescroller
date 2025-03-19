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
const BASE_OBSTACLE_SPEED = 4;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_HEIGHT = 40;
const PLAYER_SPEED = 3;
const GROUND_Y = 240;
const DIFFICULTY_INCREASE_INTERVAL = 150;
const MIN_OBSTACLE_SPACING = 250;
const MAX_OBSTACLE_SPACING = 400;
const MAX_OBSTACLE_SPEED = 10;
const SPEED_INCREASE = 0.3;

// Sound effects with error handling
const jumpSound = new Audio('assets/sounds/jump3.wav');
jumpSound.volume = 0.3;
jumpSound.onerror = () => console.warn('Jump sound failed to load');

const gameOverSound = new Audio('assets/sounds/game-over.wav');
gameOverSound.onerror = () => console.warn('Game over sound failed to load');

const backgroundMusic = new Audio('assets/sounds/background-music.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.2;
backgroundMusic.onerror = () => console.warn('Background music failed to load');

// Obstacle types with easier start
const OBSTACLE_TYPES = {
    NORMAL: {
        width: 40,
        height: 80,
        color: '#e74c3c', // Red
        points: 1,
        difficulty: 0
    },
    TALL: {
        width: 50,
        height: 100,
        color: '#3498db', // Blue
        points: 2,
        difficulty: 25 // Appears at 25 points
    },
    WIDE: {
        width: 80,
        height: 60,
        color: '#2ecc71', // Green
        points: 2,
        difficulty: 50 // Appears at 50 points
    },
    SMALL: {
        width: 30,
        height: 50,
        color: '#f1c40f', // Yellow
        points: 1,
        difficulty: 75 // Appears at 75 points
    }
};

// Game state
let score = 0;
let gameOver = false;
let currentObstacleSpeed = BASE_OBSTACLE_SPEED;
let lastObstacleX = 0;
let player = {
    x: 50, // Fixed x position
    y: canvas.height - 60,
    width: 40,
    height: 40,
    velocityY: 0,
    isJumping: false,
    canDoubleJump: false,
    // Sprite properties
    sprites: {
        idle: new Image(),
        run: new Image(),
        jump: new Image(),
        fall: new Image(),
        doubleJump: new Image(),
        hit: new Image(),
        wallJump: new Image()
    },
    currentAnimation: 'run',
    frameWidth: 32,
    frameHeight: 32,
    currentFrame: 0,
    frameCounts: {
        idle: 11,
        run: 12,
        jump: 1,
        fall: 1,
        doubleJump: 6,
        hit: 7,
        wallJump: 5
    },
    frameDelay: 20,
    frameTimer: 0,
    direction: 1
};

// Load sprites
player.sprites.idle.src = 'assets/sprites/ninja_frog/Idle (32x32).png';
player.sprites.run.src = 'assets/sprites/ninja_frog/Run (32x32).png';
player.sprites.jump.src = 'assets/sprites/ninja_frog/Jump (32x32).png';
player.sprites.fall.src = 'assets/sprites/ninja_frog/Fall (32x32).png';
player.sprites.doubleJump.src = 'assets/sprites/ninja_frog/Double Jump (32x32).png';
player.sprites.hit.src = 'assets/sprites/ninja_frog/Hit (32x32).png';
player.sprites.wallJump.src = 'assets/sprites/ninja_frog/Wall Jump (32x32).png';

// Add sprite loading checks
let loadedSprites = 0;
const totalSprites = Object.keys(player.sprites).length;

Object.keys(player.sprites).forEach(key => {
    player.sprites[key].onload = () => {
        loadedSprites++;
        console.log(`${key} sprite loaded successfully`);
        if (loadedSprites === totalSprites) {
            console.log('All sprites loaded successfully');
        }
    };
    player.sprites[key].onerror = () => {
        console.error(`Failed to load ${key} sprite`);
    };
});

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
    if (!player.isJumping) {
        player.isJumping = true;
        player.velocityY = JUMP_FORCE;
        player.canDoubleJump = true;
        player.currentAnimation = 'jump';
        player.currentFrame = 0;
        jumpSound.currentTime = 0;
        jumpSound.play();
    } else if (player.canDoubleJump) {
        player.velocityY = JUMP_FORCE * 0.8; // Slightly weaker second jump
        player.canDoubleJump = false;
        player.currentAnimation = 'doubleJump';
        player.currentFrame = 0;
        jumpSound.currentTime = 0;
        jumpSound.play();
    }
}

function resetGame() {
    try {
        score = 0;
        gameOver = false;
        obstacles = [];
        currentObstacleSpeed = BASE_OBSTACLE_SPEED;
        lastObstacleX = 0;
        player.x = 50;
        player.y = GROUND_Y;
        player.velocityY = 0;
        player.isJumping = false;
        player.canDoubleJump = false;
        player.currentFrame = 0;
        player.currentAnimation = 'run';
        scoreElement.textContent = `Score: ${score}`;
        gameOverElement.classList.add('hidden');
        
        // Start background music with error handling
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(error => {
            console.warn('Could not play background music:', error);
        });
    } catch (error) {
        console.error('Error resetting game:', error);
    }
}

function createObstacle() {
    try {
        // Get available obstacle types based on current score
        const availableTypes = Object.values(OBSTACLE_TYPES).filter(type => score >= type.difficulty);
        if (availableTypes.length === 0) return; // Safety check
        
        // Randomly select obstacle type from available types
        const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        // Calculate random spacing
        const spacing = Math.random() * (MAX_OBSTACLE_SPACING - MIN_OBSTACLE_SPACING) + MIN_OBSTACLE_SPACING;
        const x = lastObstacleX + spacing;
        
        obstacles.push({
            x: x,
            y: canvas.height - selectedType.height,
            width: selectedType.width,
            height: selectedType.height,
            type: selectedType,
            points: selectedType.points
        });
        
        lastObstacleX = x;
    } catch (error) {
        console.error('Error creating obstacle:', error);
    }
}

function update() {
    if (gameOver) return;

    try {
        // Update difficulty based on score with smoother progression
        if (score > 0 && score % DIFFICULTY_INCREASE_INTERVAL === 0) {
            // Increase speed more aggressively in the beginning, then taper off
            const speedIncrease = Math.max(0.1, SPEED_INCREASE * (1 - score / 1000));
            currentObstacleSpeed = Math.min(currentObstacleSpeed + speedIncrease, MAX_OBSTACLE_SPEED);
            
            // Adjust obstacle spacing based on speed
            const spacingMultiplier = Math.max(0.7, 1 - (currentObstacleSpeed - BASE_OBSTACLE_SPEED) / (MAX_OBSTACLE_SPEED - BASE_OBSTACLE_SPEED));
            MIN_OBSTACLE_SPACING = Math.max(200, 250 * spacingMultiplier);
            MAX_OBSTACLE_SPACING = Math.max(300, 400 * spacingMultiplier);
        }

        // Update player vertical position
        player.velocityY += GRAVITY;
        player.y += player.velocityY;

        // Ground collision
        if (player.y > GROUND_Y) {
            player.y = GROUND_Y;
            player.velocityY = 0;
            player.isJumping = false;
            player.canDoubleJump = false;
            player.currentAnimation = 'run';
        }

        // Update animation state
        if (player.velocityY < 0) {
            player.currentAnimation = player.canDoubleJump ? 'jump' : 'doubleJump';
            player.currentFrame = 0;
        } else if (player.velocityY > 0) {
            player.currentAnimation = 'fall';
            player.currentFrame = 0;
        } else {
            player.currentAnimation = 'run';
        }

        // Always update the run animation frame
        if (player.currentAnimation === 'run') {
            player.frameTimer++;
            if (player.frameTimer >= 3) { // Reduced from 5 to 3 for slightly faster animation
                player.frameTimer = 0;
                player.currentFrame = (player.currentFrame + 1) % player.frameCounts.run;
            }
        }

        // Update sprite animation for non-run animations
        if (player.currentAnimation !== 'run') {
            player.frameTimer++;
            if (player.frameTimer >= player.frameDelay) {
                player.frameTimer = 0;
                player.currentFrame = (player.currentFrame + 1) % player.frameCounts[player.currentAnimation];
            }
        }

        // Update obstacles with current speed
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= currentObstacleSpeed;
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
                score += obstacles[i].points;
                scoreElement.textContent = `Score: ${score}`;
                // Update lastObstacleX to the position of the last remaining obstacle
                if (obstacles.length > 0) {
                    lastObstacleX = obstacles[obstacles.length - 1].x;
                } else {
                    lastObstacleX = 0;
                }
            }
        }

        // Create new obstacles when needed
        if (obstacles.length === 0 || lastObstacleX < canvas.width + 200) {
            createObstacle();
        }

        // Check collisions with a smaller hitbox
        for (const obstacle of obstacles) {
            // Create a smaller hitbox for the player (80% of the original size)
            const playerHitbox = {
                x: player.x + (player.width * 0.1),
                y: player.y + (player.height * 0.1),
                width: player.width * 0.8,
                height: player.height * 0.8
            };

            // Create a smaller hitbox for the obstacle (90% of the original size)
            const obstacleHitbox = {
                x: obstacle.x + (obstacle.width * 0.05),
                y: obstacle.y + (obstacle.height * 0.05),
                width: obstacle.width * 0.9,
                height: obstacle.height * 0.9
            };

            if (playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
                playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
                playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
                playerHitbox.y + playerHitbox.height > obstacleHitbox.y) {
                gameOver = true;
                gameOverElement.classList.remove('hidden');
                gameOverSound.currentTime = 0;
                gameOverSound.play();
                backgroundMusic.pause();
                break;
            }
        }
    } catch (error) {
        console.error('Error in update function:', error);
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ground with gradient for better perspective
    const groundGradient = ctx.createLinearGradient(0, GROUND_Y + 20, 0, canvas.height);
    groundGradient.addColorStop(0, '#666');
    groundGradient.addColorStop(1, '#444');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, GROUND_Y + 20, canvas.width, canvas.height - (GROUND_Y + 20));

    // Draw player sprite
    ctx.save();
    ctx.translate(player.x + (player.direction === -1 ? player.width : 0), player.y);
    ctx.scale(player.direction, 1);
    ctx.drawImage(
        player.sprites[player.currentAnimation],
        player.currentFrame * player.frameWidth,
        0,
        player.frameWidth,
        player.frameHeight,
        0,
        0,
        player.width,
        player.height
    );
    ctx.restore();

    // Draw obstacles with their specific colors and shadows
    obstacles.forEach(obstacle => {
        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height + 5, obstacle.width, 5);
        
        // Draw main obstacle with gradient
        const gradient = ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x, obstacle.y + obstacle.height);
        gradient.addColorStop(0, obstacle.type.color);
        gradient.addColorStop(1, shadeColor(obstacle.type.color, -20));
        ctx.fillStyle = gradient;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 5);
    });
}

// Helper function to shade colors
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

function gameLoop() {
    if (!gameOver) { // Only update if game is not over
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Start background music when game starts
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else if (!player.isJumping) {
            jump();
        }
    }
});

// Start the game
resetGame();
gameLoop(); 