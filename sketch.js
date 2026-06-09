// ============================================================================
// AI Acknowledgement:
// This file were developed with the assistance of Generative AI (Codex).
// Specifically, the AI was used to help implement visual styling and typography techniques. 
// This includes loading custom local font files (loadFont), applying additive blending for glowing effects (blendMode), configuring image transparency and alignment (tint/imageMode), and utilizing the HTML5 Canvas drawingContext to add drop shadows to text.
// All generated logic has been reviewed by team.
// ============================================================================

// sketch: global canvas setup, start screen, background drawing, and shared visual helpers.

// Core image assets used before the round begins.
let bg;
let paperImg;

// Global custom font variables downloaded by user.
let customStoryFont = null;
let customButtonFont = null;

// Decorative fireflies for the start screen only. Gameplay fireflies live in Berlin Noise.js.
let fireflies = [];

// Button bounds are stored as objects so the same values can be used for drawing and hit-testing.
let startButtonBounds = { x: 0, y: 0, w: 360, h: 130 };
let gameTopButtonBounds = { x: 0, y: 0, w: 310, h: 38 };
let endButtonBounds = { x: 0, y: 0, w: 260, h: 54 };

// p5 calls preload before setup, so all image and audio assets can be ready before drawing begins.
function preload() {
  bg = loadImage("background.png");
  paperImg = loadImage("assets/paper.png");
  
  // Safely load the custom downloaded local fonts from the assets folder
  // [Out of the course] loadFont(): Loads custom local font files (.ttf/.otf) from the assets folder into memory before the sketch starts. Sourced from the p5.js official reference and suggested by AI for better typography.
  customStoryFont = loadFont("assets/DancingScript-SemiBold.ttf");
  customButtonFont = loadFont("assets/Luminari-Regular.ttf");

  preloadAudioFiles();
  preloadTimeAssets();
  preloadUserInputAssets();
}

// Create a full-window canvas and prepare the first start-screen firefly layout.
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  noStroke();
  updateLayoutValues();
  createFireflies();
}

// Route the drawing work to the correct screen based on the current game state.
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

// Keep the canvas responsive and rebuild positions when the browser size changes.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateLayoutValues();

  if (gameState === "playing") {
    rebuildGameBounds();
  } else {
    createFireflies();
  }
}

// Store responsive UI dimensions in one place so every screen uses the same layout logic.
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

// Draw the forest background and a dark wash so glowing objects stay readable.
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

// The start screen combines the background, ambient fireflies, story paper, and start button.
function drawStartScreen() {
  drawFullBackground();
  updateAndDrawStartFireflies();
  drawOldPaperNotice();
  drawStartButton();
}

// Build an even 8 x 5 distribution so the start screen always shows exactly 40 fireflies.
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

// Move the start-screen fireflies gently with noise so the title screen feels alive.
// [Out of the course] blendMode(ADD) / blendMode(BLEND): Alters how overlapping shapes blend together. 'ADD' mode mathematically sums the pixel colors, creating a glowing, light-emitting effect for the start-screen fireflies. Sourced from the p5.js documentation.
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

// Draw the rule/story text on the paper image asset instead of generating a paper shape in code.
function drawOldPaperNotice() {
  let paperX = width / 2;
  let paperY = height * 0.34;
  let paperW = constrain(width * 0.82, 680, 1220);
  let paperRatio = paperImg ? paperImg.height / paperImg.width : 0.32;
  let paperH = paperW * paperRatio;
  // [Out of the course] tint() and imageMode(): tint() applies an alpha transparency filter to the paper image, making it semi-transparent. imageMode(CENTER) sets the drawing anchor to the image's center instead of the top-left corner. Suggested by AI.
  if (paperImg) {
    tint(255, 178); // Set to 70% opacity
    imageMode(CENTER);
    image(paperImg, paperX, paperY, paperW, paperH);
    imageMode(CORNER);
    noTint();
  }

  let bodySize = 20;  
  let smallSize = 22; 
  let originalLabelSize = 14; 
  
  // Custom spacing adjustments: Line gap expanded to 32px for premium layout breathing room
  let lineGap = 32;   // Increased from 24
  let textY = paperY - 80; // Shifted up slightly from -60 to center the newly spaced block perfectly

  textAlign(CENTER, CENTER);
  
  // Isolate state changes for the narrative story styling block
  push();
  // Apply HTML5 canvas drawing engine filters to create a smooth dark-grey dropshadow
  // [Out of the course] drawingContext.shadowColor / shadowBlur / shadowOffset: Accesses the underlying HTML5 Canvas API directly to apply a drop shadow effect behind the text. Suggested by AI to improve text readability against the bright paper background.
  drawingContext.shadowColor = color(20, 20, 20, 180);
  drawingContext.shadowBlur = 5;
  drawingContext.shadowOffsetX = 2;
  drawingContext.shadowOffsetY = 2;
  // [Out of the course] textFont(): Replaces the default system font with the custom fonts loaded earlier (or specific web-safe fallback fonts) to improve the visual design and hierarchy of the interface. Sourced from p5.js documentation.
  if (customStoryFont) {
    textFont(customStoryFont);
  } else {
    textFont("Dancing Script, cursive");
  }
  
  textStyle(NORMAL);
  textSize(bodySize);
  fill(255, 248, 232, 238);
  
  // Render new story instructions lines wrapped in localized shadow layers
  text("What you see are not ordinary fireflies, but shattered stars fallen from the sky.", paperX, textY);
  text("They lost in this mystic forest, waiting for your voice guiding.", paperX, textY + lineGap);

  textSize(smallSize);
  text("Your mission is to catch two types of fireflies:", paperX, textY + lineGap * 2.3);
  pop(); // Drop shadow filter context pop ensures no leaking to core identity terms or buttons

  // Keep original highly readable Georgia serif font for colored species labels (No shadow, original size)
  textFont("Georgia, serif"); 
  textStyle(BOLD);
  textSize(originalLabelSize);
  
  // Left Side: Sundrops (Warm-colors Fireflies)
  fill(230, 103, 25);
  text("Sundrops (Warm-colors Fireflies)", paperX - 170, textY + lineGap * 3.2); 
  
  // Right Side: Moonbeams (Cool-colors Fireflies)
  fill(35, 150, 255);
  text("Moonbeams (Cool-colors Fireflies)", paperX + 170, textY + lineGap * 3.2); 

  // Isolate text layout states again for remaining footers
  // [Out of the course] drawingContext.shadowColor / shadowBlur / shadowOffset: Accesses the underlying HTML5 Canvas API directly to apply a drop shadow effect behind the text. Suggested by AI to improve text readability against the bright paper background.
  push();
  drawingContext.shadowColor = color(20, 20, 20, 180);
  drawingContext.shadowBlur = 5;
  drawingContext.shadowOffsetX = 2;
  drawingContext.shadowOffsetY = 2;
  // [Out of the course] textFont(): Replaces the default system font with the custom fonts loaded earlier (or specific web-safe fallback fonts) to improve the visual design and hierarchy of the interface. Sourced from p5.js documentation.
  if (customStoryFont) {
    textFont(customStoryFont);
  } else {
    textFont("Dancing Script, cursive");
  }
  textStyle(NORMAL);
  fill(255, 248, 232, 238);
  
  textSize(bodySize);
  text("You have 120 seconds each round, and watch out for unexpected surprises along the way!", paperX, textY + lineGap * 4.1);
  textSize(smallSize);
  text("Are you ready to catch?", paperX, textY + lineGap * 5); 
  pop();
}

// Draw the large magical start button and keep it visually inviting with pulse and float motion.
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
  
  // Apply downloaded local Luminari font asset for the main button title header
  // [Out of the course] textFont(): Replaces the default system font with the custom fonts loaded earlier (or specific web-safe fallback fonts) to improve the visual design and hierarchy of the interface. Sourced from p5.js documentation.
  if (customButtonFont) {
    textFont(customButtonFont);
  } else {
    textFont("Luminari, Georgia, serif");
  }
  
  textStyle(BOLD);
  fill(255, 225, 120);
  fitText("The Star Keeper", b.w * 0.86, 40, 23);
  text("The Star Keeper", b.x, b.y + floatY - b.h * 0.12);
  // [Out of the course] textFont(): Replaces the default system font with the custom fonts loaded earlier (or specific web-safe fallback fonts) to improve the visual design and hierarchy of the interface. Sourced from p5.js documentation.
  textFont("Roboto, Arial, sans-serif");
  textStyle(NORMAL);
  textSize(constrain(b.h * 0.18, 15, 22));
  fill(232, 246, 255);
  text("GO!", b.x, b.y + floatY + b.h * 0.26); 
}

// Shared glow renderer used by start-screen and normal gameplay fireflies.
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

// Reduce text size only when needed so long button labels never overflow their button.
function fitText(label, maxW, startSize, minSize) {
  let s = startSize;
  textSize(s);

  while (textWidth(label) > maxW && s > minSize) {
    s -= 1;
    textSize(s);
  }
}