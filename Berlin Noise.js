// Game scene: random fireflies, Perlin-noise movement, and the top UI.
// "Berlin Noise" in the file name is kept from the project plan.

let gameState = "start";
let gameStarted = false;

let gameFireflies = [];
let leftFireflyCount = 0;
let rightFireflyCount = 0;
let leftTarget = 0;
let rightTarget = 0;
let leftCaptured = 0;
let rightCaptured = 0;
let totalFireflies = 40;
let topUIHeight = 118;

let leftFlipStart = -1000;
let rightFlipStart = -1000;

// Start the game scene and begin a new round.
function startGameScene() {
  startNewRound();
}

// Initialize a new round and reset all gameplay data.
function startNewRound() {
  gameState = "playing";
  gameStarted = true;

  gameFireflies = [];
  leftCaptured = 0;
  rightCaptured = 0;
  leftFlipStart = -1000;
  rightFlipStart = -1000;

  leftFireflyCount = floor(random(10, 31));
  rightFireflyCount = totalFireflies - leftFireflyCount;

  leftTarget = chooseTargetNumber(leftFireflyCount);
  rightTarget = chooseTargetNumber(rightFireflyCount);

  createSideFireflies("left", leftFireflyCount);
  createSideFireflies("right", rightFireflyCount);

  resetCaptureSystem();
  stopBeatEvent();
  startTimeSystem();
  startAudioSystem();
  resetAudioRound();
  startSpecialNoteRound();
}

// Randomly select a target number for the mission.
function chooseTargetNumber(count) {
  let low = min(5, count - 2);
  let high = max(low + 1, count - 1);
  return floor(random(low, high + 1));
}

// Update and render the main gameplay scene.
function drawGameScene() {
  drawFullBackground();

  updateAudioSystem();
  timeSystem();
  updateSpecialNoteSystem();

  drawGameTopInfo();
  updateAndDrawGameFireflies();
  drawRedFirefly();
  drawSilverNote();
  drawFrozenSide();
  drawDisappearEffects();
  drawCaptureQTE();

  if (gameState === "playing") {
    checkMissionComplete();
  }
}

// Create fireflies and distribute them within one side of the screen.
function createSideFireflies(side, count) {
  let bounds = getSideBounds(side);
  let areaW = bounds.maxX - bounds.minX;
  let areaH = bounds.maxY - bounds.minY;
  let cols = ceil(sqrt(count * areaW / areaH)) + 1;
  let rows = ceil(count / cols) + 1;
  let cellW = areaW / cols;
  let cellH = areaH / rows;
  let cells = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({ col: col, row: row });
    }
  }

  shuffle(cells, true);

  for (let i = 0; i < count; i++) {
    let cell = cells[i];
    let x = bounds.minX + cell.col * cellW + random(cellW);
    let y = bounds.minY + cell.row * cellH + random(cellH);

    gameFireflies.push({
      side: side,
      type: side === "left" ? "warm" : "cool",
      visible: true,
      caught: false,
      inQte: false,
      x: x,
      y: y,
      minX: bounds.minX,
      maxX: bounds.maxX,
      minY: bounds.minY,
      maxY: bounds.maxY,
      coreSize: random(5, 8),
      maxGlow: random(36, 62),
      breatheSpeed: random(0.003, 0.008),
      breatheOffset: random(1),
      noiseSeedX: random(1000),
      noiseSeedY: random(1000),
      noiseSpeed: random(0.004, 0.009),
      flightSpeed: random(0.75, 1.35),
      vx: random(-1, 1),
      vy: random(-1, 1),
      floatOffset: random(TWO_PI),
      floatSpeed: random(0.015, 0.032),
      repelRadius: random(58, 80),
      repelStrength: random(0.055, 0.09),
      edgeMargin: 45,
      edgeForce: 0.08
    });
  }
}

// Calculate movement boundaries for a specific side.
function getSideBounds(side) {
  let margin = 35;
  let minX = margin;
  let maxX = width / 2 - margin;

  if (side === "right") {
    minX = width / 2 + margin;
    maxX = width - margin;
  }

  return {
    minX: minX,
    maxX: maxX,
    minY: topUIHeight + 20,
    maxY: height - margin
  };
}

// Recalculate firefly boundaries after screen changes.
function rebuildGameBounds() {
  for (let f of gameFireflies) {
    let bounds = getSideBounds(f.side);
    f.minX = bounds.minX;
    f.maxX = bounds.maxX;
    f.minY = bounds.minY;
    f.maxY = bounds.maxY;
    f.x = constrain(f.x, f.minX, f.maxX);
    f.y = constrain(f.y, f.minY, f.maxY);
  }
}

// Update firefly movement and draw all active fireflies.
function updateAndDrawGameFireflies() {
  blendMode(ADD);

  for (let i = 0; i < gameFireflies.length; i++) {
    let f = gameFireflies[i];

    if (f.visible === false || f.caught === true) {
      continue;
    }

    if (ecgEventActive) {
      updateEcgFirefly(f, i);
    } else if (!f.inQte && !isFireflyFrozen(f)) {
      moveFireflyWithNoise(f);
    }

    drawNormalFirefly(f);
  }

  blendMode(BLEND);
}

// Draw a normal warm or cool firefly.
function drawNormalFirefly(f) {
  let alphaScale = isSideTargetComplete(f.side) ? 0.35 : 1;

  if (f.side === "left") {
    drawBreathingLight(
      f.x,
      f.y,
      f.coreSize,
      f.maxGlow,
      f.breatheSpeed,
      f.breatheOffset,
      color(255, 145, 30),
      color(255, 210, 80),
      color(255, 245, 180),
      alphaScale
    );
  } else {
    drawBreathingLight(
      f.x,
      f.y,
      f.coreSize,
      f.maxGlow,
      f.breatheSpeed,
      f.breatheOffset,
      color(40, 150, 255),
      color(120, 210, 255),
      color(220, 250, 255),
      alphaScale
    );
  }
}

// Move a firefly using Perlin-noise-based motion.
function moveFireflyWithNoise(f) {
  let time = frameCount * f.noiseSpeed;
  let nx = noise(f.noiseSeedX, time);
  let ny = noise(f.noiseSeedY, time);
  let audioSpeedScale = getFireflySpeedScale(f);

  let targetVX = map(nx, 0, 1, -1, 1) * f.flightSpeed * audioSpeedScale;
  let targetVY = map(ny, 0, 1, -1, 1) * f.flightSpeed * audioSpeedScale;

  f.vx = lerp(f.vx, targetVX, 0.035);
  f.vy = lerp(f.vy, targetVY, 0.035);

  addSeparationForce(f);
  addEdgeForce(f);

  let currentSpeed = sqrt(f.vx * f.vx + f.vy * f.vy);
  let maxSpeed = max(0.8, f.flightSpeed * audioSpeedScale * 1.9);

  if (currentSpeed > maxSpeed) {
    f.vx = (f.vx / currentSpeed) * maxSpeed;
    f.vy = (f.vy / currentSpeed) * maxSpeed;
  }

  let floatX = sin(frameCount * f.floatSpeed + f.floatOffset) * 0.28;
  let floatY = cos(frameCount * f.floatSpeed + f.floatOffset) * 0.28;
  f.x += f.vx + floatX;
  f.y += f.vy + floatY;

  keepFireflyInBounds(f);
}

// Apply separation forces to prevent fireflies from overlapping.
function addSeparationForce(f) {
  let separateX = 0;
  let separateY = 0;
  let closeCount = 0;

  for (let other of gameFireflies) {
    if (other !== f && other.side === f.side && other.visible !== false) {
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
    f.vx += (separateX / closeCount) * f.repelStrength * 10;
    f.vy += (separateY / closeCount) * f.repelStrength * 10;
  }
}

// Push fireflies away from the edges of their area.
function addEdgeForce(f) {
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
}

// Keep a firefly inside its movement boundaries.
function keepFireflyInBounds(f) {
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

// Draw the top gameplay information panel.
function drawGameTopInfo() {
  rectMode(CENTER);
  noStroke();
  fill(2, 7, 18, 165);
  rect(width / 2, 50, width, topUIHeight, 0);

  drawTopRestartButton();
  drawTimeLabel();
  drawSideCounter("left");
  drawSideCounter("right");
}

// Draw the restart button in the top UI.
function drawTopRestartButton() {
  let b = gameTopButtonBounds;
  let hover = isMouseInside(b);

  rectMode(CENTER);
  stroke(255, 218, 120, hover ? 220 : 145);
  strokeWeight(1.5);
  fill(27, 45, 69, hover ? 205 : 160);
  rect(b.x, b.y, b.w, b.h, 13);

  noStroke();
  textFont("Luminari, Georgia, serif");
  textStyle(BOLD);
  fill(255, 224, 120);
  fitText("The Star Keeper", b.w * 0.68, 22, 16);
  text("The Star Keeper", b.x - 16, b.y);
  drawRestartIcon(b.x + b.w * 0.38, b.y, 17);
}

// Draw the restart icon beside the title.
function drawRestartIcon(cx, cy, s) {
  noFill();
  stroke(230, 246, 255, 220);
  strokeWeight(2);
  arc(cx, cy, s, s, -PI * 0.15, PI * 1.35);
  noStroke();
  fill(230, 246, 255, 220);
  triangle(cx + s * 0.44, cy - s * 0.1, cx + s * 0.55, cy - s * 0.42, cx + s * 0.2, cy - s * 0.34);
}

// Display the remaining round time.
function drawTimeLabel() {
  textFont("Roboto, Arial, sans-serif");
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(18);
  fill(242, 248, 255);
  text("Time Left: " + max(0, roundTimeLeft), width / 2, 72);
  textStyle(NORMAL);
  textSize(13);
  fill(224, 236, 255, 215);
  text('Vocalize "Eee" for Orange or "Ooh" for Blue.', width / 2, 98);
}

// Display the capture progress for one side.
function drawSideCounter(side) {
  let x = side === "left" ? width * 0.25 : width * 0.75;
  let label = side === "left" ? "Sundrops" : "Moonbeams";
  let captured = side === "left" ? leftCaptured : rightCaptured;
  let target = side === "left" ? leftTarget : rightTarget;
  let flipStart = side === "left" ? leftFlipStart : rightFlipStart;
  let c = side === "left" ? color(255, 164, 56) : color(97, 195, 255);

  textAlign(CENTER, CENTER);
  textFont("Roboto, Arial, sans-serif");
  textStyle(BOLD);
  textSize(24);
  fill(c);
  text(label, x, 38);

  let age = millis() - flipStart;
  let pulse = age < 450 ? sin(map(age, 0, 450, 0, PI)) : 0;
  let cardW = 108 + pulse * 8;
  let cardH = 36;

  rectMode(CENTER);
  noStroke();
  fill(0, 95);
  rect(x, 75, cardW, cardH, 8);
  fill(red(c), green(c), blue(c), 32 + pulse * 45);
  rect(x, 75, cardW, cardH, 8);
  stroke(255, 255, 255, 45 + pulse * 120);
  line(x - cardW / 2 + 8, 75, x + cardW / 2 - 8, 75);

  noStroke();
  fill(255);
  textSize(25 + pulse * 6);
  text(captured + " / " + target, x, 75);
}

// Check whether a side has reached its target.
function isSideTargetComplete(side) {
  if (side === "left") {
    return leftCaptured >= leftTarget;
  }
  return rightCaptured >= rightTarget;
}

// Update the captured firefly count for a side.
function addCapturedFirefly(side) {
  if (side === "left" && leftCaptured < leftTarget) {
    leftCaptured++;
    leftFlipStart = millis();
  }

  if (side === "right" && rightCaptured < rightTarget) {
    rightCaptured++;
    rightFlipStart = millis();
  }
}

// Check whether all mission objectives are completed.
function checkMissionComplete() {
  if (leftCaptured >= leftTarget && rightCaptured >= rightTarget) {
    setGameResult("win");
  }
}

// End the round and set the final game result.
function setGameResult(result) {
  if (gameState !== "playing") {
    return;
  }

  gameState = result;
  gameStarted = false;
  resetCaptureSystem();
  clearRoundTimeEvents();
  stopBeatEvent();
}

// Return to the start screen and reset game states.
function returnToStartScreen() {
  gameState = "start";
  gameStarted = false;
  resetCaptureSystem();
  clearRoundTimeEvents();
  stopBeatEvent();
  stopAudioSystem();
  createFireflies();
}
