let gameTime = 120;
let roundStartTime = 0;
let roundTimeLeft = 120;
let lastTimeTick = 0;

let redFirefly = null;
let redTimer = 0;
let redLifeTimer = 0;
let redInterval = 15000;
let redLifeDuration = 20000;

let freezeSide = null;
let freezeTimer = 0;
let freezeLifeTimer = 0;
let freezeInterval = 30000;
let freezeDuration = 5000;
let frozenImg = null;

let disappearTimer = 0;
let disappearInterval = 15000;
let disappearedFireflies = [];

function preloadTimeAssets() {
  frozenImg = loadImage(
    "frozen.png",
    function (img) {
      frozenImg = img;
    },
    function () {
      frozenImg = null;
    }
  );
}


function startTimeSystem() {
  gameTime = 120;
  roundStartTime = millis();
  lastTimeTick = millis();
  roundTimeLeft = gameTime;

  redFirefly = null;
  redTimer = 0;
  redLifeTimer = 0;

  freezeSide = null;
  freezeTimer = 0;
  freezeLifeTimer = 0;

  disappearTimer = 0;
  disappearedFireflies = [];
}

function timeSystem() {
   if (gameState !== "playing") {
    return;
  }

  let now = millis();
  let dt = now - lastTimeTick;
  lastTimeTick = now;

 let elapsedSeconds = floor((now - roundStartTime) / 1000);
  roundTimeLeft = max(0, gameTime - elapsedSeconds);

  if (roundTimeLeft <= 0) {
    if (leftCaptured >= leftTarget && rightCaptured >= rightTarget) {
      setGameResult("win");
    } else {
      setGameResult("lose");
    }
    return;
  }

  if (!areTimedEventsPaused()) {
    updateRedFireflyLife(dt);
    updateDisappearTimer(dt);
    updateRedTimer(dt);
    updateFreezeTimer(dt);
    updateFreezeLife(dt);
  }
}

function areTimedEventsPaused() {
  return activeCapture !== null || silverNote !== null || ecgEventActive;
}

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

function createRedFirefly() {
  let bounds = {
    minX: 35,
    maxX: width - 35,
    minY: topUIHeight + 35,
    maxY: height - 35
  };

  redFirefly = {
    side: random(["left", "right"]),
    type: "red",
    visible: true,
    caught: false,
    x: random(bounds.minX, bounds.maxX),
    y: random(bounds.minY, bounds.maxY),
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: bounds.minY,
    maxY: bounds.maxY,
    coreSize: 8,
    maxGlow: 78,
    breatheSpeed: 0.007,
    breatheOffset: random(1),
    noiseSeedX: random(1000),
    noiseSeedY: random(1000),
    noiseSpeed: random(0.007, 0.012),
    vx: random(-2, 2),
    vy: random(-2, 2)
  };

  redLifeTimer = 0;
}

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

function drawRedFirefly() {
  if (redFirefly === null || gameState !== "playing") {
    return;
  }

  if (activeCapture === null || activeCapture.kind !== "red") {
    moveRedFirefly();
  }

  blendMode(ADD);
  drawBreathingLight(
    redFirefly.x,
    redFirefly.y,
    redFirefly.coreSize,
    redFirefly.maxGlow,
    redFirefly.breatheSpeed,
    redFirefly.breatheOffset,
    color(255, 25, 25),
    color(255, 80, 60),
    color(255, 230, 210),
    1
  );
  blendMode(BLEND);
}

function moveRedFirefly() {
  let time = frameCount * redFirefly.noiseSpeed;
  let nx = noise(redFirefly.noiseSeedX, time);
  let ny = noise(redFirefly.noiseSeedY, time);
  let slowScale = getSideSlowSpeedScale(redFirefly.side);
  let targetVX = map(nx, 0, 1, -2.8, 2.8) * slowScale;
  let targetVY = map(ny, 0, 1, -2.8, 2.8) * slowScale;

  redFirefly.vx = lerp(redFirefly.vx, targetVX, 0.05);
  redFirefly.vy = lerp(redFirefly.vy, targetVY, 0.05);
  redFirefly.x += redFirefly.vx;
  redFirefly.y += redFirefly.vy;

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

function catchRedFirefly() {
  if (redFirefly !== null) {
    gameTime += 5;
    makeRedFireflyDisappear();
  }
}

function makeRedFireflyDisappear() {
  if (redFirefly !== null) {
    addDisappearEffect(redFirefly.x, redFirefly.y, "red");
  }

  redFirefly = null;
  redLifeTimer = 0;
  redTimer = 0;
}

function updateFreezeTimer(dt) {
  if (freezeSide !== null || redFirefly !== null) {
    return;
  }

  freezeTimer += dt;

  if (freezeTimer >= freezeInterval) {
    freezeSide = random(["left", "right"]);
    freezeLifeTimer = 0;
    freezeTimer = 0;
  }
}

function updateFreezeLife(dt) {
  if (freezeSide === null) {
    return;
  }

  if (activeCapture !== null || ecgEventActive || silverNote !== null) {
    return;
  }

  freezeLifeTimer += dt;

  if (freezeLifeTimer >= freezeDuration) {
    freezeSide = null;
    freezeLifeTimer = 0;
  }
}


function randomlyDisappearOneFirefly() {
  let visibleFireflies = [];

  for (let f of gameFireflies) {
    if (f.visible !== false && f.caught !== true && f.type !== "gold") {
      visibleFireflies.push(f);
    }
  }

  if (visibleFireflies.length > 0) {
    let randomFirefly = random(visibleFireflies);

    randomFirefly.visible = false;

    disappearedFireflies.push({
      x: randomFirefly.x,
      y: randomFirefly.y,
      startTime: millis(),
      side: randomFirefly.side
    });
  }
}

function updateFreezeLife(dt) {
  if (freezeSide === null) {
    return;
  }

  if (activeCapture !== null || ecgEventActive || silverNote !== null) {
    return;
  }

  freezeLifeTimer += dt;

  if (freezeLifeTimer >= freezeDuration) {
    freezeSide = null;
    freezeLifeTimer = 0;
  }
}

function updateFreezeLife(dt) {
  if (freezeSide === null) {
    return;
  }

  if (activeCapture !== null || ecgEventActive || silverNote !== null) {
    return;
  }

  freezeLifeTimer += dt;

  if (freezeLifeTimer >= freezeDuration) {
    freezeSide = null;
    freezeLifeTimer = 0;
  }
}

function drawFrozenSide() {
  if (freezeSide === null || gameState !== "playing") {
    return;
  }

  let x = freezeSide === "left" ? 0 : width / 2;
  let w = width / 2;
  rectMode(CORNER);

  if (frozenImg) {
    tint(255, 135);
    image(frozenImg, x, 0, w, height);
    noTint();
  }

  noStroke();
  fill(175, 225, 255, 70);
  rect(x, 0, w, height);
  fill(235, 250, 255, 35);
  rect(x + 15, 15, w - 30, height - 30);

  stroke(230, 250, 255, 100);
  strokeWeight(2);
  for (let i = 0; i < 12; i++) {
    let lineX = x + random(w);
    line(lineX, 0, lineX + random(-70, 70), height);
  }
  noStroke();
}

function isPointInFrozenSide(px, py) {
  if (freezeSide === null) {
    return false;
  }

  if (freezeSide === "left") {
    return px < width / 2;
  }

  return px >= width / 2;
}

function isFireflyFrozen(firefly) {
  if (freezeSide === "left" && firefly.side === "left") {
    return true;
  }

  if (freezeSide === "right" && firefly.side === "right") {
    return true;
  }

  return false;
}

function updateDisappearTimer(dt) {
  disappearTimer += dt;

  if (disappearTimer >= disappearInterval) {
    randomlyDisappearOneFirefly();
    disappearTimer = 0;
  }
}

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

function addDisappearEffect(x, y, side) {
  disappearedFireflies.push({
    x: x,
    y: y,
    side: side,
    startTime: millis()
  });
}

function drawDisappearEffects() {
  for (let i = disappearedFireflies.length - 1; i >= 0; i--) {
    let effect = disappearedFireflies[i];
    let age = millis() - effect.startTime;

    if (age > 950) {
      disappearedFireflies.splice(i, 1);
      continue;
    }

    let alpha = map(age, 0, 950, 230, 0);
    let baseSize = map(age, 0, 950, 12, 82);

    blendMode(ADD);
    drawCrossStar(effect.x - baseSize * 0.28, effect.y, baseSize * 0.55, alpha);
    drawCrossStar(effect.x + baseSize * 0.24, effect.y - baseSize * 0.18, baseSize * 0.35, alpha);
    drawCrossStar(effect.x + baseSize * 0.1, effect.y + baseSize * 0.25, baseSize * 0.45, alpha);
    blendMode(BLEND);
  }
}

function drawCrossStar(x, y, s, alpha) {
  stroke(255, 255, 245, alpha);
  strokeWeight(2);
  line(x - s, y, x + s, y);
  line(x, y - s, x, y + s);
  noStroke();
  fill(255, 255, 245, alpha * 0.65);
  circle(x, y, s * 0.7);
}

function clearRoundTimeEvents() {
  redFirefly = null;
  freezeSide = null;
  disappearedFireflies = [];
}