// Background image
let bg;

// Array to store all fireflies
let fireflies = [];

// Button position and size
let buttonX;
let buttonY;
let buttonW = 220;
let buttonH = 60;

// Canvas size
let canvasW = 960;
let canvasH = 640;

// Load assets before the program starts
function preload() {
  // Load the background image
  bg = loadImage("background.png");
}

function setup() {
  // Create the canvas
  createCanvas(canvasW, canvasH);

  // Set text alignment to the center
  textAlign(CENTER, CENTER);

  // Remove outlines from shapes
  noStroke();

  // Place the button in the center of the canvas
  buttonX = width / 2;
  buttonY = height / 2;

  // Generate fireflies
  createFireflies();
}

function draw() {
  // Clear the canvas with a black background
  background(0);

  // Draw the full background image to fit the canvas
  image(bg, 0, 0, width, height);

  // Draw all breathing fireflies
  drawFireflies();

  // Draw the Game Start button
  drawStartButton();
}

// Randomly but evenly generate 50 fireflies
function createFireflies() {
  fireflies = [];

  // Divide the canvas into a 10 x 5 grid
  let cols = 10;
  let rows = 5;

  // Set margins to keep fireflies away from the canvas edges
  let marginX = 45;
  let marginY = 45;

  // Calculate the size of each grid cell
  let cellW = (width - marginX * 2) / cols;
  let cellH = (height - marginY * 2) / rows;

  // Generate one firefly inside each grid cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Random position inside the current grid cell
      let x = marginX + col * cellW + random(cellW);
      let y = marginY + row * cellH + random(cellH);

      // Store firefly properties
      fireflies.push({
        x: x,
        y: y,
        coreSize: random(5, 8),       // Size of the center light
        maxGlow: random(35, 60),      // Maximum glow radius
        speed: random(0.003, 0.008),  // Breathing animation speed
        offset: random(1)             // Random animation delay
      });
    }
  }
}

// Draw all fireflies
function drawFireflies() {
  // Use additive blending to make glowing effects brighter
  blendMode(ADD);

  for (let f of fireflies) {
    // Fireflies on the left side are warm-colored
    // Fireflies on the right side are cool-colored
    let isWarm = f.x < width / 2;

    if (isWarm) {
      // Draw warm fireflies
      drawBreathingFirefly(
        f.x,
        f.y,
        f.coreSize,
        f.maxGlow,
        f.speed,
        f.offset,
        color(255, 145, 30),   // Outer warm color
        color(255, 210, 80),   // Middle warm color
        color(255, 245, 180)   // Inner warm color
      );
    } else {
      // Draw cool fireflies
      drawBreathingFirefly(
        f.x,
        f.y,
        f.coreSize,
        f.maxGlow,
        f.speed,
        f.offset,
        color(40, 150, 255),   // Outer cool color
        color(120, 210, 255),  // Middle cool color
        color(220, 250, 255)   // Inner cool color
      );
    }
  }

  // Return to normal blending mode
  blendMode(BLEND);
}

// Draw a single breathing firefly with an outward spreading glow
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
  // Animation progress from 0 to 1
  let t = (frameCount * speed + offset) % 1;

  // Breathing intensity: fades in, expands, then fades out
  let breath = sin(t * PI);

  // Overall brightness of the firefly
  let alpha = map(breath, 0, 1, 40, 220);

  // First expanding ring
  let ringSize1 = map(t, 0, 1, coreSize, maxGlow);
  let ringAlpha1 = map(t, 0, 1, 180, 0);

  // Second delayed expanding ring
  let ringProgress2 = (t + 0.35) % 1;
  let ringSize2 = map(ringProgress2, 0, 1, coreSize, maxGlow * 1.2);
  let ringAlpha2 = map(ringProgress2, 0, 1, 130, 0);

  // Soft outer glow
  fill(red(outerColor), green(outerColor), blue(outerColor), alpha * 0.18);
  circle(x, y, maxGlow * breath * 1.5);

  // First outward spreading glow ring
  fill(red(middleColor), green(middleColor), blue(middleColor), ringAlpha1 * 0.5);
  circle(x, y, ringSize1);

  // Second delayed outward spreading glow ring
  fill(red(outerColor), green(outerColor), blue(outerColor), ringAlpha2 * 0.35);
  circle(x, y, ringSize2);

  // Breathing center light
  fill(red(innerColor), green(innerColor), blue(innerColor), alpha);
  circle(x, y, coreSize + breath * 5);

  // Bright white highlight in the center
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

  // Draw the button from its center
  rectMode(CENTER);

  // Change button color when the mouse hovers over it
  if (isHover) {
    fill(255, 180, 40, 235);
    cursor(HAND);
  } else {
    fill(25, 70, 130, 225);
    cursor(ARROW);
  }

  // Draw rounded rectangle button
  rect(buttonX, buttonY, buttonW, buttonH, 18);

  // Draw button text
  fill(255);
  textSize(28);
  textStyle(BOLD);
  text("Game Start", buttonX, buttonY);
}