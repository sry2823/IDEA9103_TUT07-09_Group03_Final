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

