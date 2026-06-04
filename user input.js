// User input: mouse net, QTE capture bar, keyboard space, and end screens.

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
}

function resetCaptureSystem() {
  if (activeCapture !== null && activeCapture.target !== null) {
    activeCapture.target.inQte = false;
  }

  activeCapture = null;
}

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
    startCaptureQTE(targetInfo.kind, targetInfo.target);
  }
}

function keyPressed() {
  if (gameState === "playing" && activeCapture !== null && key === " ") {
    finishCaptureQTE();
    return false;
  }
}