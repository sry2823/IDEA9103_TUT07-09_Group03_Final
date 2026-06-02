// Whether the game has started
let gameStarted = false;

// Fireflies used in the game scene
let gameFireflies = [];

// Random firefly numbers on both sides
let leftFireflyCount = 0;
let rightFireflyCount = 0;

// Random target numbers
let leftTarget = 0;
let rightTarget = 0;

// Current captured numbers
// These stay at 0 because the capture logic has been removed
let leftCaptured = 0;
let rightCaptured = 0;

// Total fireflies in the game scene
let totalFireflies = 40;

// Top area height reserved for text
let topUIHeight = 85;

// Start the game scene
function startGameScene() {
  gameStarted = true;

  gameFireflies = [];
  leftCaptured = 0;
  rightCaptured = 0;

  // Generate two random numbers, and the total must be 50
  leftFireflyCount = floor(random(15, 25));
  rightFireflyCount = totalFireflies - leftFireflyCount;

  // Generate two random target numbers
  leftTarget = floor(random(5, min(16, leftFireflyCount + 1)));
  rightTarget = floor(random(5, min(16, rightFireflyCount + 1)));

  // Create warm fireflies on the left side
  createSideFireflies("left", leftFireflyCount);

  // Create cool fireflies on the right side
  createSideFireflies("right", rightFireflyCount);
}

// Draw the whole game scene
function drawGameScene() {
  background(0);

  image(bg, 0, 0, width, height);

  updateAudioSystem();
  timeSystem();

  drawGameTopInfo();

  updateAndDrawGameFireflies();
}

// Create fireflies for one side
function createSideFireflies(side, count) {
  let margin = 35;
  let minX;
  let maxX;

  // Set flying area for left and right side
  if (side === "left") {
    minX = margin;
    maxX = width / 2 - margin;
  } else {
    minX = width / 2 + margin;
    maxX = width - margin;
  }

  let minY = topUIHeight + 25;
  let maxY = height - margin;

  let areaW = maxX - minX;
  let areaH = maxY - minY;

  // Use grid cells to keep the initial distribution even
  let cols = ceil(sqrt(count * areaW / areaH)) + 1;
  let rows = ceil(count / cols) + 1;

  let cellW = areaW / cols;
  let cellH = areaH / rows;

  // Create all possible grid cells
  let cells = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        col: col,
        row: row
      });
    }
  }

  // Randomize the cell order
  shuffle(cells, true);

  for (let i = 0; i < count; i++) {
    let cell = cells[i];

    // Place each firefly inside a different grid cell
    let x = minX + cell.col * cellW + random(cellW);
    let y = minY + cell.row * cellH + random(cellH);

    gameFireflies.push({
      side: side,
      type: side == "left" ? "warm" : "cool",
      visible: true,
      caught: false,
      x: x,
      y: y,

      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY,

      // Firefly visual settings
      coreSize: random(5, 8),
      maxGlow: random(35, 60),

      // Breathing animation settings
      breatheSpeed: random(0.003, 0.008),
      breatheOffset: random(1),

      // Perlin noise movement settings
      noiseSeedX: random(1000),
      noiseSeedY: random(1000),
      noiseSpeed: random(0.004, 0.008),

      // Flying speed
      flightSpeed: random(0.7, 1.3),

      // Current velocity
      vx: random(-1, 1),
      vy: random(-1, 1),

      // Small floating movement
      floatOffset: random(TWO_PI),
      floatSpeed: random(0.015, 0.03),

      // Separation settings to avoid clustering
      repelRadius: random(55, 75),
      repelStrength: random(0.05, 0.08),

      // Edge avoidance settings
      edgeMargin: 45,
      edgeForce: 0.08
    });
  }
}

// Update firefly movement and draw them
function updateAndDrawGameFireflies() {
  blendMode(ADD);

  for (let f of gameFireflies) {
  if (f.visible === false) {
    continue;
  }

  if (!isFireflyFrozen(f)) {
    moveFireflyWithNoise(f);
  }

  if (f.side === "left") {

    if (f.side === "left") {
      // Warm fireflies on the left side
      drawGameBreathingFirefly(
        f.x,
        f.y,
        f.coreSize,
        f.maxGlow,
        f.breatheSpeed,
        f.breatheOffset,
        color(255, 145, 30),
        color(255, 210, 80),
        color(255, 245, 180)
      );
    } else {
      // Cool fireflies on the right side
      drawGameBreathingFirefly(
        f.x,
        f.y,
        f.coreSize,
        f.maxGlow,
        f.breatheSpeed,
        f.breatheOffset,
        color(40, 150, 255),
        color(120, 210, 255),
        color(220, 250, 255)
      );
    }
  }

  blendMode(BLEND);
}

// Move firefly using Perlin noise, real flying movement, and separation force
function moveFireflyWithNoise(f) {
  let time = frameCount * f.noiseSpeed;

  // Use two different Perlin noise values for x and y movement
  let nx = noise(f.noiseSeedX, time);
  let ny = noise(f.noiseSeedY, time);

let audioSpeedScale = getFireflySpeedScale(f);

// Convert noise values into smooth velocity
let targetVX = map(nx, 0, 1, -1, 1) * f.flightSpeed * audioSpeedScale;
let targetVY = map(ny, 0, 1, -1, 1) * f.flightSpeed * audioSpeedScale;

  // Smoothly change direction instead of turning suddenly
  f.vx = lerp(f.vx, targetVX, 0.035);
  f.vy = lerp(f.vy, targetVY, 0.035);

  // Separation force: prevent fireflies from gathering together
  let separateX = 0;
  let separateY = 0;
  let closeCount = 0;

  for (let other of gameFireflies) {
    if (other !== f && other.side === f.side) {
      let d = dist(f.x, f.y, other.x, other.y);

      if (d > 0 && d < f.repelRadius) {
        let force = (f.repelRadius - d) / f.repelRadius;

        separateX += ((f.x - other.x) / d) * force;
        separateY += ((f.y - other.y) / d) * force;

        closeCount++;
      }
    }
  }

  if (closeCount > 0) {
    separateX /= closeCount;
    separateY /= closeCount;

    f.vx += separateX * f.repelStrength * 10;
    f.vy += separateY * f.repelStrength * 10;
  }

  // Avoid edges before hitting the boundary
  if (f.x < f.minX + f.edgeMargin) {
    f.vx += f.edgeForce;
  }

  if (f.x > f.maxX - f.edgeMargin) {
    f.vx -= f.edgeForce;
  }

  if (f.y < f.minY + f.edgeMargin) {
    f.vy += f.edgeForce;
  }

  if (f.y > f.maxY - f.edgeMargin) {
    f.vy -= f.edgeForce;
  }

  // Limit maximum speed to avoid sudden fast movement
  let currentSpeed = sqrt(f.vx * f.vx + f.vy * f.vy);
  let maxSpeed = f.flightSpeed * audioSpeedScale * 1.8;

  if (currentSpeed > maxSpeed) {
    f.vx = (f.vx / currentSpeed) * maxSpeed;
    f.vy = (f.vy / currentSpeed) * maxSpeed;
  }

  // Add subtle floating movement
  let floatX = sin(frameCount * f.floatSpeed + f.floatOffset) * 0.25;
  let floatY = cos(frameCount * f.floatSpeed + f.floatOffset) * 0.25;

  // Move the firefly
  f.x += f.vx + floatX;
  f.y += f.vy + floatY;

  // Keep left fireflies only on the left side,
  // and right fireflies only on the right side
  if (f.x < f.minX) {
    f.x = f.minX;
    f.vx = abs(f.vx);
    f.noiseSeedX += random(20, 80);
  }

  if (f.x > f.maxX) {
    f.x = f.maxX;
    f.vx = -abs(f.vx);
    f.noiseSeedX += random(20, 80);
  }

  if (f.y < f.minY) {
    f.y = f.minY;
    f.vy = abs(f.vy);
    f.noiseSeedY += random(20, 80);
  }

  if (f.y > f.maxY) {
    f.y = f.maxY;
    f.vy = -abs(f.vy);
    f.noiseSeedY += random(20, 80);
  }
}

// Draw one breathing firefly
function drawGameBreathingFirefly(
  x,
  y,
  coreSize,
  maxGlow,
  speed,
  offset,
  outerColor,
  middleColor,
  innerColor
) {
  // Animation progress from 0 to 1
  let t = (frameCount * speed + offset) % 1;

  // Breathing intensity
  let breath = sin(t * PI);

  // Overall brightness
  let alpha = map(breath, 0, 1, 40, 220);

  // First spreading ring
  let ringSize1 = map(t, 0, 1, coreSize, maxGlow);
  let ringAlpha1 = map(t, 0, 1, 180, 0);

  // Second delayed spreading ring
  let ringProgress2 = (t + 0.35) % 1;
  let ringSize2 = map(ringProgress2, 0, 1, coreSize, maxGlow * 1.2);
  let ringAlpha2 = map(ringProgress2, 0, 1, 130, 0);

  // Soft outer glow
  fill(red(outerColor), green(outerColor), blue(outerColor), alpha * 0.18);
  circle(x, y, maxGlow * breath * 1.5);

  // First outward spreading glow
  fill(red(middleColor), green(middleColor), blue(middleColor), ringAlpha1 * 0.5);
  circle(x, y, ringSize1);

  // Second outward spreading glow
  fill(red(outerColor), green(outerColor), blue(outerColor), ringAlpha2 * 0.35);
  circle(x, y, ringSize2);

  // Center breathing light
  fill(red(innerColor), green(innerColor), blue(innerColor), alpha);
  circle(x, y, coreSize + breath * 5);

  // Bright white highlight in the center
  fill(255, alpha);
  circle(x, y, coreSize * 0.45);
}

// Draw the top target information
function drawGameTopInfo() {
  rectMode(CENTER);

  // Dark transparent background behind the text
  fill(0, 120);
  rect(width / 2, 38, width, 76);

  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(26);

  // Left target text
  fill(255, 210, 80);
  text("Warm  " + leftCaptured + " / " + leftTarget, width * 0.25, 30);

  // Right target text
  fill(120, 210, 255);
  text("Cool  " + rightCaptured + " / " + rightTarget, width * 0.75, 30);

  textStyle(NORMAL);
  textSize(14);

  fill(255, 220);
  text("Left Fireflies: " + leftFireflyCount, width * 0.25, 58);
  text("Right Fireflies: " + rightFireflyCount, width * 0.75, 58);
}

// Mouse click event
function mousePressed() {
  if (!gameStarted && isMouseOnStartButton()) {
    userStartAudio();
    startAudioSystem();
    startTimeSystem();
    startGameScene();
  }
}

// Check whether the mouse is on the start button
function isMouseOnStartButton() {
  return (
    mouseX > buttonX - buttonW / 2 &&
    mouseX < buttonX + buttonW / 2 &&
    mouseY > buttonY - buttonH / 2 &&
    mouseY < buttonY + buttonH / 2
  );
}