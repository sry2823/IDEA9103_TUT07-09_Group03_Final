// Background image
let bg;

// Firefly array for the start screen
let fireflies = [];

// Button position and size
let buttonX;
let buttonY;
let buttonW = 220;
let buttonH = 60;

// Preload image assets
function preload() {
  // Load the background image
  bg = loadImage("background.png");
}

function setup() {
  // Create a canvas that fills the entire browser window
  createCanvas(windowWidth, windowHeight);

  // Align text to the center
  textAlign(CENTER, CENTER);

  // Remove outlines from shapes
  noStroke();

  // Place the button in the center of the screen
  buttonX = width / 2;
  buttonY = height / 2;

  // Generate fireflies for the start screen
  createFireflies();
}

function draw() {
  background(0);

  // If the game has started, draw the game scene
  if (gameStarted) {
    drawGameScene();
    return;
  }

  // Draw the start screen background image and make it fill the screen
  image(bg, 0, 0, width, height);

  // Draw fireflies on the start screen
  drawFireflies();

  // Draw the start button
  drawStartButton();
}

// Automatically resize the canvas when the browser window changes size
function windowResized() {
  // Resize the canvas to match the current browser window
  resizeCanvas(windowWidth, windowHeight);

  // Reposition the button to the center of the screen
  buttonX = width / 2;
  buttonY = height / 2;

  // If still on the start screen, regenerate fireflies to fit the new screen size
  if (!gameStarted) {
    createFireflies();
  }

  // If already in the game scene, restart the game scene to update the boundaries
  if (gameStarted) {
    startGameScene();
  }
}

// Randomly but evenly generate 50 fireflies
function createFireflies() {
  fireflies = [];

  // Divide the screen into a 10 x 5 grid
  let cols = 10;
  let rows = 5;

  // Set margins to keep fireflies away from the screen edges
  let marginX = width * 0.05;
  let marginY = height * 0.08;

  // Calculate the width and height of each grid cell
  let cellW = (width - marginX * 2) / cols;
  let cellH = (height - marginY * 2) / rows;

  // Generate one firefly inside each grid cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Randomly generate a position inside the current grid cell
      let x = marginX + col * cellW + random(cellW);
      let y = marginY + row * cellH + random(cellH);

      // Store firefly properties
      fireflies.push({
        x: x,
        y: y,
        coreSize: random(5, 8),
        maxGlow: random(35, 60),
        speed: random(0.003, 0.008),
        offset: random(1)
      });
    }
  }
}

// Draw all fireflies on the start screen
function drawFireflies() {
  // Use additive blending to make the glow effect brighter
  blendMode(ADD);

  for (let f of fireflies) {
    // Fireflies on the left side are warm-colored
    // Fireflies on the right side are cool-colored
    let isWarm = f.x < width / 2;

    if (isWarm) {
      drawBreathingFirefly(
        f.x,
        f.y,
        f.coreSize,
        f.maxGlow,
        f.speed,
        f.offset,
        color(255, 145, 30),
        color(255, 210, 80),
        color(255, 245, 180)
      );
    } else {
      drawBreathingFirefly(
        f.x,
        f.y,
        f.coreSize,
        f.maxGlow,
        f.speed,
        f.offset,
        color(40, 150, 255),
        color(120, 210, 255),
        color(220, 250, 255)
      );
    }
  }

  // Return to normal blending mode
  blendMode(BLEND);
}

// Draw a single breathing firefly
function drawBreathingFirefly(
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
  // Animation progress, ranging from 0 to 1
  let t = (frameCount * speed + offset) % 1;

  // Breathing intensity
  let breath = sin(t * PI);

  // Overall transparency
  let alpha = map(breath, 0, 1, 40, 220);

  // Size of the first outward-spreading glow ring
  let ringSize1 = map(t, 0, 1, coreSize, maxGlow);
  let ringAlpha1 = map(t, 0, 1, 180, 0);

  // Second delayed outward-spreading glow ring
  let ringProgress2 = (t + 0.35) % 1;
  let ringSize2 = map(ringProgress2, 0, 1, coreSize, maxGlow * 1.2);
  let ringAlpha2 = map(ringProgress2, 0, 1, 130, 0);

  // Draw the soft outer glow
  fill(red(outerColor), green(outerColor), blue(outerColor), alpha * 0.18);
  circle(x, y, maxGlow * breath * 1.5);

  // Draw the first spreading glow ring
  fill(red(middleColor), green(middleColor), blue(middleColor), ringAlpha1 * 0.5);
  circle(x, y, ringSize1);

  // Draw the second spreading glow ring
  fill(red(outerColor), green(outerColor), blue(outerColor), ringAlpha2 * 0.35);
  circle(x, y, ringSize2);

  // Draw the breathing center light
  fill(red(innerColor), green(innerColor), blue(innerColor), alpha);
  circle(x, y, coreSize + breath * 5);

  // Draw the white highlight in the center
  fill(255, alpha);
  circle(x, y, coreSize * 0.45);
}

// Draw the Game Start button
function drawStartButton() {
  // Check whether the mouse is hovering over the button
  let isHover =
    mouseX > buttonX - buttonW / 2 &&
    mouseX < buttonX + buttonW / 2 &&
    mouseY > buttonY - buttonH / 2 &&
    mouseY < buttonY + buttonH / 2;

  rectMode(CENTER);

  // Change button color when the mouse hovers over it
  if (isHover) {
    fill(255, 180, 40, 235);
    cursor(HAND);
  } else {
    fill(25, 70, 130, 225);
    cursor(ARROW);
  }

  // Draw the rounded rectangle button
  rect(buttonX, buttonY, buttonW, buttonH, 18);

  // Draw the button text
  fill(255);
  textSize(28);
  textStyle(BOLD);
  text("Game Start", buttonX, buttonY);
}
