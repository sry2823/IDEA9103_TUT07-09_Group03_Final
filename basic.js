function setup() {
  createCanvas(400, 400);
}

<<<<<<< HEAD
function draw() {
  background(220);
=======
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
>>>>>>> 086ec1f456571707edd0d9111624cf43d41cf3c0
}
