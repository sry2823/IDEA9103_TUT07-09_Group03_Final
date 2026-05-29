// Firefly Catcher - Basic Coding Structure

let fireflies = [];
let totalFireflies = 50;

let gameTime = 60;
let startTime;

let targetCatchNum;
let caughtNum = 0;

let goldenFirefly = null;
let goldenTimer = 0;

let speedRandomNum;

let mic;
let fft;

let gameState = "start"; 

// start / playing / win / lose

function setup() {
  createCanvas(800, 500);

  startTime = millis();

 // Random catech number：10–20
  targetCatchNum = floor(random(10, 21));

  // Random speed:1-20
  speedRandomNum = floor(random(1, 21));

  // 50 fireflies
  for (let i = 0; i < totalFireflies; i++) {
    let side = i < totalFireflies / 2 ? "cool" : "warm";
    fireflies.push(new Firefly(side));
  }

  // Lose
  if (timeLeft <= 0 && caughtNum < targetCatchNum) {
    gameState = "lose";
  }

  // Win
  if (caughtNum >= targetCatchNum) {
    gameState = "win";
  }

  // Perlin noise
  runNoiseLayer();

  // Time-based
  runTimeLayer(currentTime);

  // Audio input
  runSoundLayer();

  // User input
  runInputLayer();

  drawUI(timeLeft);
}
