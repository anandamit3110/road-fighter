const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Game variables
const stripeSpeed = 5;
const player = {
    x: canvas.width / 2 - 32,
    y: canvas.height - 150,
    vx: 0,
    width: 64,
    height: 128
};
const enemies = [];
let stripeOffset = 0;
let gameState = "paused";
let score = 0;
let roadSpeed = stripeSpeed;
let enemySpawnRate = 0.02;
let lastDifficultyIncrease = Date.now();

// Load images
const playerCarImage = new Image();
playerCarImage.src = "Assets/greencar.png";
const enemyCarImage = new Image();
enemyCarImage.src = "Assets/redcar.png";

// Load tree image for fields
const treeImage = new Image();
treeImage.src = "Assets/tree.png";

// Add error handling for images
playerCarImage.onerror = () => console.error("Failed to load player car image.");
enemyCarImage.onerror = () => console.error("Failed to load enemy car image.");
treeImage.onerror = () => console.error("Failed to load tree image.");

// Load background music
const bgAudio = new Audio('Assets/background music.mp3');
bgAudio.loop = true;

// Event listeners for player movement
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") player.vx = -5;
    if (e.key === "ArrowRight" || e.key === "d") player.vx = 5;
});
document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "ArrowRight" || e.key === "d") player.vx = 0;
});

const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resumeButton = document.getElementById("resumeButton");

startButton.addEventListener("click", () => {
    startButton.style.display = "none";
    pauseButton.style.display = "inline-block";
    bgAudio.play(); // Play background music when the game starts
    startCountdown(() => {
        gameState = "playing";
        loop();
    });
});

pauseButton.addEventListener("click", () => {
    if (gameState === "playing") {
        gameState = "paused";
        pauseButton.style.display = "none";
        resumeButton.style.display = "inline-block";
    }
});

resumeButton.addEventListener("click", () => {
    if (gameState === "paused") {
        gameState = "playing";
        resumeButton.style.display = "none";
        pauseButton.style.display = "inline-block";
        loop();
    }
});

function startCountdown(callback) {
    const countdownOverlay = document.createElement("div");
    countdownOverlay.style.position = "absolute";
    countdownOverlay.style.top = 0;
    countdownOverlay.style.left = 0;
    countdownOverlay.style.width = "100%";
    countdownOverlay.style.height = "100%";
    countdownOverlay.style.display = "flex";
    countdownOverlay.style.alignItems = "center";
    countdownOverlay.style.justifyContent = "center";
    countdownOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    countdownOverlay.style.zIndex = 10;
    document.body.appendChild(countdownOverlay);

    let count = 3;
    const countdownText = document.createElement("div");
    countdownText.style.fontSize = "100px";
    countdownText.style.color = "#FF0000";
    countdownText.style.fontWeight = "bold";
    countdownText.style.transform = "scale(0.5)";
    countdownText.style.transition = "transform 0.8s ease-out, opacity 0.8s ease-out";
    countdownOverlay.appendChild(countdownText);

    function nextCount() {
        if (count > 0) {
            countdownText.textContent = count;
            countdownText.style.transform = "scale(1.5)";
            countdownText.style.opacity = "1";
            setTimeout(() => {
                countdownText.style.transform = "scale(0.5)";
                countdownText.style.opacity = "0";
                count--;
                setTimeout(nextCount, 800);
            }, 800);
        } else {
            document.body.removeChild(countdownOverlay);
            callback();
        }
    }

    nextCount();
}

function checkCollision(player, enemy) {
    return (
        player.x < enemy.x + enemy.width &&
        player.x + player.width > enemy.x &&
        player.y < enemy.y + enemy.height &&
        player.y + player.height > enemy.y
    );
}

// Update game state
function update() {
    if (gameState === "gameOver") return;

    // Move road stripes
    stripeOffset += roadSpeed;
    if (stripeOffset >= 40) stripeOffset = 0;

    // Move player
    player.x += player.vx;
    player.x = Math.max(100, Math.min(player.x, canvas.width - 100 - player.width));

    // Move enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (!enemy) continue; // Skip undefined enemies

        enemy.y += enemy.speed;
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            continue;
        }

        if (checkCollision(player, enemy)) {
            gameState = "gameOver";
            console.log("Game Over!"); // Placeholder for explosion sound/animation
            return;
        }
    }

    // Spawn new enemies
    if (Math.random() < enemySpawnRate) {
        const lane = Math.floor(Math.random() * 4); // Adjusted for 4 lanes
        enemies.push({
            x: 100 + lane * ((canvas.width - 200) / 4) + ((canvas.width - 200) / 8) - 32,
            y: -128,
            width: 64,
            height: 128,
            speed: 3 + Math.random() * 2
        });
    }

    // Update score
    score += Math.floor(roadSpeed / stripeSpeed);

    // Increase difficulty every 10 seconds (adjusted to cap speed and spawn rate)
    if (Date.now() - lastDifficultyIncrease > 10000) {
        roadSpeed = Math.min(roadSpeed * 1.1, 15); // Cap road speed
        enemySpawnRate = Math.min(enemySpawnRate * 1.1, 0.1); // Cap spawn rate
        lastDifficultyIncrease = Date.now();
    }
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw fields (green background)
    ctx.fillStyle = "#228B22"; // Green for fields
    ctx.fillRect(0, 0, 100, canvas.height);
    ctx.fillRect(canvas.width - 100, 0, 100, canvas.height);

    // Draw driving surface (dark road)
    ctx.fillStyle = "#404040"; // Dark gray for road
    ctx.fillRect(100, 0, canvas.width - 200, canvas.height);

    // Draw lane markers (white dashes)
    ctx.fillStyle = "#FFFFFF";
    const laneWidth = (canvas.width - 200) / 4; // 4 lanes
    for (let lane = 1; lane < 4; lane++) {
        const laneX = 100 + lane * laneWidth;
        for (let y = -40 + stripeOffset; y < canvas.height; y += 80) {
            ctx.fillRect(laneX - 5, y, 10, 40);
        }
    }

    // Remove tree rendering logic if tree.png is missing
    if (!treeImage.complete || treeImage.naturalWidth === 0) {
        console.warn("Tree image not found. Skipping tree rendering.");
    } else {
        // Draw trees in the fields
        for (let y = 0; y < canvas.height; y += 150) {
            ctx.drawImage(treeImage, Math.random() * 80, y, 50, 50);
            ctx.drawImage(treeImage, canvas.width - 100 + Math.random() * 80, y, 50, 50);
        }
    }

    // Debug: Log player and enemy positions
    console.log("Player position:", player.x, player.y);
    console.log("Enemies:", enemies);

    // Draw player car
    if (playerCarImage.complete && playerCarImage.naturalWidth !== 0) {
        ctx.drawImage(playerCarImage, player.x, player.y, player.width, player.height);
    } else {
        console.warn("Player car image not loaded or invalid");
    }

    // Draw enemies
    for (const enemy of enemies) {
        if (enemyCarImage.complete && enemyCarImage.naturalWidth !== 0) {
            ctx.drawImage(enemyCarImage, enemy.x, enemy.y, enemy.width, enemy.height);
        } else {
            console.warn("Enemy car image not loaded or invalid");
        }
    }

    // Draw score
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);
}

// Game loop
function loop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw only if game is running
    if (gameState === "playing") {
        update();
        draw();
        requestAnimationFrame(loop);
    } else if (gameState === "gameOver") {
        // Stop background music
        bgAudio.pause();
        bgAudio.currentTime = 0;

        // Show end screen overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Game Over - Your Score: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "20px Arial";
        ctx.fillText("Press Enter to Restart", canvas.width / 2, canvas.height / 2 + 20);

        // Show start button and hide pause/resume buttons
        startButton.style.display = "inline-block";
        pauseButton.style.display = "none";
        resumeButton.style.display = "none";

        // Listen for Enter key to restart
        document.addEventListener("keydown", handleRestart);
    }
}

function handleRestart(e) {
    if (e.key === "Enter") {
        document.removeEventListener("keydown", handleRestart);
        restartGame();
    }
}

function restartGame() {
    // Reset game variables
    gameState = "paused";
    score = 0;
    roadSpeed = stripeSpeed;
    enemySpawnRate = 0.02;
    lastDifficultyIncrease = Date.now();
    enemies.length = 0;
    player.x = canvas.width / 2 - 32;

    // Restart background music
    bgAudio.play();

    // Show start button
    startButton.style.display = "inline-block";
    pauseButton.style.display = "none";
    resumeButton.style.display = "none";
}