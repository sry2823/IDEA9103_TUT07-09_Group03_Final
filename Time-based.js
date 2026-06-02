let gameTime = 100;
let startTime;

let goldenFirefly = null;

let lastDisappearTime = 0;
let lastGoldenTime = 0;
let lastDarkTime = 0;

let darkSide = null;
let darkStartTime = 0;
let darkDuration = 5000;

let disappearedFireflies = [];

function startTimeSystem() {
  startTime = millis();
  lastDisappearTime = millis();
  lastGoldenTime = millis();
  lastDarkTime = millis();

  goldenFirefly = null;
  darkSide = null;
  disappearedFireflies = [];
}

function timeSystem() {
  let currentTime = millis();
  let timeLeft = gameTime - floor((currentTime - startTime) / 1000);

  if (timeLeft <= 0) {
    gameState = "lose";
  }

  if (currentTime - lastDisappearTime > 15000) {
    randomlyDisappearOneFirefly();
    lastDisappearTime = currentTime;
  }

  if (currentTime - lastGoldenTime > 10000) {
    createGoldenFirefly();
    lastGoldenTime = currentTime;
  }

  if (currentTime - lastDarkTime > 30000) {
    activateDarkSide();
    lastDarkTime = currentTime;
  }

  if (darkSide !== null && currentTime - darkStartTime > darkDuration) {
    darkSide = null;
  }

  drawGoldenFirefly();
  drawDisappearEffects();
  drawTimeUI(timeLeft);
  drawDarkSide();
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

function createGoldenFirefly() {
  if (goldenFirefly === null) {
    let side = random(["left", "right"]);
    let minX;
    let maxX;

    if (side === "left") {
      minX = 35;
      maxX = width / 2 - 35;
    } else {
      minX = width / 2 + 35;
      maxX = width - 35;
    }

     goldenFirefly = {
      side: side,
      type: "gold",
      visible: true,
      caught: false,
      x: random(minX, maxX),
      y: random(topUIHeight + 35, height - 35),
      coreSize: 8,
      maxGlow: 75,
      breatheSpeed: 0.006,
      breatheOffset: random(1)
    };
  }
}

function drawGoldenFirefly() {
  if (goldenFirefly !== null && goldenFirefly.visible !== false) {
    blendMode(ADD);

    drawGameBreathingFirefly(
      goldenFirefly.x,
      goldenFirefly.y,
      goldenFirefly.coreSize,
      goldenFirefly.maxGlow,
      goldenFirefly.breatheSpeed,
      goldenFirefly.breatheOffset,
      color(255, 180, 20),
      color(255, 230, 80),
      color(255, 255, 210)
    );

    blendMode(BLEND);
  }
}

function catchGoldenFirefly() {
  if (goldenFirefly !== null) {
    gameTime += 5;
    goldenFirefly = null;
  }
}

function activateDarkSide() {
  if (random(1) < 0.5) {
    darkSide = "cool";
  } else {
    darkSide = "warm";
  }

  darkStartTime = millis();
}

function isFireflyFrozen(firefly) {
  if (darkSide === "cool" && firefly.type === "cool") {
    return true;
  }

  if (darkSide === "warm" && firefly.type === "warm") {
    return true;
  }

  return false;
}

function canCatchFirefly(firefly) {
  if (isFireflyFrozen(firefly)) {
    return false;
  }

  return true;
}

function drawDarkSide() {
  if (darkSide === "cool") {
     drawIceBlock(width / 2, 0, width / 2, height);
  }

  if (darkSide === "warm") {
   drawIceBlock(0, 0, width / 2, height);
  }
}

function drawIceBlock(x, y, w, h) {
  noStroke();

  fill(150, 220, 255, 85);
  rect(x, y, w, h);

  fill(230, 250, 255, 45);
  rect(x + 15, y + 15, w - 30, h - 30);

  stroke(230, 250, 255, 110);
  strokeWeight(2);

  for (let i = 0; i < 12; i++) {
    let lineX = x + random(w);
    line(lineX, y, lineX + random(-80, 80), y + h);
  }

  for (let i = 0; i < 8; i++) {
    let lineY = y + random(h);
    line(x, lineY, x + w, lineY + random(-50, 50));
  }

  noStroke();
}

function drawDisappearEffects() {
  for (let i = disappearedFireflies.length - 1; i >= 0; i--) {
    let effect = disappearedFireflies[i];
    let age = millis() - effect.startTime;

    if (age > 900) {
      disappearedFireflies.splice(i, 1);
    } else {
      let size = map(age, 0, 900, 10, 90);
      let alpha = map(age, 0, 900, 220, 0);

      noStroke();

      if (effect.side === "left") {
        fill(255, 160, 30, alpha);
      } else {
        fill(80, 190, 255, alpha);
      }

      circle(effect.x, effect.y, size);

      fill(255, 255, 210, alpha);
      circle(effect.x, effect.y, size * 0.35);
    }
  }
}


function drawTimeUI(timeLeft) {
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text("Time: " + max(0, timeLeft), 20, 30);

  if (darkSide !== null) {
    text("Frozen Side: " + darkSide, 20, 55);
  }
  if (goldenFirefly !== null) {
    text("Golden firefly is here", 20, 80);
  }
}