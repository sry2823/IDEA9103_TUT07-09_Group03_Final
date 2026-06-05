// Game scene: round setup, random firefly generation, Berlin-noise movement, and top UI.

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

function startGameScene() { startNewRound(); }

function startNewRound() {
  gameState = "playing";
  gameStarted = true;
  gameFireflies = [];
  leftCaptured = 0; rightCaptured = 0;
  leftFlipStart = -1000; rightFlipStart = -1000;

  leftFireflyCount = floor(random(10, 31));
  rightFireflyCount = totalFireflies - leftFireflyCount;

  leftTarget = chooseCaptureTarget(leftFireflyCount);
  rightTarget = chooseCaptureTarget(rightFireflyCount);

  createSideFireflies("left", leftFireflyCount);
  createSideFireflies("right", rightFireflyCount);

  resetCaptureSystem();
  stopBeatEvent();
  startTimeSystem();
  startAudioSystem();
  resetAudioRound();
  startSpecialNoteRound();
}

function chooseCaptureTarget(sideCount) {
  let minTarget = max(1, floor(sideCount * 0.45));
  let maxTarget = max(minTarget, sideCount - 1);
  return floor(random(minTarget, maxTarget + 1));
}

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
  if (gameState === "playing") checkMissionComplete();
}

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
    for (let col = 0; col < cols; col++) cells.push({ col: col, row: row });
  }

  shuffle(cells, true);

  for (let i = 0; i < count; i++) {
    let cell = cells[i];
    let position = getClearRandomPosition({
      minX: bounds.minX + cell.col * cellW,
      maxX: bounds.minX + (cell.col + 1) * cellW,
      minY: bounds.minY + cell.row * cellH,
      maxY: bounds.minY + (cell.row + 1) * cellH
    }, 44, 16);

    gameFireflies.push({
      side: side,
      type: side === "left" ? "warm" : "cool",
      visible: true,
      caught: false,
      inQte: false,
      x: position.x,
      y: position.y,
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
      noiseSpeed: random(0.02, 0.04), // Increased sampling frequency for erratic movement
      flightSpeed: random(6.0, 10.0), // Increased base flight speed
      vx: random(-4, 4),
      vy: random(-4, 4),
      floatOffset: random(TWO_PI),
      floatSpeed: random(0.025, 0.045),
      repelRadius: random(65, 95),
      repelStrength: random(0.1, 0.18),
      edgeMargin: 55,
      edgeForce: 0.15
    });
  }
}

function getSideBounds(side) {
  let margin = 35;
  let minX = margin;
  let maxX = width / 2 - margin;
  if (side === "right") { minX = width / 2 + margin; maxX = width - margin; }
  return { minX: minX, maxX: maxX, minY: topUIHeight + 20, maxY: height - margin };
}

function rebuildGameBounds() {
  for (let f of gameFireflies) {
    let bounds = getSideBounds(f.side);
    f.minX = bounds.minX; f.maxX = bounds.maxX; f.minY = bounds.minY; f.maxY = bounds.maxY;
    f.x = constrain(f.x, f.minX, f.maxX); f.y = constrain(f.y, f.minY, f.maxY);
  }
}

function getClearRandomPosition(bounds, minDistance, tries) {
  let bestPos = { x: random(bounds.minX, bounds.maxX), y: random(bounds.minY, bounds.maxY) };
  let bestDist = 0;
  for (let i = 0; i < tries; i++) {
    let x = random(bounds.minX, bounds.maxX);
    let y = random(bounds.minY, bounds.maxY);
    let d = getNearestSpecialDistance(x, y);
    if (d >= minDistance) return { x: x, y: y };
    if (d > bestDist) { bestDist = d; bestPos = { x: x, y: y }; }
  }
  return bestPos;
}

function getNearestSpecialDistance(x, y) {
  let d = 99999;
  for (let f of gameFireflies) if (f.visible && !f.caught) d = min(d, dist(x, y, f.x, f.y));
  if (redFirefly !== null) d = min(d, dist(x, y, redFirefly.x, redFirefly.y));
  if (silverNote !== null) d = min(d, dist(x, y, silverNote.x, silverNote.y));
  return d;
}

function updateAndDrawGameFireflies() {
  blendMode(ADD);
  for (let i = 0; i < gameFireflies.length; i++) {
    let f = gameFireflies[i];
    if (!f.visible || f.caught) continue;
    if (ecgEventActive) updateEcgFirefly(f);
    else if (!f.inQte && !isFireflyFrozen(f)) moveFireflyWithNoise(f);
    drawNormalFirefly(f);
  }
  blendMode(BLEND);
}

function drawNormalFirefly(f) {
  let alphaScale = isSideTargetComplete(f.side) ? 0.35 : 1;
  if (f.side === "left") drawBreathingLight(f.x, f.y, f.coreSize, f.maxGlow, f.breatheSpeed, f.breatheOffset, color(255, 145, 30), color(255, 210, 80), color(255, 245, 180), alphaScale);
  else drawBreathingLight(f.x, f.y, f.coreSize, f.maxGlow, f.breatheSpeed, f.breatheOffset, color(40, 150, 255), color(120, 210, 255), color(220, 250, 255), alphaScale);
}

function moveFireflyWithNoise(f) {
  let time = frameCount * f.noiseSpeed;
  let nx = noise(f.noiseSeedX, time);
  let ny = noise(f.noiseSeedY, time);
  let slowScale = getSideSlowSpeedScale(f.side);
  let targetVX = map(nx, 0, 1, -1.4, 1.4) * f.flightSpeed;
  let targetVY = map(ny, 0, 1, -1.4, 1.4) * f.flightSpeed;
  f.vx = lerp(f.vx, targetVX, 0.085);
  f.vy = lerp(f.vy, targetVY, 0.085);
  addSeparationForce(f);
  addSpecialRepelForce(f);
  addEdgeForce(f);
  let speed = sqrt(f.vx**2 + f.vy**2);
  let maxS = max(2.5, f.flightSpeed * 1.8);
  if (speed > maxS) { f.vx = (f.vx / speed) * maxS; f.vy = (f.vy / speed) * maxS; }
  f.x += (f.vx + sin(frameCount * f.floatSpeed + f.floatOffset) * 0.45) * slowScale;
  f.y += (f.vy + cos(frameCount * f.floatSpeed + f.floatOffset) * 0.45) * slowScale;
  keepFireflyInBounds(f);
}

function addSeparationForce(f) {
  let sx=0, sy=0, count=0;
  for (let o of gameFireflies) {
    if (o !== f && o.side === f.side && o.visible) {
      let d = dist(f.x, f.y, o.x, o.y);
      if (d > 0 && d < f.repelRadius) {
        let force = (f.repelRadius - d) / f.repelRadius;
        sx += ((f.x - o.x) / d) * force; sy += ((f.y - o.y) / d) * force; count++;
      }
    }
  }
  if (count > 0) { f.vx += (sx / count) * f.repelStrength * 10; f.vy += (sy / count) * f.repelStrength * 10; }
}

function addSpecialRepelForce(f) {
  addVelocityRepelFromObject(f, redFirefly, 82, 0.55);
  addVelocityRepelFromObject(f, silverNote, 78, 0.45);
}

function addVelocityRepelFromObject(f, o, distReq, str) {
  if (o === null || o === f) return;
  let d = dist(f.x, f.y, o.x, o.y);
  if (d > 0 && d < distReq) {
    let fce = (distReq - d) / distReq;
    f.vx += ((f.x - o.x) / d) * fce * str; f.vy += ((f.y - o.y) / d) * fce * str;
  }
}

function pushAwayFromOtherObjects(obj, distReq, str) {
  for (let f of gameFireflies) if (f.visible && !f.caught) pushAwayFromObject(obj, f, distReq, str);
  if (redFirefly !== null && redFirefly !== obj) pushAwayFromObject(obj, redFirefly, distReq, str);
  if (silverNote !== null && silverNote !== obj) pushAwayFromObject(obj, silverNote, distReq, str);
}

function pushAwayFromObject(obj, o, distReq, str) {
  let d = dist(obj.x, obj.y, o.x, o.y);
  if (d > 0 && d < distReq) {
    let fce = (distReq - d) / distReq;
    obj.x += ((obj.x - o.x) / d) * fce * str; obj.y += ((obj.y - o.y) / d) * fce * str;
  }
}

function addEdgeForce(f) {
  if (f.x < f.minX + f.edgeMargin) f.vx += f.edgeForce;
  if (f.x > f.maxX - f.edgeMargin) f.vx -= f.edgeForce;
  if (f.y < f.minY + f.edgeMargin) f.vy += f.edgeForce;
  if (f.y > f.maxY - f.edgeMargin) f.vy -= f.edgeForce;
}

function keepFireflyInBounds(f) {
  if (f.x < f.minX) { f.x = f.minX; f.vx = abs(f.vx); f.noiseSeedX += random(20, 80); }
  if (f.x > f.maxX) { f.x = f.maxX; f.vx = -abs(f.vx); f.noiseSeedX += random(20, 80); }
  if (f.y < f.minY) { f.y = f.minY; f.vy = abs(f.vy); f.noiseSeedY += random(20, 80); }
  if (f.y > f.maxY) { f.y = f.maxY; f.vy = -abs(f.vy); f.noiseSeedY += random(20, 80); }
}

function drawGameTopInfo() {
  rectMode(CENTER); noStroke(); fill(2, 7, 18, 165); rect(width / 2, 50, width, topUIHeight, 0);
  drawTopRestartButton(); drawTimeLabel(); drawSideCounter("left"); drawSideCounter("right");
}

function drawTopRestartButton() {
  let b = gameTopButtonBounds; let hover = isMouseInside(b);
  rectMode(CENTER); stroke(255, 218, 120, hover ? 220 : 145); strokeWeight(1.5); fill(27, 45, 69, hover ? 205 : 160); rect(b.x, b.y, b.w, b.h, 13);
  noStroke(); textFont("Luminari, Georgia, serif"); textStyle(BOLD); fill(255, 224, 120); fitText("The Star Keeper", b.w * 0.68, 22, 16); text("The Star Keeper", b.x - 16, b.y); drawRestartIcon(b.x + b.w * 0.38, b.y, 17);
}

function drawRestartIcon(cx, cy, s) {
  noFill(); stroke(230, 246, 255, 220); strokeWeight(2); arc(cx, cy, s, s, -PI * 0.15, PI * 1.35);
  noStroke(); fill(230, 246, 255, 220); triangle(cx + s * 0.44, cy - s * 0.1, cx + s * 0.55, cy - s * 0.42, cx + s * 0.2, cy - s * 0.34);
}

function drawTimeLabel() {
  textFont("Roboto, Arial, sans-serif"); 
  textStyle(BOLD); 
  textAlign(CENTER, CENTER); 
  textSize(18); 
  fill(242, 248, 255);
  // Main countdown timer text
  text("Time Left: " + max(0, roundTimeLeft), width / 2, 65);

  // Subtitle instruction styling
  textStyle(NORMAL); 
  textSize(13); 
  fill(224, 236, 255, 215); 
  
  // Line 1: Instruction for Orange side (Eee)
  text('Vocalize  short  "Eee"  for  Orange  and  short  "Ooh"  for  Blue', width / 2, 90);
  
}

function drawSideCounter(side) {
  let x = side === "left" ? width * 0.25 : width * 0.75;
  let label = side === "left" ? "Sundrops" : "Moonbeams";
  let captured = side === "left" ? leftCaptured : rightCaptured;
  let target = side === "left" ? leftTarget : rightTarget;
  let flipStart = side === "left" ? leftFlipStart : rightFlipStart;
  let c = side === "left" ? color(255, 164, 56) : color(97, 195, 255);
  textAlign(CENTER, CENTER); textFont("Roboto, Arial, sans-serif"); textStyle(BOLD); textSize(24); fill(c); text(label, x, 38);
  let age = millis() - flipStart; let pulse = age < 450 ? sin(map(age, 0, 450, 0, PI)) : 0;
  rectMode(CENTER); noStroke(); fill(0, 95); rect(x, 75, 108 + pulse * 8, 36, 8);
  fill(red(c), green(c), blue(c), 32 + pulse * 45); rect(x, 75, 108 + pulse * 8, 36, 8);
  stroke(255, 255, 255, 45 + pulse * 120); line(x - 54, 75, x + 54, 75);
  noStroke(); fill(255); textSize(25 + pulse * 6); text(captured + " / " + target, x, 75);
}

function isSideTargetComplete(side) { return side === "left" ? leftCaptured >= leftTarget : rightCaptured >= rightTarget; }
function addCapturedFirefly(side) {
  if (side === "left" && leftCaptured < leftTarget) { leftCaptured++; leftFlipStart = millis(); }
  if (side === "right" && rightCaptured < rightTarget) { rightCaptured++; rightFlipStart = millis(); }
}

function checkMissionComplete() { if (leftCaptured >= leftTarget && rightCaptured >= rightTarget) setGameResult("win"); }

function setGameResult(result) {
  if (gameState !== "playing") return;
  gameState = result; gameStarted = false; resetCaptureSystem(); clearRoundTimeEvents(); stopBeatEvent();
}

function returnToStartScreen() {
  gameState = "start"; gameStarted = false; resetCaptureSystem(); clearRoundTimeEvents(); stopBeatEvent(); stopAudioSystem(); createFireflies();
}