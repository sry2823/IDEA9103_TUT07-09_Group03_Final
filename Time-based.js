let gameTime = 100;
let startTime;

let goldenFirefly = null;

let lastDisappearTime = 0;
let lastGoldenTime = 0;
let lastDarkTime = 0;

let darkSide = null;
let darkStartTime = 0;
let darkDuration = 5000;

let disappearedFireflies = []

function startTimeSystem() {
  startTime = millis();
  lastDisappearTime = millis();
  lastGoldenTime = millis();
  lastDarkTime = millis();
}

function timeSystem() {
  let currentTime = millis();
  let timeLeft = gameTime - floor((currentTime - startTime) / 1000);

  if (timeLeft <= 0) {
    gameState = "lose";
  }

  if (currentTime - lastDisappearTime > 8000) {
    randomlyDisappearFireflies();
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

  drawTimeUI(timeLeft);
  drawDarkSide();
}

function randomlyDisappearFireflies() {
  let disappearNum = floor(random(1, 4));

  for (let i = 0; i < disappearNum; i++) {
    let randomFirefly = random(gameFireflies);

    if (
      randomFirefly &&
      !randomFirefly.caught &&
      randomFirefly.type !== "gold" &&
      randomFirefly.visible !== false
    ) {
      randomFirefly.visible = false;
    }
  }
}

function createGoldenFirefly() {
  if (goldenFirefly === null) {
    goldenFirefly = new Firefly("gold");
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

function canCatchFirefly(firefly) {
  if (darkSide === "cool" && firefly.type === "cool") {
    return false;
  }

  if (darkSide === "warm" && firefly.type === "warm") {
    return false;
  }

  return true;
}

function drawDarkSide() {
  if (darkSide === "cool") {
    noStroke();
    fill(0, 180);
    rect(width / 2, 0, width / 2, height);
  }

  if (darkSide === "warm") {
    noStroke();
    fill(0, 180);
    rect(0, 0, width / 2, height);
  }
}

function drawTimeUI(timeLeft) {
  fill(255);
  textSize(16);
  textAlign(LEFT);
  text("Time: " + max(0, timeLeft), 20, 30);

  if (darkSide !== null) {
    text("Dark Side: " + darkSide, 20, 55);
  }
}