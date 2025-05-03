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
        enemies[i].y += enemies[i].speed;
        if (enemies[i].y > canvas.height) enemies.splice(i, 1);
        if (checkCollision(player, enemies[i])) {
            gameState = "gameOver";
            console.log("Game Over!"); // Placeholder for explosion sound/animation
            return;
        }
    }

    // Spawn new enemies
    if (Math.random() < enemySpawnRate) {
        const lane = Math.floor(Math.random() * 3);
        enemies.push({
            x: 100 + lane * 200 + 50 - 32,
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

    // Draw road and shoulders
    ctx.fillStyle = "#808080"; // Road
    ctx.fillRect(100, 0, canvas.width - 200, canvas.height);
    ctx.fillStyle = "#A0A0A0"; // Shoulders
    ctx.fillRect(0, 0, 100, canvas.height);
    ctx.fillRect(canvas.width - 100, 0, 100, canvas.height);

    // Draw road stripes
    ctx.fillStyle = "#FFFFFF";
    for (let y = -40 + stripeOffset; y < canvas.height; y += 80) {
        ctx.fillRect(canvas.width / 2 - 5, y, 10, 40);
    }

    // Draw player car
    ctx.drawImage(playerCarImage, player.x, player.y, player.width, player.height);

    // Draw enemies
    for (const enemy of enemies) {
        ctx.drawImage(enemyCarImage, enemy.x, enemy.y, enemy.width, enemy.height);
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
        // Show end screen
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "20px Arial";
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
}