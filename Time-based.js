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

// Frozen-side event state.
let freezeSide = null;
let lastFreezeSide = null; 
let freezeTimer = 0;
let freezeLifeTimer = 0;
let freezeInterval = 20000;
let freezeDuration = 10000;
let freezeCount = 0;
let maxFreezeThisRound = 0;
let frozenImg = null;
let starImg = null;

// Random disappearance event state and star-image burst effects.
let disappearTimer = 0;
let disappearInterval = 10000;
let disappearedFireflies = [];

// Cooldown timer to prevent red firefly, freeze, or note events immediately after ECG finishes.
let postEcgCooldown = 0;

// Load time-event image assets once before the game starts.
function preloadTimeAssets() {
  frozenImg = loadImage(
    "assets/frozen.png",
    function (img) {
      frozenImg = img;
    },
    function () {
      frozenImg = null;
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
  freezeCount = 0;
  maxFreezeThisRound = floor(random(1, 4)); // Will be 1, 2, or 3
  freezeInterval = random(15000, 25000); // Random initial wait time

  disappearTimer = 0;
  disappearedFireflies = [];
  
  postEcgCooldown = 0;
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

  // Lock the cooldown at 6 seconds while the ECG event is running.
  // Once the ECG event stops, count down to 0 before allowing new events.
  if (ecgEventActive) {
    postEcgCooldown = 6000;
  } else if (postEcgCooldown > 0) {
    postEcgCooldown -= dt;
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
  // Pause the timer if ANY other special event is active, or if we are in the 6s ECG cooldown.
  if (redFirefly !== null || freezeSide !== null || silverNote !== null || postEcgCooldown > 0) {
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

// Start a frozen-side event on its own timer when no conflicting event exists.
function updateFreezeTimer(dt) {
  // Pause the timer if ANY other special event is active, or if we are in the 6s ECG cooldown.
  if (freezeSide !== null || redFirefly !== null || silverNote !== null || postEcgCooldown > 0) {
    return;
  }

  // Stop spawning if we have reached the maximum allowed freezes for this round.
  if (freezeCount >= maxFreezeThisRound) {
    return;
  }

  freezeTimer += dt;

  if (freezeTimer >= freezeInterval) {
    // Alternate sides: if left was frozen last, freeze right, and vice versa.
    if (lastFreezeSide === "left") {
      freezeSide = "right";
    } else if (lastFreezeSide === "right") {
      freezeSide = "left";
    } else {
      freezeSide = random() < 0.5 ? "left" : "right";
    }

    lastFreezeSide = freezeSide;
    freezeCount++;
    freezeLifeTimer = 0;
    freezeTimer = 0;
    freezeInterval = random(25000, 35000); // Wait time for the next potential freeze
  }
}

// Keep the frozen image on screen for the specified duration.
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

// Draw the frozen.png asset perfectly stretched over exactly half the screen.
function drawFrozenSide() {
  if (freezeSide === null || gameState !== "playing") {
    return;
  }

  let stretchW = width / 2;
  let stretchH = height;
  let startX = freezeSide === "left" ? 0 : stretchW;

  if (frozenImg) {
    push(); // Forcefully isolate rendering settings to prevent bleed-over
    tint(255, 102); 
    imageMode(CORNER); 
    // Draw the image exactly matching half width and full height of the canvas
    image(frozenImg, startX, 0, stretchW, stretchH); 
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
  lastFreezeSide = null;
  disappearedFireflies = [];
}