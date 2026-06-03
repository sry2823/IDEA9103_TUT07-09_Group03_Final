// Main p5 file: background, start screen, and draw loop.

let bg;
let paperImg;
let fireflies = [];

let startButtonBounds = { x: 0, y: 0, w: 360, h: 130 };
let gameTopButtonBounds = { x: 0, y: 0, w: 310, h: 38 };
let endButtonBounds = { x: 0, y: 0, w: 260, h: 54 };

function preload() {
  bg = loadImage("background.png");
  paperImg = loadImage("assets/paper.png");
  preloadAudioFiles();
  preloadTimeAssets();
  preloadUserInputAssets();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  noStroke();
  updateLayoutValues();
  createFireflies();
}

function draw() {
  background(0);

  if (gameState === "playing") {
    drawGameScene();
  } else if (gameState === "win" || gameState === "lose") {
    drawEndScreen(gameState);
  } else {
    drawStartScreen();
  }

  drawCustomCursor();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateLayoutValues();

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

function createFireflies() {
  fireflies = [];

  let total = 40;
  let cols = 8;
  let rows = 5;
  let marginX = width * 0.06;
  let marginY = height * 0.08;
  let cellW = (width - marginX * 2) / cols;
  let cellH = (height - marginY * 2) / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (fireflies.length >= total) {
        return;
      }

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

function drawOldPaperNotice() {
  let noticeW = constrain(width * 0.78, 320, 920);
  let noticeH = constrain(height * 0.31, 215, 295);
  let noticeX = width / 2;
  let noticeY = max(height * 0.24, startButtonBounds.y - startButtonBounds.h / 2 - noticeH / 2 - 34);

  if (paperImg) {
    imageMode(CENTER);
    image(paperImg, noticeX, noticeY, noticeW, noticeH);
    imageMode(CORNER);
  }

  let bodySize = constrain(width * 0.014, 11, 16);
  let smallSize = constrain(width * 0.012, 10, 14);
  let y = noticeY - noticeH * 0.3;
  let lineGap = noticeH * 0.095;

  textAlign(CENTER, CENTER);
  textFont("Dancing Script, Georgia, serif");
  textStyle(NORMAL);
  textSize(bodySize);
  fill(72, 42, 20);
  text("What you see are not ordinary fireflies, but shattered stars fallen from the sky.", noticeX, y, noticeW * 0.72, lineGap * 1.6);
  text("Fragments of red giants have fallen as warm Sundrops, and the dust of white dwarfs as cool Moonbeams.", noticeX, y + lineGap * 1.15, noticeW * 0.72, lineGap * 1.8);
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

function fitText(label, maxW, startSize, minSize) {
  let s = startSize;
  textSize(s);

  while (textWidth(label) > maxW && s > minSize) {
    s -= 1;
    textSize(s);
  }
}
