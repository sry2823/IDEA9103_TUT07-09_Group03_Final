// User input: mouse clicks, QTE capture bar, custom cursor, and end screens.

let activeCapture = null;
let glassImg = null;
let nebulaImg = null;

function preloadUserInputAssets() {
  glassImg = loadImage(
    "assets/glass.png",
    function (img) {
      glassImg = img;
    },
    function () {
      glassImg = null;
    }
  );

  nebulaImg = loadImage(
    "assets/nebula.png",
    function (img) {
      nebulaImg = img;
    },
    function () {
      nebulaImg = null;
    }
  );
  
  netImg = loadImage(
    "assets/net.png",
    function (img) {
      netImg = img;
    },
    function () {
      netImg = null;
    }
  );
}

// Shared rectangle hit test for all button objects that use center x/y and width/height.
function isMouseInside(bounds) {
  return (
    mouseX >= bounds.x - bounds.w / 2 &&
    mouseX <= bounds.x + bounds.w / 2 &&
    mouseY >= bounds.y - bounds.h / 2 &&
    mouseY <= bounds.y + bounds.h / 2
  );
}

// Cancel any current QTE and release a normal firefly if it was frozen for capture.
function resetCaptureSystem() {
  if (activeCapture !== null && activeCapture.target !== null && activeCapture.kind === "normal") {
    activeCapture.target.inQte = false;
  }

  activeCapture = null;
}


// Central click handler for start button, restart buttons, frozen side, and firefly targeting.
function mousePressed() {
  if (gameState === "start") {
    if (isMouseInside(startButtonBounds)) {
      userStartAudio();
      startNewRound();
    }
    return;
  }
   if (gameState === "win" || gameState === "lose") {
    if (isMouseInside(endButtonBounds)) {
      returnToStartScreen();
    }
    return;
  }

  if (gameState !== "playing") {
    return;
  }

  if (isMouseInside(gameTopButtonBounds)) {
    startNewRound();
    return;
  }

  if (isPointInFrozenSide(mouseX, mouseY)) {
    return;
  }

  if (activeCapture !== null) {
    return;
  }

  let targetInfo = findClickedTarget();

  if (targetInfo !== null) {
    // If ECG event is active, bypass QTE and capture immediately
    if (ecgEventActive) {
      activeCapture = { kind: targetInfo.kind, target: targetInfo.target };
      completeCapture();
    } else {
      startCaptureQTE(targetInfo.kind, targetInfo.target);
    }
  }
}// Space is the QTE confirmation key.
function keyPressed() {
  if (gameState === "playing" && activeCapture !== null && key === " ") {
    finishCaptureQTE();
    return false;
  }
}

// Find the closest valid clicked target.
function findClickedTarget() {
  if (silverNote !== null) {
    let noteHit = max(36, silverNote.size * 0.72);

    if (dist(mouseX, mouseY, silverNote.x, silverNote.y) < noteHit && canStartCaptureDuringSideSlow("note", silverNote)) {
      return { kind: "note", target: silverNote };
    }
  }

  if (redFirefly !== null) {
    let redHit = ecgEventActive ? 48 : 26;

    if (dist(mouseX, mouseY, redFirefly.x, redFirefly.y) < redHit && canStartCaptureDuringSideSlow("red", redFirefly)) {
      return { kind: "red", target: redFirefly };
    }
  }

  let nearest = null;
  let nearestDistance = 99999;

  for (let f of gameFireflies) {
    if (!canClickNormalFirefly(f)) {
      continue;
    }

    let hitRadius = ecgEventActive ? 44 : f.coreSize + 24; 
    let d = dist(mouseX, mouseY, f.x, f.y);

    if (d < hitRadius && d < nearestDistance) {
      nearest = f;
      nearestDistance = d;
    }
  }

  if (nearest !== null) {
    return { kind: "normal", target: nearest };
  }

  return null;
}

// Normal fireflies become unclickable when hidden, caught, frozen, already in QTE, or target is complete.
function canClickNormalFirefly(f) {
  if (f.visible === false || f.caught === true || f.inQte === true) {
    return false;
  }

  if (isSideTargetComplete(f.side)) {
    return false;
  }

  if (isFireflyFrozen(f)) {
    return false;
  }

  return true;
}
// Begin a basic QTE with a fixed success zone and a moving cursor.
function startCaptureQTE(kind, target) {
  if (target === null) {
    return;
  }

  if (kind === "normal") {
    target.inQte = true;
  }

  activeCapture = {
    kind: kind,
    target: target,
    x: target.x,
    y: target.y,
    safeStart: 0.40,
    safeW: 0.20,
    cursorPos: 0,
    cursorSpeed: 0.01,
    cursorDir: 1,
    startTime: millis()
  };
}

// Draw and update a simple QTE bar.
function drawCaptureQTE() {
  if (activeCapture === null) {
    return;
  }

  let target = activeCapture.target;
  activeCapture.x = target.x;
  activeCapture.y = target.y;

  activeCapture.cursorPos += activeCapture.cursorSpeed * activeCapture.cursorDir;

  if (activeCapture.cursorPos < 0) {
    activeCapture.cursorPos = 0;
    activeCapture.cursorDir = 1;
  }

  if (activeCapture.cursorPos > 1) {
    activeCapture.cursorPos = 1;
    activeCapture.cursorDir = -1;
  }

  let barW = 180;
  let barH = 14;
  let barX = activeCapture.x;
  let barY = activeCapture.y - 44;

  textAlign(CENTER, CENTER);
  textFont("Roboto, Arial, sans-serif");
  textStyle(BOLD);
  textSize(13);
  fill(235, 246, 255);
  text("Press SPACE", barX, barY - 22);

  rectMode(CENTER);
  noStroke();

  fill(20, 28, 42, 180);
  rect(barX, barY, barW, barH, 7);

  let safeX = barX - barW / 2 + activeCapture.safeStart * barW;
  let safeW = activeCapture.safeW * barW;

  fill(245, 250, 255, 210);
  rect(safeX + safeW / 2, barY, safeW, barH - 4, 5);

  let cursorX = barX - barW / 2 + activeCapture.cursorPos * barW;

  stroke(100, 200, 255);
  strokeWeight(3);
  line(cursorX, barY - barH, cursorX, barY + barH);
}

// Evaluate whether the moving cursor is currently inside the success zone.
function finishCaptureQTE() {
  let p = activeCapture.cursorPos;
  let success = p >= activeCapture.safeStart && p <= activeCapture.safeStart + activeCapture.safeW;

  if (success) {
    completeCapture();
  } else {
    failCapture();
  }
}

// Apply successful capture results for normal fireflies.
function completeCapture() {
  let kind = activeCapture.kind;
  let target = activeCapture.target;

  if (kind === "normal") {
    target.visible = false;
    target.caught = true;
    target.inQte = false;
    addDisappearEffect(target.x, target.y, target.side);
    addCapturedFirefly(target.side);
  }

  activeCapture = null;
  checkMissionComplete();
}

// Failed QTE returns a normal firefly to flight.
function failCapture() {
  let kind = activeCapture.kind;
  let target = activeCapture.target;

  if (kind === "normal") {
    target.inQte = false;
  }

  activeCapture = null;
}

// Begin a QTE with a random white success zone and a moving cursor.
function startCaptureQTE(kind, target) {
  if (target === null) {
    return;
  }

  if (kind === "normal") {
    target.inQte = true;
  }

  let safeW = random(0.35, 0.50);
  let safeStart = random(0.05, 0.95 - safeW);

  let speed = kind === "note" ? random(0.012, 0.018) : random(0.008, 0.013);

  activeCapture = {
    kind: kind,
    target: target,
    x: target.x,
    y: target.y,
    safeStart: safeStart,
    safeW: safeW,
    cursorPos: random(0, 1),
    cursorSpeed: speed,
    cursorDir: random(1) < 0.5 ? -1 : 1,
    startTime: millis()
  };
}

// Draw and update the QTE bar.
function drawCaptureQTE() {
  if (activeCapture === null) {
    return;
  }

  let target = activeCapture.target;
  activeCapture.x = target.x;
  activeCapture.y = target.y;

  activeCapture.cursorPos += activeCapture.cursorSpeed * activeCapture.cursorDir;

  if (activeCapture.cursorPos < 0) {
    activeCapture.cursorPos = 0;
    activeCapture.cursorDir = 1;
  }

  if (activeCapture.cursorPos > 1) {
    activeCapture.cursorPos = 1;
    activeCapture.cursorDir = -1;
  }

  let barW = constrain(width * 0.18, 160, 240);
  let barH = 14;
  let barX = activeCapture.x;
  let barY = activeCapture.y - 48;

  if (barY < topUIHeight + 45) {
    barY = activeCapture.y + 48;
  }

  barX = constrain(barX, barW / 2 + 20, width - barW / 2 - 20);

  textAlign(CENTER, CENTER);
  textFont("Roboto, Arial, sans-serif");
  textStyle(BOLD);
  textSize(14);
  fill(235, 246, 255);
  let textY = barY < activeCapture.y ? barY - barH - 14 : barY + barH + 14;
  text("Press SPACE to catch", barX, textY);

  rectMode(CENTER);
  noStroke();
  
  fill(10, 16, 28, 160);
  rect(barX, barY, barW + 12, barH + 12, 10);

  stroke(235, 246, 255, 145);
  strokeWeight(1.5);
  fill(65, 80, 95, 170);
  rect(barX, barY, barW, barH, 8);

  let safeX = barX - barW / 2 + activeCapture.safeStart * barW;
  let safeW = activeCapture.safeW * barW;

  blendMode(ADD);
  fill(245, 250, 255, 190);
  noStroke();
  rect(safeX + safeW / 2, barY, safeW, barH - 4, 6);
  blendMode(BLEND);

  let cursorX = barX - barW / 2 + activeCapture.cursorPos * barW;
  let pointerSize = barH + 8;

  noStroke();
  fill(40, 140, 255, 80);
  circle(cursorX, barY, pointerSize * 1.6);
  fill(100, 200, 255, 160);
  circle(cursorX, barY, pointerSize * 1.2);
  fill(220, 245, 255, 255);
  circle(cursorX, barY, pointerSize * 0.8);
}

// Evaluate whether the moving cursor is currently inside the white success zone.
function finishCaptureQTE() {
  let p = activeCapture.cursorPos;
  let success = p >= activeCapture.safeStart && p <= activeCapture.safeStart + activeCapture.safeW;

  if (success) {
    completeCapture();
  } else {
    failCapture();
  }
}

// Apply successful capture results for normal fireflies, red firefly, or silver note.
function completeCapture() {
  let kind = activeCapture.kind;
  let target = activeCapture.target;

  if (kind === "normal") {
    target.visible = false;
    target.caught = true;
    target.inQte = false;
    addDisappearEffect(target.x, target.y, target.side);
    addCapturedFirefly(target.side);
  }

  if (kind === "red") {
    catchRedFirefly();
  }

  if (kind === "note") {
    catchSilverNoteSuccess(target.x, target.y);
  }

  activeCapture = null;
  checkMissionComplete();
}

// Failed QTE returns a normal firefly to flight, but removes red firefly or silver note.
function failCapture() {
  let kind = activeCapture.kind;
  let target = activeCapture.target;

  if (kind === "normal") {
    target.inQte = false;
  }

  if (kind === "red") {
    makeRedFireflyDisappear();
  }

  if (kind === "note") {
    failSilverNoteQTE();
  }

  activeCapture = null;
}
// Shared end-screen wrapper keeps the forest background visible behind win/lose UI.
function drawEndScreen(result) {
  drawFullBackground();

  rectMode(CORNER);
  fill(0, 120);
  rect(0, 0, width, height);

  if (result === "win") {
    drawWinScreen();
  } else {
    drawLoseScreen();
  }
}

// Success screen: show the glass bottle and nebula effect in the center.
function drawWinScreen() {
  let glassW = constrain(width * 0.432, 288, 558);
  let glassRatio = glassImg ? glassImg.height / glassImg.width : 0.78;
  let glassH = glassW * glassRatio;

  let bottleCenterX = width / 2;
  let bottleCenterY = height * 0.38;
  let nebulaSize = glassW * 0.36;

  // Draw nebula behind the glass bottle.
  if (nebulaImg) {
    push();
    imageMode(CENTER);
    noTint();
    translate(bottleCenterX, bottleCenterY);
    rotate(frameCount * 0.004);
    image(nebulaImg, 0, 0, nebulaSize, nebulaSize);
    pop();
  }

  // Draw the glass bottle above the nebula.
  if (glassImg) {
    push();
    imageMode(CENTER);
    noTint();
    image(glassImg, bottleCenterX, bottleCenterY, glassW, glassH);
    pop();
  }

  drawEndTitle("You are now the Star Keeper!", height * 0.75);
  drawEndButton("Play Again", height * 0.85);
}

// Failure screen: quiet text over the dark forest.
function drawLoseScreen() {
  drawEndTitle("The stars slipped away", height * 0.48);
  drawEndButton("Try Again", height * 0.68);
}

// Draw the result message on win/lose screens.
function drawEndTitle(title, posY) {
  textAlign(CENTER, CENTER);
  textFont("Luminari, Georgia, serif");
  textStyle(BOLD);
  textSize(constrain(width * 0.034, 26, 52));
  fill(255, 224, 120);
  text(title, width / 2, posY);
}

// Draw the restart button on win/lose screens and update its bounds for hit testing.
function drawEndButton(label, posY) {
  endButtonBounds.w = constrain(width * 0.19, 220, 320);
  endButtonBounds.h = 60;
  endButtonBounds.x = width / 2;
  endButtonBounds.y = posY;

  let hover = isMouseInside(endButtonBounds);

  rectMode(CENTER);
  stroke(255, 220, 120, hover ? 230 : 160);
  strokeWeight(2);
  fill(28, 45, 66, hover ? 220 : 170);
  rect(endButtonBounds.x, endButtonBounds.y, endButtonBounds.w, endButtonBounds.h, 16);

  noStroke();
  textAlign(CENTER, CENTER);
  textFont("Roboto, Arial, sans-serif");
  textStyle(BOLD);
  textSize(20);
  fill(245, 250, 255);
  text(label, endButtonBounds.x, endButtonBounds.y);
}