// Main p5 file: background, start screen, and draw loop.
let bg;
let fireflies = [];

let startButtonBounds = { x:0, y:0, w: 360, h:130 };
let gameTopButtonBounds = { x:0, y:0, w: 310, h:38 };
let endButtonBounds = { x:0, y:0, w: 260, h:54 };

// Preload image music assets
function preload() {
  bg = loadImage("background.png");
  preloadAudioFiles();
  preloadTimeAssets();
  preloadUserInputAssets();
}

function setup() {
  // Create a canvas that fills the entire browser window
  createCanvas(windowWidth, windowHeight);

  // Align text to the center
  textAlign(CENTER, CENTER);

  noStroke();
  updateLayoutValues();

  // Generate fireflies for the start screen
  createFireflies();
}

function draw() {
  background(0);

  // If the game has started, draw the game scene
  if (gameState === "playing") {
    drawGameScene();
  } else if (gameState === "win" || gameState === "lose") {
    drawEndScreen(gameState);
  } else {
    drawStartScreen();
  }

  drawCustomCursor();
}

// Automatically resize the canvas when the browser window changes size
function windowResized() {
  // Resize the canvas to match the current browser window
  resizeCanvas(windowWidth, windowHeight);
  updateLayoutValues();

  // If still on the start screen, regenerate fireflies to fit the new screen size
  if (gameState === "playing") {
    rebuildGameBounds();
  } else {
    createFireflies();
  }
}

function updateLayoutValues() {
  startButtonBounds.w = constrain(width * 0.32, 310, 520);
  startButtonBounds.h = constrain(height / 6, 105, 160);
  startButtonBounds.x = width / 2;
  startButtonBounds.y = height * 0.68;

  gameTopButtonBounds.w = constrain(width * 0.26, 250, 360);
  gameTopButtonBounds.h = 38;
  gameTopButtonBounds.x = width / 2;
  gameTopButtonBounds.y = 30;

  topUIHeight = 118;
}

function drawFullBackground() {
  if (bg) {
    image(bg, 0, 0, width, height);
  } else {
    background(5, 9, 18);
  }

  rectMode(CORNER);
  noStroke();
  fill(0, 45);
  rect(0, 0, width, height);
}

function drawStartScreen() {
  drawFullBackground();
  updateAndDrawStartFireflies();
  drawOldPaperNotice();
  drawStartButton();
}

// Randomly but evenly generate 40 fireflies
function createFireflies() {
  fireflies = [];

  // Divide the screen into a 8 x 5 grid
  let total = 40;
  let cols = 8;
  let rows = 5;

  // Set margins to keep fireflies away from the screen edges
  let marginX = width * 0.06;
  let marginY = height * 0.08;

  // Calculate the width and height of each grid cell
  let cellW = (width - marginX * 2) / cols;
  let cellH = (height - marginY * 2) / rows;

  // Generate one firefly inside each grid cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (fireflies.length >= total) {
        return;
      }

      // Store firefly properties
      fireflies.push({
        x: marginX + col * cellW + random(cellW),
        y: marginY + row * cellH + random(cellH),
        coreSize: random(5, 8),
        maxGlow: random(35, 65),
        speed: random(0.003, 0.008),
        offset: random(1),
        noiseX: random(1000),
        noiseY: random(1000)
      });
    }
  }
}

function updateAndDrawStartFireflies() {
  blendMode(ADD);

  for (let f of fireflies) {
    let driftX = map(noise(f.noiseX, frameCount * 0.006), 0, 1, -0.35, 0.35);
    let driftY = map(noise(f.noiseY, frameCount * 0.006), 0, 1, -0.35, 0.35);
    f.x = constrain(f.x + driftX, 18, width - 18);
    f.y = constrain(f.y + driftY, 18, height - 18);

    if (f.x < width / 2) {
      drawBreathingLight(
        f.x,
        f.y,
        f.coreSize,
        f.maxGlow,
        f.speed,
        f.offset,
        color(255, 145, 30),
        color(255, 210, 80),
        color(255, 245, 180),
        1
      );
    } else {
      drawBreathingLight(
        f.x,
        f.y,
        f.coreSize,
        f.maxGlow,
        f.speed,
        f.offset,
        color(40, 150, 255),
        color(120, 210, 255),
        color(220, 250, 255),
        1
      );
    }
  }

  blendMode(BLEND);
}


// Draw the old paper-style mission notice panel.
function drawOldPaperNotice() {
  let noticeW = constrain(width * 0.78, 320, 920);
  let noticeH = constrain(height * 0.31, 215, 295);
  let noticeX = width / 2;
  let noticeY = max(height * 0.24, startButtonBounds.y - startButtonBounds.h / 2 - noticeH / 2 - 34);

  rectMode(CENTER);
  noStroke();
  fill(20, 12, 4, 95);
  rect(noticeX + 5, noticeY + 7, noticeW, noticeH, 18);

  fill(230, 202, 145, 232);
  rect(noticeX, noticeY, noticeW, noticeH, 18);

  fill(250, 229, 172, 160);
  rect(noticeX, noticeY - 4, noticeW - 20, noticeH - 18, 14);

  stroke(83, 49, 22, 130);
  strokeWeight(2);
  line(noticeX - noticeW / 2 + 22, noticeY - noticeH / 2 + 18, noticeX + noticeW / 2 - 26, noticeY - noticeH / 2 + 13);
  line(noticeX - noticeW / 2 + 18, noticeY + noticeH / 2 - 16, noticeX + noticeW / 2 - 20, noticeY + noticeH / 2 - 20);
  noStroke();

  let bodySize = constrain(width * 0.018, 13, 22);
  let smallSize = constrain(width * 0.015, 12, 18);
  let y = noticeY - noticeH * 0.32;
  let lineGap = noticeH * 0.105;

  textAlign(CENTER, CENTER);
  textFont("Dancing Script, Georgia, serif");
  textStyle(NORMAL);
  textSize(bodySize);
  fill(72, 42, 20);
  text("What you see are not ordinary fireflies, but shattered stars fallen from the sky.", noticeX, y);
  text("Fragments of red giants have fallen as warm Sundrops, and the dust of white dwarfs as cool Moonbeams.", noticeX, y + lineGap);
  text("They are lost in this mystic forest, waiting for your voice guiding.", noticeX, y + lineGap * 2);

  textFont("Georgia, serif");
  textSize(smallSize);
  fill(64, 38, 20);
  text("Your mission is to catch two types of fireflies:", noticeX, y + lineGap * 3.45);

  textStyle(BOLD);
  fill(230, 103, 25);
  text("Sundrops", noticeX - noticeW * 0.16, y + lineGap * 4.25);
  fill(35, 150, 255);
  text("Moonbeams", noticeX + noticeW * 0.16, y + lineGap * 4.25);

  textStyle(NORMAL);
  fill(64, 38, 20);
  text("You have 120 seconds each round, with surprises along the way.", noticeX, y + lineGap * 5.05);
  text("Are you ready to catch?", noticeX, y + lineGap * 5.8);
}

// Draw the animated start button with hover and glow effects.
function drawStartButton() {
  let b = startButtonBounds;
  let hover = isMouseInside(b);
  let pulse = 0.5 + 0.5 * sin(frameCount * 0.055);
  let floatY = sin(frameCount * 0.025) * 5;

  rectMode(CENTER);
  noStroke();
  fill(255, 205, 92, hover ? 70 : 45);
  rect(b.x, b.y + floatY, b.w + 20 + pulse * 12, b.h + 20 + pulse * 12, 24);

  stroke(255, 215, 110, hover ? 235 : 175);
  strokeWeight(2);
  fill(31, 47, 72, hover ? 182 : 154);
  rect(b.x, b.y + floatY, b.w, b.h, 22);

  noStroke();
  fill(255, 255, 255, 28);
  rect(b.x, b.y + floatY - b.h * 0.18, b.w * 0.9, b.h * 0.28, 16);

  textAlign(CENTER, CENTER);
  textFont("Luminari, Georgia, serif");
  textStyle(BOLD);
  fill(255, 225, 120);
  fitText("The Star Keeper", b.w * 0.86, 40, 23);
  text("The Star Keeper", b.x, b.y + floatY - b.h * 0.12);

  textFont("Roboto, Arial, sans-serif");
  textStyle(NORMAL);
  textSize(constrain(b.h * 0.18, 15, 22));
  fill(232, 246, 255);
  text("Game Start", b.x, b.y + floatY + b.h * 0.26);
}

// Create a breathing light effect with pulsing glow rings.
function drawBreathingLight(x, y, coreSize, maxGlow, speed, offset, outerColor, middleColor, innerColor, alphaScale) {
  let t = (frameCount * speed + offset) % 1;
  let breath = sin(t * PI);
  let alpha = map(breath, 0, 1, 35, 220) * alphaScale;
  let ringSize1 = map(t, 0, 1, coreSize, maxGlow);
  let ringAlpha1 = map(t, 0, 1, 180, 0) * alphaScale;
  let ringProgress2 = (t + 0.35) % 1;
  let ringSize2 = map(ringProgress2, 0, 1, coreSize, maxGlow * 1.2);
  let ringAlpha2 = map(ringProgress2, 0, 1, 130, 0) * alphaScale;

  noStroke();
  fill(red(outerColor), green(outerColor), blue(outerColor), alpha * 0.18);
  circle(x, y, maxGlow * breath * 1.5);

  fill(red(middleColor), green(middleColor), blue(middleColor), ringAlpha1 * 0.5);
  circle(x, y, ringSize1);

  fill(red(outerColor), green(outerColor), blue(outerColor), ringAlpha2 * 0.35);
  circle(x, y, ringSize2);

  fill(red(innerColor), green(innerColor), blue(innerColor), alpha);
  circle(x, y, coreSize + breath * 5);

  fill(255, alpha);
  circle(x, y, coreSize * 0.45);
}

// Automatically reduce text size until it fits within the target width.
function fitText(label, maxW, startSize, minSize) {
  let s = startSize;
  textSize(s);

  while (textWidth(label) > maxW && s > minSize) {
    s -= 1;
    textSize(s);
  }
}