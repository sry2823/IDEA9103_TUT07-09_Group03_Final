// ============================================================================
// AI Acknowledgement:
// This file were developed with the assistance of Generative AI (ChatGPT).
// Specifically, the AI was used to help structur visual effects and advanced image processing techniques. 
// This includes using blendMode() for additive glowing effects, directly accessing raw image pixel arrays (loadPixels) to calculate precise non-transparent bounding boxes, and utilizing tint() for dynamic transparency animations.
// All generated logic has been reviewed by the author.
// ============================================================================

// Time-based events: global countdown, red firefly, frozen side, and disappearance effects.

// Main round countdown values.
let gameTime = 120;
let roundStartTime = 0;
let roundTimeLeft = 120;
let lastTimeTick = 0;

// Red firefly state. Only one red firefly can exist at a time.
let redFirefly = null;
let redTimer = 0;
let redLifeTimer = 0;
let redInterval = 15000;
let redLifeDuration = 20000;

// Frozen-side event state. The frozen image covers exactly one half of the game area.
let freezeSide = null;
let lastFreezeSide = null;
let freezeTimer = 0;
let freezeLifeTimer = 0;
let freezeInterval = 12000;
let freezeDuration = 5000;
let frozenImg = null;
let frozenVisibleBounds = null;
let starImg = null;

// Random disappearance event state and star-image burst effects.
let disappearTimer = 0;
let disappearInterval = 10000;
let disappearedFireflies = [];

// Load time-event image assets once before the game starts.
function preloadTimeAssets() {
  frozenImg = loadImage(
    "assets/frozen.png",
    function (img) {
      frozenImg = img;
      frozenVisibleBounds = null;
    },
    function () {
      frozenImg = null;
      frozenVisibleBounds = null;
    }
  );

  starImg = loadImage(
    "assets/star.png",
    function (img) {
      starImg = img;
    },
    function () {
      starImg = null;
    }
  );
}

// Reset all time-based events at the beginning of each round.
function startTimeSystem() {
  gameTime = 120;
  roundStartTime = millis();
  lastTimeTick = millis();
  roundTimeLeft = gameTime;

  redFirefly = null;
  redTimer = 0;
  redLifeTimer = 0;

  freezeSide = null;
  lastFreezeSide = null;
  freezeTimer = 0;
  freezeLifeTimer = 0;

  disappearTimer = 0;
  disappearedFireflies = [];
}

// Update the countdown and all time-triggered events.
function timeSystem() {
  if (gameState !== "playing") {
    return;
  }

  let now = millis();
  let dt = now - lastTimeTick;
  lastTimeTick = now;

  roundTimeLeft = max(0, gameTime - floor((now - roundStartTime) / 1000));

  if (roundTimeLeft <= 0) {
    if (leftCaptured >= leftTarget && rightCaptured >= rightTarget) {
      setGameResult("win");
    } else {
      setGameResult("lose");
    }
    return;
  }

  updateRedFireflyLife(dt);

  if (!areTimedEventsPaused()) {
    updateDisappearTimer(dt);
    updateRedTimer(dt);
    updateFreezeTimer(dt);
  }

  updateFreezeLife(dt);
}

// QTE and ECG temporarily pause special-event schedulers, but the main countdown keeps running.
function areTimedEventsPaused() {
  return activeCapture !== null || ecgEventActive;
}

// Spawn a red firefly every 15 seconds when allowed.
function updateRedTimer(dt) {
  if (redFirefly !== null || freezeSide !== null) {
    return;
  }

  redTimer += dt;

  if (redTimer >= redInterval) {
    createRedFirefly();
    redTimer = 0;
  }
}

// Create a red firefly at a clear position so it does not overlap normal fireflies or the note.
function createRedFirefly() {
  let bounds = {
    minX: 35,
    maxX: width - 35,
    minY: topUIHeight + 35,
    maxY: height - 35
  };
  let position = getClearRandomPosition(bounds, 105, 90);

  redFirefly = {
    side: position.x < width / 2 ? "left" : "right",
    type: "red",
    visible: true,
    caught: false,
    x: position.x,
    y: position.y,
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: bounds.minY,
    maxY: bounds.maxY,
    coreSize: 10,
    maxGlow: 118,
    breatheSpeed: 0.045,
    breatheOffset: random(1),
    noiseSeedX: random(1000),
    noiseSeedY: random(1000),
    noiseSpeed: random(0.014, 0.022),
    vx: random(-3.5, 3.5),
    vy: random(-3.5, 3.5)
  };

  redLifeTimer = 0;
}

// Red firefly lasts 20 seconds unless caught; QTE pauses only the red firefly's life timer.
function updateRedFireflyLife(dt) {
  if (redFirefly === null) {
    return;
  }

  if (activeCapture !== null) {
    return;
  }

  redLifeTimer += dt;

  if (redLifeTimer >= redLifeDuration) {
    makeRedFireflyDisappear();
  }
}

// Draw the red firefly with a separate flash style so it reads differently from normal fireflies.
function drawRedFirefly() {
  if (redFirefly === null || gameState !== "playing") {
    return;
  }

  if (activeCapture === null || activeCapture.kind !== "red") {
    moveRedFirefly();
  }

  // [Out of the course] blendMode(ADD) / blendMode(BLEND): Changes how the canvas renders overlapping graphics. 'ADD' mode adds the pixel color values together, creating a bright, luminous glowing effect for the red firefly. Suggested by AI and sourced from the p5.js official reference.
  blendMode(ADD);
  drawRedFlashFirefly(redFirefly.x, redFirefly.y);
  blendMode(BLEND);
}

// High-frequency red flash effect for urgent visibility.
function drawRedFlashFirefly(x, y) {
  let flash = 0.5 + 0.5 * sin(frameCount * 0.95);
  let snap = 0.5 + 0.5 * sin(frameCount * 1.9);
  noStroke();
  fill(255, 0, 0, 55 + flash * 115);
  circle(x, y, 44 + flash * 24);
  fill(255, 35, 0, 95 + snap * 120);
  circle(x, y, 22 + snap * 12);
  fill(255, 0, 0, 240);
  circle(x, y, 13);
  fill(255, 245, 220, 230);
  circle(x, y, 5 + flash * 3);
}

// Move the red firefly faster than normal fireflies, while still respecting voice slow effects.
function moveRedFirefly() {
  let time = frameCount * redFirefly.noiseSpeed;
  let nx = noise(redFirefly.noiseSeedX, time);
  let ny = noise(redFirefly.noiseSeedY, time);
  let slowScale = getSideSlowSpeedScale(redFirefly.side);
  let targetVX = map(nx, 0, 1, -4.8, 4.8) * slowScale;
  let targetVY = map(ny, 0, 1, -4.8, 4.8) * slowScale;

  redFirefly.vx = lerp(redFirefly.vx, targetVX, 0.05);
  redFirefly.vy = lerp(redFirefly.vy, targetVY, 0.05);
  redFirefly.x += redFirefly.vx;
  redFirefly.y += redFirefly.vy;
  pushAwayFromOtherObjects(redFirefly, 90, 2.2);

  if (redFirefly.x < redFirefly.minX || redFirefly.x > redFirefly.maxX) {
    redFirefly.vx *= -1;
    redFirefly.noiseSeedX += random(20, 80);
  }

  if (redFirefly.y < redFirefly.minY || redFirefly.y > redFirefly.maxY) {
    redFirefly.vy *= -1;
    redFirefly.noiseSeedY += random(20, 80);
  }

  redFirefly.x = constrain(redFirefly.x, redFirefly.minX, redFirefly.maxX);
  redFirefly.y = constrain(redFirefly.y, redFirefly.minY, redFirefly.maxY);
  redFirefly.side = redFirefly.x < width / 2 ? "left" : "right";
}

// Catching the red firefly rewards extra time.
function catchRedFirefly() {
  if (redFirefly !== null) {
    gameTime += 5;
    makeRedFireflyDisappear();
  }
}

// Remove the red firefly and restart its spawn timer from this moment.
function makeRedFireflyDisappear() {
  if (redFirefly !== null) {
    addDisappearEffect(redFirefly.x, redFirefly.y, "red");
  }

  redFirefly = null;
  redLifeTimer = 0;
  redTimer = 0;
}

// Start a frozen-side event on its own timer when no conflicting red firefly exists.
function updateFreezeTimer(dt) {
  if (freezeSide !== null || redFirefly !== null) {
    return;
  }

  freezeTimer += dt;

  if (freezeTimer >= freezeInterval) {
    // The first frozen side is random; every later frozen event alternates sides.
    if (lastFreezeSide === null) {
      freezeSide = random(["left", "right"]);
    } else if (lastFreezeSide === "left") {
      freezeSide = "right";
    } else {
      freezeSide = "left";
    }

    lastFreezeSide = freezeSide;
    freezeLifeTimer = 0;
    freezeTimer = 0;
  }
}

// Keep the frozen image on screen for five seconds.
function updateFreezeLife(dt) {
  if (freezeSide === null) {
    return;
  }

  if (activeCapture !== null || ecgEventActive) {
    return;
  }

  freezeLifeTimer += dt;

  if (freezeLifeTimer >= freezeDuration) {
    freezeSide = null;
    freezeLifeTimer = 0;
  }
}

// Find the visible alpha area inside frozen.png so transparent padding cannot affect sizing.
function getFrozenVisibleBounds() {
  if (frozenImg === null) {
    return null;
  }

  if (frozenVisibleBounds !== null) {
    return frozenVisibleBounds;
  }

  // [Out of the course] loadPixels() and pixels[] array: Directly accesses the raw RGBA data of an image in memory. Used here to mathematically scan the image and find the exact coordinates of visible (non-transparent) pixels. Suggested by AI to fix inaccurate bounding boxes caused by transparent padding in the PNG file.
  frozenImg.loadPixels();

  let minX = frozenImg.width;
  let minY = frozenImg.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < frozenImg.height; y++) {
    for (let x = 0; x < frozenImg.width; x++) {
      let alphaIndex = (y * frozenImg.width + x) * 4 + 3;
      let alphaValue = frozenImg.pixels[alphaIndex];

      if (alphaValue > 10) {
        minX = min(minX, x);
        minY = min(minY, y);
        maxX = max(maxX, x);
        maxY = max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    frozenVisibleBounds = {
      x: 0,
      y: 0,
      w: frozenImg.width,
      h: frozenImg.height
    };
  } else {
    frozenVisibleBounds = {
      x: minX,
      y: minY,
      w: maxX - minX + 1,
      h: maxY - minY + 1
    };
  }

  return frozenVisibleBounds;
}

// Draw frozen.png by stretching its visible area to exactly one half of the viewport.
function drawFrozenSide() {
  if (freezeSide === null || gameState !== "playing") {
    return;
  }

  let halfW = width / 2;
  let drawX = freezeSide === "left" ? 0 : halfW;
  let drawY = 0;
  let drawW = halfW;
  let drawH = height;

  if (frozenImg) {
    let bounds = getFrozenVisibleBounds();

// [Out of the course] tint() and imageMode(): tint() applies a color or opacity filter (alpha channel) to the image being drawn, creating a semi-transparent frozen overlay. imageMode(CORNER) sets the anchor point for positioning. Suggested by AI for visual styling.
    push();
    imageMode(CORNER);
    tint(255, 102);
    image(
      frozenImg,
      drawX,
      drawY,
      drawW,
      drawH,
      bounds.x,
      bounds.y,
      bounds.w,
      bounds.h
    );
    noTint();
    pop();
  }
}

// Check whether a screen point lies inside the currently frozen half.
function isPointInFrozenSide(px, py) {
  if (freezeSide === null) {
    return false;
  }

  if (freezeSide === "left") {
    return px < width / 2;
  }

  return px >= width / 2;
}

// Fireflies on the frozen side stop moving and cannot be clicked.
function isFireflyFrozen(firefly) {
  if (freezeSide === "left" && firefly.side === "left") {
    return true;
  }

  if (freezeSide === "right" && firefly.side === "right") {
    return true;
  }

  return false;
}

// Trigger the random disappearance event on its own timer when possible.
function updateDisappearTimer(dt) {
  disappearTimer += dt;

  if (disappearTimer >= disappearInterval) {
    randomlyDisappearOneFirefly();
    disappearTimer = 0;
  }
}

// Remove one eligible normal firefly without making the mission impossible.
function randomlyDisappearOneFirefly() {
  let choices = [];

  for (let f of gameFireflies) {
    if (f.visible === true && f.caught === false && canAutoRemoveSide(f.side)) {
      choices.push(f);
    }
  }

  if (choices.length === 0) {
    return;
  }

  let selected = random(choices);
  selected.visible = false;
  addDisappearEffect(selected.x, selected.y, selected.side);
}

// Prevent disappearance from removing too many fireflies from a side that still needs them.
function canAutoRemoveSide(side) {
  let visibleCount = 0;
  let neededCount = side === "left" ? leftTarget - leftCaptured : rightTarget - rightCaptured;

  for (let f of gameFireflies) {
    if (f.side === side && f.visible === true && f.caught === false) {
      visibleCount++;
    }
  }

  return visibleCount > neededCount;
}

// Store a disappearing-star effect at the removed firefly's position.
function addDisappearEffect(x, y, side) {
  disappearedFireflies.push({
    x: x,
    y: y,
    side: side,
    startTime: millis()
  });
}

// Draw a large star.png image that flickers rapidly before disappearing.
function drawDisappearEffects() {
  for (let i = disappearedFireflies.length - 1; i >= 0; i--) {
    let effect = disappearedFireflies[i];
    let age = millis() - effect.startTime;
    let flashDuration = 70;
    let flashGap = 35;
    let flashCount = 6;
    let totalDuration = flashDuration * flashCount + flashGap * (flashCount - 1);

    if (age > totalDuration) {
      disappearedFireflies.splice(i, 1);
      continue;
    }

    if (starImg) {
      let cycle = flashDuration + flashGap;
      let flashIndex = floor(age / cycle);
      let localAge = age - flashIndex * cycle;

      if (flashIndex < flashCount && localAge < flashDuration) {
        let pulse = sin(map(localAge, 0, flashDuration, 0, PI));
        let alpha = map(pulse, 0, 1, 90, 255);
        let baseSize = 92 + pulse * 62;

// [Out of the course] tint() and imageMode(): Used here to dynamically adjust the transparency of the star image based on a calculated mathematical pulse (sine wave), creating a smooth fading animation. Suggested by AI and sourced from p5.js documentation.
        tint(255, alpha);
        imageMode(CENTER);
        image(starImg, effect.x, effect.y, baseSize, baseSize);
        imageMode(CORNER);
        noTint();
      }
    }
  }
}

// Clear all round-only time effects when leaving the game scene.
function clearRoundTimeEvents() {
  redFirefly = null;
  freezeSide = null;
  disappearedFireflies = [];
}
