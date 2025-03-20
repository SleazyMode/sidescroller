const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');

// Set canvas size
canvas.width = 1280;  // Keep width the same
canvas.height = 480;  // Reduced from 720 to fit everything on screen

// Game constants
const GRAVITY = 0.8;
const JUMP_FORCE = -16;
const PLAYER_SPEED = 4;
const GROUND_Y = canvas.height - 60;
const CAMERA_OFFSET = 400;
const AIR_CONTROL = 0.7;
const MAX_FALL_SPEED = 12;
const GROUND_FRICTION = 0.85;
const JUMP_FORWARD_BOOST = 3;
const SCREEN_MARGIN = 200;
const TILE_SIZE = 32;
const WORLD_BOUNDS = {
    left: 0,
    right: TILE_SIZE * 150  // Reduced from 200 to 150 for better control
};

// Camera settings
const CAMERA = {
    x: 0,
    targetX: 0,
    deadzone: {
        left: canvas.width * 0.3,  // Reduced from 0.4 to 0.3 for better control
        right: canvas.width * 0.7   // Increased from 0.6 to 0.7 for better control
    },
    speed: 0.2,  // Reduced from 0.3 to 0.2 for smoother camera
    bounds: {
        left: 0,
        right: WORLD_BOUNDS.right - canvas.width
    }
};

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

// Enemy types
const ENEMY_TYPES = {
    GOOMBA: {
        width: 36,
        height: 30,
        speed: 1,
        color: '#8B4513',
        points: 100,
        health: 1
    },
    KOOPA: {
        width: 36,
        height: 30,
        speed: 2.5,  // Increased from 1.5 to 2.5
        color: '#2ecc71',
        points: 200,
        health: 2,
        // Sprite properties
        sprites: {
            walk: new Image(),
            run: new Image(),
            hit1: new Image(),
            hit2: new Image()
        },
        currentAnimation: 'walk',
        frameWidth: 36,
        frameHeight: 30,
        currentFrame: 0,
        frameCount: 6,
        frameDelay: 10,
        frameTimer: 0,
        // Add new properties for random movement
        pauseTimer: 0,
        isPaused: false,
        pauseChance: 0.005, // 0.5% chance to pause each frame
        minPauseTime: 30,   // Minimum pause time in frames
        maxPauseTime: 90    // Maximum pause time in frames
    }
};

// Game state
let score = 0;
let gameOver = false;
let levelComplete = false;
let screenTransition = false;
let transitionTimer = 0;
let player = {
    x: 50,
    y: canvas.height - 60,
    width: 40,
    height: 40,
    velocityX: 0,
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

// Add sprite loading checks
let loadedSprites = 0;
const totalSprites = Object.keys(player.sprites).length;

Object.keys(player.sprites).forEach(key => {
    player.sprites[key].onload = () => {
        loadedSprites++;
        console.log(`Player ${key} sprite loaded successfully`);
        if (loadedSprites === totalSprites) {
            console.log('All player sprites loaded successfully');
            // Load enemy sprite after player sprites are loaded
            loadEnemySprite();
        }
    };
    player.sprites[key].onerror = (error) => {
        console.error(`Failed to load player ${key} sprite:`, error);
        console.error(`Attempted to load from: assets/sprites/ninja_frog/${key} (32x32).png`);
    };
});

// Function to load enemy sprite
function loadEnemySprite() {
    // Load walk sprite
    ENEMY_TYPES.KOOPA.sprites.walk.onload = () => {
        console.log('Koopa walk sprite loaded successfully');
    };
    ENEMY_TYPES.KOOPA.sprites.walk.onerror = (error) => {
        console.error('Failed to load Koopa walk sprite:', error);
        console.error('Attempted to load from: assets/sprites/AngryPig/Walk (36x30).png');
    };
    ENEMY_TYPES.KOOPA.sprites.walk.src = 'assets/sprites/AngryPig/Walk (36x30).png';

    // Load run sprite
    ENEMY_TYPES.KOOPA.sprites.run.onload = () => {
        console.log('Koopa run sprite loaded successfully');
    };
    ENEMY_TYPES.KOOPA.sprites.run.onerror = (error) => {
        console.error('Failed to load Koopa run sprite:', error);
        console.error('Attempted to load from: assets/sprites/AngryPig/Run (36x30).png');
    };
    ENEMY_TYPES.KOOPA.sprites.run.src = 'assets/sprites/AngryPig/Run (36x30).png';

    // Load hit1 sprite
    ENEMY_TYPES.KOOPA.sprites.hit1.onload = () => {
        console.log('Koopa hit1 sprite loaded successfully');
    };
    ENEMY_TYPES.KOOPA.sprites.hit1.onerror = (error) => {
        console.error('Failed to load Koopa hit1 sprite:', error);
        console.error('Attempted to load from: assets/sprites/AngryPig/Hit 1 (36x30).png');
    };
    ENEMY_TYPES.KOOPA.sprites.hit1.src = 'assets/sprites/AngryPig/Hit 1 (36x30).png';

    // Load hit2 sprite
    ENEMY_TYPES.KOOPA.sprites.hit2.onload = () => {
        console.log('Koopa hit2 sprite loaded successfully');
    };
    ENEMY_TYPES.KOOPA.sprites.hit2.onerror = (error) => {
        console.error('Failed to load Koopa hit2 sprite:', error);
        console.error('Attempted to load from: assets/sprites/AngryPig/Hit 2 (36x30).png');
    };
    ENEMY_TYPES.KOOPA.sprites.hit2.src = 'assets/sprites/AngryPig/Hit 2 (36x30).png';
}

// Load player sprites
player.sprites.idle.src = 'assets/sprites/ninja_frog/Idle (32x32).png';
player.sprites.run.src = 'assets/sprites/ninja_frog/Run (32x32).png';
player.sprites.jump.src = 'assets/sprites/ninja_frog/Jump (32x32).png';
player.sprites.fall.src = 'assets/sprites/ninja_frog/Fall (32x32).png';
player.sprites.doubleJump.src = 'assets/sprites/ninja_frog/Double Jump (32x32).png';
player.sprites.hit.src = 'assets/sprites/ninja_frog/Hit (32x32).png';
player.sprites.wallJump.src = 'assets/sprites/ninja_frog/Wall Jump (32x32).png';

// Level system with multiple screens
const SCREEN_WIDTH = 1280;
const SCREEN_HEIGHT = 480;
const SCREENS_PER_LEVEL = 3;

const LEVEL = {
    currentScreen: 0,
    screens: [
        // Screen 1 - Classic Mario-style level
        {
            ground: Array.from({ length: 150 }, (_, i) => ({
                x: i * TILE_SIZE,
                y: canvas.height - TILE_SIZE
            })),
            platforms: [
                // Starting platforms
                { x: 400, y: canvas.height - 120, width: 160, height: 20 },
                { x: 600, y: canvas.height - 180, width: 160, height: 20 },
                { x: 800, y: canvas.height - 240, width: 160, height: 20 },
                // Mid-level platforms
                { x: 1200, y: canvas.height - 150, width: 160, height: 20 },
                { x: 1400, y: canvas.height - 210, width: 160, height: 20 },
                { x: 1600, y: canvas.height - 270, width: 160, height: 20 },
                // End-level platforms
                { x: 2000, y: canvas.height - 180, width: 160, height: 20 },
                { x: 2200, y: canvas.height - 240, width: 160, height: 20 },
                { x: 2400, y: canvas.height - 300, width: 160, height: 20 }
            ],
            obstacles: [
                { x: 500, y: canvas.height - 120, type: 'NORMAL' },
                { x: 800, y: canvas.height - 140, type: 'TALL' },
                { x: 1200, y: canvas.height - 120, type: 'WIDE' },
                { x: 1600, y: canvas.height - 140, type: 'TALL' },
                { x: 2000, y: canvas.height - 120, type: 'NORMAL' }
            ],
            originalEnemies: [
                { x: 600, y: canvas.height - TILE_SIZE - 30, type: 'GOOMBA', direction: 1 },
                { x: 900, y: canvas.height - TILE_SIZE - 30, type: 'GOOMBA', direction: -1 },
                { x: 1300, y: canvas.height - TILE_SIZE + 25, type: 'KOOPA', direction: 1 },
                { x: 1700, y: canvas.height - TILE_SIZE - 30, type: 'GOOMBA', direction: -1 }
            ],
            enemies: [], // Will be populated from originalEnemies on reset
            goal: { x: 4400, y: canvas.height - 160, width: 40, height: 120 }
        },
        // Screen 2 - More challenging level
        {
            ground: Array.from({ length: 150 }, (_, i) => ({
                x: i * TILE_SIZE,
                y: canvas.height - TILE_SIZE
            })),
            platforms: [
                // Starting platforms
                { x: 200, y: canvas.height - 150, width: 160, height: 20 },
                { x: 400, y: canvas.height - 210, width: 160, height: 20 },
                { x: 600, y: canvas.height - 270, width: 160, height: 20 },
                // Mid-level platforms
                { x: 1000, y: canvas.height - 180, width: 160, height: 20 },
                { x: 1200, y: canvas.height - 240, width: 160, height: 20 },
                { x: 1400, y: canvas.height - 300, width: 160, height: 20 },
                // End-level platforms
                { x: 1800, y: canvas.height - 210, width: 160, height: 20 },
                { x: 2000, y: canvas.height - 270, width: 160, height: 20 },
                { x: 2200, y: canvas.height - 330, width: 160, height: 20 }
            ],
            obstacles: [
                { x: 300, y: canvas.height - 120, type: 'WIDE' },
                { x: 600, y: canvas.height - 140, type: 'TALL' },
                { x: 1000, y: canvas.height - 120, type: 'NORMAL' },
                { x: 1400, y: canvas.height - 140, type: 'WIDE' },
                { x: 1800, y: canvas.height - 120, type: 'TALL' }
            ],
            originalEnemies: [
                { x: 400, y: canvas.height - TILE_SIZE - 30, type: 'KOOPA', direction: 1 },
                { x: 700, y: canvas.height - TILE_SIZE - 30, type: 'GOOMBA', direction: -1 },
                { x: 1100, y: canvas.height - TILE_SIZE - 30, type: 'KOOPA', direction: 1 },
                { x: 1500, y: canvas.height - TILE_SIZE - 30, type: 'GOOMBA', direction: -1 },
                { x: 1900, y: canvas.height - TILE_SIZE - 30, type: 'KOOPA', direction: 1 }
            ],
            enemies: [], // Will be populated from originalEnemies on reset
            goal: { x: 4400, y: canvas.height - 160, width: 40, height: 120 }
        },
        // Screen 3 - Final challenge
        {
            ground: Array.from({ length: 150 }, (_, i) => ({
                x: i * TILE_SIZE,
                y: canvas.height - TILE_SIZE
            })),
            platforms: [
                // Starting platforms
                { x: 300, y: canvas.height - 180, width: 160, height: 20 },
                { x: 500, y: canvas.height - 240, width: 160, height: 20 },
                { x: 700, y: canvas.height - 300, width: 160, height: 20 },
                // Mid-level platforms
                { x: 1100, y: canvas.height - 210, width: 160, height: 20 },
                { x: 1300, y: canvas.height - 270, width: 160, height: 20 },
                { x: 1500, y: canvas.height - 330, width: 160, height: 20 },
                // End-level platforms
                { x: 1900, y: canvas.height - 240, width: 160, height: 20 },
                { x: 2100, y: canvas.height - 300, width: 160, height: 20 },
                { x: 2300, y: canvas.height - 360, width: 160, height: 20 }
            ],
            obstacles: [
                { x: 400, y: canvas.height - 120, type: 'NORMAL' },
                { x: 700, y: canvas.height - 140, type: 'WIDE' },
                { x: 1100, y: canvas.height - 120, type: 'TALL' },
                { x: 1500, y: canvas.height - 140, type: 'NORMAL' },
                { x: 1900, y: canvas.height - 120, type: 'WIDE' }
            ],
            originalEnemies: [
                { x: 500, y: canvas.height - TILE_SIZE - 30, type: 'KOOPA', direction: 1 },
                { x: 800, y: canvas.height - TILE_SIZE - 30, type: 'KOOPA', direction: -1 },
                { x: 1200, y: canvas.height - TILE_SIZE - 30, type: 'GOOMBA', direction: 1 },
                { x: 1600, y: canvas.height - TILE_SIZE - 30, type: 'KOOPA', direction: -1 },
                { x: 2000, y: canvas.height - TILE_SIZE - 30, type: 'KOOPA', direction: 1 }
            ],
            enemies: [], // Will be populated from originalEnemies on reset
            goal: { x: 4400, y: canvas.height - 160, width: 40, height: 120 }
        }
    ]
};

// Remove environment assets section and replace with simple colors
const COLORS = {
    background: '#87CEEB',  // Sky blue
    ground: '#8B4513',      // Brown
    platform: '#A0522D',    // Darker brown
    obstacle: '#CD853F',    // Light brown
    goal: '#FFD700'         // Gold for goal flag
};

// Event listeners for movement
const keys = {
    left: false,
    right: false,
    space: false
};

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (gameOver) {
            resetGame();
        } else if (!player.isJumping) {
            jump();
        }
    } else if (event.code === 'ArrowLeft') {
        keys.left = true;
    } else if (event.code === 'ArrowRight') {
        keys.right = true;
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft') {
        keys.left = false;
    } else if (event.code === 'ArrowRight') {
        keys.right = false;
    }
});

// Game functions
function jump() {
    if (!player.isJumping) {
        player.isJumping = true;
        player.velocityY = JUMP_FORCE;
        if (keys.right) {
            player.velocityX = PLAYER_SPEED + JUMP_FORWARD_BOOST;
        } else if (keys.left) {
            player.velocityX = -PLAYER_SPEED - JUMP_FORWARD_BOOST;
        }
        player.canDoubleJump = true;
        player.currentAnimation = 'jump';
        player.currentFrame = 0;
        jumpSound.currentTime = 0;
        jumpSound.play();
    } else if (player.canDoubleJump) {
        player.velocityY = JUMP_FORCE * 0.8;
        if (keys.right) {
            player.velocityX = PLAYER_SPEED + JUMP_FORWARD_BOOST;
        } else if (keys.left) {
            player.velocityX = -PLAYER_SPEED - JUMP_FORWARD_BOOST;
        }
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
        levelComplete = false;
        LEVEL.currentScreen = 0;
        player.x = 50;
        player.y = canvas.height - 60;
        player.velocityX = 0;
        player.velocityY = 0;
        player.isJumping = false;
        player.canDoubleJump = false;
        player.currentFrame = 0;
        player.currentAnimation = 'run';
        scoreElement.textContent = `Score: ${score}`;
        gameOverElement.classList.add('hidden');
        
        // Reset camera position
        CAMERA.x = 0;
        CAMERA.targetX = 0;
        
        // Reset each screen's enemies to their original positions and states
        LEVEL.screens.forEach(screen => {
            // Create a fresh copy of the original enemies array
            screen.enemies = screen.originalEnemies.map(enemy => ({
                ...enemy,
                health: ENEMY_TYPES[enemy.type].health,
                isHit: false,
                hitFrameTimer: 0,
                currentAnimation: enemy.type === 'KOOPA' ? 'walk' : 'run',
                currentFrame: 0,
                frameTimer: 0,
                hitAnimationForward: true
            }));
        });
        
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(error => {
            console.warn('Could not play background music:', error);
        });
    } catch (error) {
        console.error('Error resetting game:', error);
    }
}

function transitionToNextScreen() {
    screenTransition = true;
    transitionTimer = 60; // 1 second at 60fps
    LEVEL.currentScreen++;
    
    // Reset player position for new screen
    player.x = 50;
    player.y = canvas.height - 60;
    player.velocityX = 0;
    player.velocityY = 0;
    
    // Check if level is complete
    if (LEVEL.currentScreen >= SCREENS_PER_LEVEL) {
        levelComplete = true;
    }
}

function update() {
    if (gameOver || levelComplete) return;

    try {
        // Handle screen transition
        if (screenTransition) {
            transitionTimer--;
            if (transitionTimer <= 0) {
                screenTransition = false;
            }
            return;
        }

        // Update player horizontal movement with air control
        if (keys.left) {
            const controlMultiplier = player.isJumping ? AIR_CONTROL : 1;
            player.velocityX = -PLAYER_SPEED * controlMultiplier;
            player.direction = -1;
        } else if (keys.right) {
            const controlMultiplier = player.isJumping ? AIR_CONTROL : 1;
            player.velocityX = PLAYER_SPEED * controlMultiplier;
            player.direction = 1;
        } else {
            player.velocityX *= GROUND_FRICTION;
            if (Math.abs(player.velocityX) < 0.1) {
                player.velocityX = 0;
            }
        }

        // Update player position
        player.x += player.velocityX;
        player.velocityY += GRAVITY;
        
        // Cap falling speed
        if (player.velocityY > MAX_FALL_SPEED) {
            player.velocityY = MAX_FALL_SPEED;
        }
        
        player.y += player.velocityY;

        // Update camera with deadzone
        const playerScreenX = player.x - CAMERA.x;
        if (playerScreenX < CAMERA.deadzone.left) {
            CAMERA.targetX = player.x - CAMERA.deadzone.left;
        } else if (playerScreenX > CAMERA.deadzone.right) {
            CAMERA.targetX = player.x - CAMERA.deadzone.right;
        }

        // Immediate camera movement when player reaches screen edges
        if (player.x <= CAMERA.x + CAMERA.deadzone.left || 
            player.x + player.width >= CAMERA.x + CAMERA.deadzone.right) {
            CAMERA.x = CAMERA.targetX;
        } else {
            CAMERA.x += (CAMERA.targetX - CAMERA.x) * CAMERA.speed;
        }
        
        // Keep camera within bounds
        CAMERA.x = Math.max(CAMERA.bounds.left, Math.min(CAMERA.x, CAMERA.bounds.right));

        // Prevent player from running off screen
        const maxPlayerX = CAMERA.x + canvas.width - player.width;
        if (player.x < CAMERA.x) {
            player.x = CAMERA.x;
            player.velocityX = 0;
        }
        if (player.x > maxPlayerX) {
            player.x = maxPlayerX;
            player.velocityX = 0;
        }

        // Platform collision with improved detection
        let isOnPlatform = false;
        const currentScreen = LEVEL.screens[LEVEL.currentScreen];
        for (const platform of currentScreen.platforms) {
            const platformX = platform.x - CAMERA.x;
            
            // Check if player is moving downward and is above the platform
            if (player.velocityY > 0 && 
                player.y + player.height > platform.y && 
                player.y + player.height < platform.y + platform.height + 5 &&
                player.x + player.width > platformX && 
                player.x < platformX + platform.width) {
                
                // Only snap to platform if falling onto it from above
                if (player.y + player.height - player.velocityY <= platform.y) {
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    player.isJumping = false;
                    player.canDoubleJump = false;
                    player.currentAnimation = Math.abs(player.velocityX) > 0.1 ? 'run' : 'idle';
                    isOnPlatform = true;
                    break;
                }
            }
        }

        // Ground collision with improved detection
        if (!isOnPlatform) {
            let isOnGround = false;
            for (const tile of currentScreen.ground) {
                const tileX = tile.x - CAMERA.x;
                
                // Check if player is moving downward and is above the ground
                if (player.velocityY > 0 && 
                    player.y + player.height > tile.y && 
                    player.y + player.height < tile.y + TILE_SIZE + 5 &&
                    player.x + player.width > tileX && 
                    player.x < tileX + TILE_SIZE) {
                    
                    // Only snap to ground if falling onto it from above
                    if (player.y + player.height - player.velocityY <= tile.y) {
                        player.y = tile.y - player.height;
                        player.velocityY = 0;
                        player.isJumping = false;
                        player.canDoubleJump = false;
                        player.currentAnimation = Math.abs(player.velocityX) > 0.1 ? 'run' : 'idle';
                        isOnGround = true;
                        break;
                    }
                }
            }

            // If not on ground and falling, check if we're below the ground level
            if (!isOnGround && player.y + player.height > canvas.height - TILE_SIZE) {
                player.y = canvas.height - TILE_SIZE - player.height;
                player.velocityY = 0;
                player.isJumping = false;
                player.canDoubleJump = false;
                player.currentAnimation = Math.abs(player.velocityX) > 0.1 ? 'run' : 'idle';
                isOnGround = true;
            }
        }

        // Update animation state
        if (player.velocityY < 0) {
            player.currentAnimation = player.canDoubleJump ? 'jump' : 'doubleJump';
            player.currentFrame = 0;
        } else if (player.velocityY > 0) {
            player.currentAnimation = 'fall';
            player.currentFrame = 0;
        } else if (player.velocityX !== 0) {
            player.currentAnimation = 'run';
        } else {
            player.currentAnimation = 'idle';
        }

        // Update animation frames
        if (player.currentAnimation === 'run' || player.currentAnimation === 'idle') {
            player.frameTimer++;
            if (player.frameTimer >= 3) {
                player.frameTimer = 0;
                player.currentFrame = (player.currentFrame + 1) % player.frameCounts[player.currentAnimation];
            }
        } else {
            player.frameTimer++;
            if (player.frameTimer >= player.frameDelay) {
                player.frameTimer = 0;
                player.currentFrame = (player.currentFrame + 1) % player.frameCounts[player.currentAnimation];
            }
        }

        // Check collisions with obstacles
        for (const obstacle of currentScreen.obstacles) {
            const obstacleData = OBSTACLE_TYPES[obstacle.type];
            const obstacleX = obstacle.x - CAMERA.x;
            
            // Create hitboxes
            const playerHitbox = {
                x: player.x + (player.width * 0.1),
                y: player.y + (player.height * 0.1),
                width: player.width * 0.8,
                height: player.height * 0.8
            };

            const obstacleHitbox = {
                x: obstacleX + (obstacleData.width * 0.05),
                y: obstacle.y + (obstacleData.height * 0.05),
                width: obstacleData.width * 0.9,
                height: obstacleData.height * 0.9
            };

            if (playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
                playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
                playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
                playerHitbox.y + playerHitbox.height > obstacleHitbox.y) {
                
                // Check if player is falling onto the obstacle
                if (player.velocityY > 0 && 
                    player.y + player.height - player.velocityY <= obstacle.y) {
                    // Land on top of obstacle
                    player.y = obstacle.y - player.height;
                    player.velocityY = 0;
                    player.isJumping = false;
                    player.canDoubleJump = false;
                    player.currentAnimation = Math.abs(player.velocityX) > 0.1 ? 'run' : 'idle';
                    break;
                }
            }
        }

        // Check for goal collision
        const goal = currentScreen.goal;
        const goalX = goal.x - CAMERA.x;

        if (player.x + player.width > goalX && 
            player.x < goalX + goal.width && 
            player.y + player.height > goal.y && 
            player.y < goal.y + goal.height) {
            transitionToNextScreen();
        }

        // Update enemies
        for (const enemy of currentScreen.enemies) {
            const enemyData = ENEMY_TYPES[enemy.type];
            
            // Move enemy only if not in hit animation
            if (!enemy.isHit) {
                // Use different speeds for Koopa based on animation state
                let currentSpeed = enemyData.speed;
                if (enemy.type === 'KOOPA') {
                    if (enemy.currentAnimation === 'run') {
                        currentSpeed = enemyData.speed * 1.5;  // 50% faster when running
                        enemy.x += currentSpeed * -enemy.direction;
                    } else if (enemy.currentAnimation === 'walk') {
                        currentSpeed = enemyData.speed * 0.7;  // 30% slower when walking
                        
                        // Handle random pausing in walk state
                        if (!enemy.isPaused) {
                            // Random chance to start a pause
                            if (Math.random() < enemyData.pauseChance) {
                                enemy.isPaused = true;
                                enemy.pauseTimer = Math.random() * (enemyData.maxPauseTime - enemyData.minPauseTime) + enemyData.minPauseTime;
                            }
                        } else {
                            // Count down pause timer
                            enemy.pauseTimer--;
                            if (enemy.pauseTimer <= 0) {
                                enemy.isPaused = false;
                            }
                        }
                        
                        // Only move if not paused
                        if (!enemy.isPaused) {
                            enemy.x += currentSpeed * -enemy.direction;
                        }
                    }
                } else {
                    enemy.x += currentSpeed * -enemy.direction;
                }
                
                // Change direction at screen edges
                const screenLeft = CAMERA.x;
                const screenRight = CAMERA.x + canvas.width;
                
                if (enemy.x <= screenLeft || enemy.x + enemyData.width >= screenRight) {
                    enemy.direction *= -1;
                }
            }
            
            // Update Koopa animation
            if (enemy.type === 'KOOPA') {
                if (enemy.isHit) {
                    enemy.hitFrameTimer++;
                    if (enemy.hitFrameTimer >= 5) { // 5 frames for hit animation
                        enemy.hitFrameTimer = 0;
                        if (enemy.hitAnimationForward) {
                            enemy.currentFrame++;
                            if (enemy.currentFrame >= 5) { // Hit animation has 5 frames
                                enemy.hitAnimationForward = false;
                            }
                        } else {
                            enemy.currentFrame--;
                            if (enemy.currentFrame <= 0) {
                                if (enemy.currentAnimation === 'hit1') {
                                    // Just update the existing Koopa's state
                                    enemy.isHit = false;
                                    enemy.currentAnimation = 'run';
                                    enemy.currentFrame = 0;
                                    enemy.hitFrameTimer = 0;
                                    enemy.hitAnimationForward = true;
                                    enemy.health = 1;
                                    // Keep the same position and direction
                                    enemy.x = enemy.x;
                                    enemy.y = enemy.y;
                                    enemy.direction = enemy.direction;
                                } else if (enemy.currentAnimation === 'hit2') {
                                    const index = currentScreen.enemies.indexOf(enemy);
                                    if (index > -1) {
                                        currentScreen.enemies.splice(index, 1);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // Update walk/run animation
                    enemy.frameTimer++;
                    if (enemy.frameTimer >= enemyData.frameDelay) {
                        enemy.frameTimer = 0;
                        enemy.currentFrame = (enemy.currentFrame + 1) % enemyData.frameCount;
                    }
                }
            }
            
            // Check for ground collision
            if (enemy.y + enemyData.height > canvas.height - TILE_SIZE) {
                enemy.y = canvas.height - TILE_SIZE - enemyData.height;
            }
            
            // Check for platform collision
            for (const platform of currentScreen.platforms) {
                const platformX = platform.x - CAMERA.x;
                if (enemy.x + enemyData.width > platformX && 
                    enemy.x < platformX + platform.width &&
                    enemy.y + enemyData.height > platform.y && 
                    enemy.y + enemyData.height < platform.y + platform.height + 5) {
                    enemy.y = platform.y - enemyData.height;
                }
            }
            
            // Keep enemy within screen bounds and ensure they stay at ground level
            enemy.x = Math.max(CAMERA.x, Math.min(enemy.x, CAMERA.x + canvas.width - enemyData.width));
            enemy.y = Math.min(enemy.y, canvas.height - TILE_SIZE - enemyData.height);
            
            // Check for player collision with improved detection
            const playerHitbox = {
                x: player.x + (player.width * 0.1),
                y: player.y + (player.height * 0.1),
                width: player.width * 0.8,
                height: player.height * 0.8
            };
            
            const enemyHitbox = {
                x: enemy.x + (enemyData.width * 0.1),
                y: enemy.y + (enemyData.height * 0.1),
                width: enemyData.width * 0.8,
                height: enemyData.height * 0.8
            };
            
            if (playerHitbox.x < enemyHitbox.x + enemyHitbox.width &&
                playerHitbox.x + playerHitbox.width > enemyHitbox.x &&
                playerHitbox.y < enemyHitbox.y + enemyHitbox.height &&
                playerHitbox.y + playerHitbox.height > enemyHitbox.y) {
                
                // Simple check: if player's feet are touching enemy's head
                const playerFeet = player.y + player.height;
                const enemyHead = enemy.y;
                
                if (playerFeet <= enemyHead + 5) {  // Small threshold to make it more forgiving
                    // Player landed on enemy with a moderate bounce
                    player.velocityY = JUMP_FORCE * 0.6;
                    player.isJumping = true;
                    player.canDoubleJump = true;
                    player.currentAnimation = 'jump';
                    player.currentFrame = 0;
                    
                    // Add a small horizontal boost in the direction the player was moving
                    if (player.velocityX > 0) {
                        player.velocityX = PLAYER_SPEED + JUMP_FORWARD_BOOST;
                    } else if (player.velocityX < 0) {
                        player.velocityX = -PLAYER_SPEED - JUMP_FORWARD_BOOST;
                    }
                    
                    // Play jump sound
                    jumpSound.currentTime = 0;
                    jumpSound.play();
                    
                    if (enemy.type === 'GOOMBA') {
                        enemy.isHit = true;
                        enemy.currentAnimation = 'hit';
                        enemy.currentFrame = 0;
                        enemy.hitFrameTimer = 0;
                    } else if (enemy.type === 'KOOPA') {
                        // Set hit state immediately for Koopa
                        enemy.isHit = true;
                        enemy.hitFrameTimer = 0;
                        
                        // Only process health reduction if not already in hit state
                        if (enemy.currentAnimation !== 'hit1' && enemy.currentAnimation !== 'hit2') {
                            enemy.health--;
                            if (enemy.health <= 0) {
                                enemy.currentAnimation = 'hit2';
                                enemy.currentFrame = 0;
                            } else {
                                enemy.currentAnimation = 'hit1';
                                enemy.currentFrame = 0;
                            }
                        }
                    }
                } else if (!enemy.isHit) {
                    // Player hit by enemy from side or below
                    gameOver = true;
                    gameOverElement.classList.remove('hidden');
                    gameOverSound.currentTime = 0;
                    gameOverSound.play();
                    backgroundMusic.pause();
                }
            }
        }
    } catch (error) {
        console.error('Error in update function:', error);
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const currentScreen = LEVEL.screens[LEVEL.currentScreen];

    // Draw ground tiles
    const startTile = Math.floor(CAMERA.x / TILE_SIZE);
    const endTile = Math.ceil((CAMERA.x + canvas.width) / TILE_SIZE);
    
    // Draw ground background
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, canvas.height - TILE_SIZE, canvas.width, TILE_SIZE);
    
    // Draw ground tiles
    for (let i = startTile; i <= endTile; i++) {
        const tile = currentScreen.ground[i];
        if (tile) {
            const tileX = tile.x - CAMERA.x;
            if (tileX + TILE_SIZE > 0 && tileX < canvas.width) {
                // Draw tile shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(tileX + 2, tile.y + 2, TILE_SIZE, TILE_SIZE);
                
                // Draw main tile
                ctx.fillStyle = COLORS.ground;
                ctx.fillRect(tileX, tile.y, TILE_SIZE, TILE_SIZE);
                
                // Draw tile highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(tileX, tile.y, TILE_SIZE, 2);
            }
        }
    }

    // Draw platforms
    currentScreen.platforms.forEach(platform => {
        const platformX = platform.x - CAMERA.x;
        if (platformX + platform.width > 0 && platformX < canvas.width) {
            // Draw platform shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(platformX + 2, platform.y + 2, platform.width, platform.height);
            
            // Draw platform
            ctx.fillStyle = COLORS.platform;
            ctx.fillRect(platformX, platform.y, platform.width, platform.height);
            
            // Draw platform highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(platformX, platform.y, platform.width, 2);
        }
    });

    // Draw obstacles
    currentScreen.obstacles.forEach(obstacle => {
        const obstacleData = OBSTACLE_TYPES[obstacle.type];
        const obstacleX = obstacle.x - CAMERA.x;
        
        if (obstacleX + obstacleData.width > 0 && obstacleX < canvas.width) {
            // Draw shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(obstacleX + 5, obstacle.y + obstacleData.height + 5, obstacleData.width, 5);
            
            // Draw main obstacle
            ctx.fillStyle = COLORS.obstacle;
            ctx.fillRect(obstacleX, obstacle.y, obstacleData.width, obstacleData.height);
            
            // Draw highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(obstacleX, obstacle.y, obstacleData.width, 5);
        }
    });

    // Draw enemies
    currentScreen.enemies.forEach(enemy => {
        const enemyData = ENEMY_TYPES[enemy.type];
        const enemyX = enemy.x - CAMERA.x;
        
        if (enemyX + enemyData.width > 0 && enemyX < canvas.width) {
            // Draw shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(enemyX + 2, enemy.y + enemyData.height + 2, enemyData.width, 5);
            
            if (enemy.type === 'KOOPA') {
                // Draw Koopa sprite
                ctx.save();
                ctx.translate(enemyX + (enemy.direction === -1 ? enemyData.width : 0), enemy.y);
                ctx.scale(enemy.direction, 1);
                ctx.drawImage(
                    enemyData.sprites[enemy.currentAnimation],
                    enemy.currentFrame * enemyData.frameWidth,
                    0,
                    enemyData.frameWidth,
                    enemyData.frameHeight,
                    0,
                    0,
                    enemyData.width,
                    enemyData.height
                );
                ctx.restore();
            } else {
                // Draw Goomba (keep as rectangle for now)
                ctx.fillStyle = enemyData.color;
                ctx.fillRect(enemyX, enemy.y, enemyData.width, enemyData.height);
                
                // Draw enemy highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(enemyX, enemy.y, enemyData.width, 5);
            }
        }
    });

    // Draw goal flag
    const goal = currentScreen.goal;
    const goalX = goal.x - CAMERA.x;
    if (goalX + goal.width > 0 && goalX < canvas.width) {
        // Draw flag pole
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(goalX + 35, goal.y, 5, goal.height);
        
        // Draw flag
        ctx.fillStyle = COLORS.goal;
        ctx.beginPath();
        ctx.moveTo(goalX + 40, goal.y + 40);
        ctx.lineTo(goalX + 40, goal.y + 80);
        ctx.lineTo(goalX + 80, goal.y + 60);
        ctx.closePath();
        ctx.fill();
    }

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

    // Draw screen transition
    if (screenTransition) {
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - transitionTimer / 60})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw level complete message
    if (levelComplete) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText('Press SPACE to play again', canvas.width / 2, canvas.height / 2 + 40);
    }
}

function gameLoop() {
    if (!gameOver && !levelComplete) {
        update();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
resetGame();
gameLoop(); 