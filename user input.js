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
