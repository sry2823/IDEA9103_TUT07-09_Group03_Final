let bgSongs = [];
let bgSong;
let bgFft;
let mic;
let micFft;

let baseSpeed = 10;
let musicSpeed = 10;
let lastMusicReadTime = 0;

let oohSlowAmount = 0;
let eeeSlowAmount = 0;
let soundSlowStep = 0.04;
let maxSoundSlow = 6;

function preload() {
  bgSongs[0] = loadSound("assets/assets-midnight-forest.mp3");
  bgSongs[1] = loadSound("assets/assets-magic-forest.mp3");
  bgSongs[2] = loadSound("assets/assets-mysterious-forest-lofi.mp3");
}

function mousePressed() {
  if (gameStarted == false) {
    userStartAudio();
    setupAudioLayers();
    gameStarted = true;
  }
}

function setupAudioLayers() {
  bgSong = random(bgSongs);
  bgSong.loop();

  bgFft = new p5.FFT(0.8, 128);
  bgSong.connect(bgFft);

  mic = new p5.AudioIn();
  mic.start();

  micFft = new p5.FFT(0.8, 128);
  mic.connect(micFft);
}

function updateAudioLayers() {
  updateMusicSpeed();
  updateVoiceSlow();
}

function updateMusicSpeed() {
  if (millis() - lastMusicReadTime > 5000) {
    bgFft.analyze();

    let centroid = bgFft.getCentroid();
    let soundY = map(centroid, 20, 8000, 0, 20);

    musicSpeed = baseSpeed + (soundY - 10);
    musicSpeed = constrain(musicSpeed, 0, 20);

    lastMusicReadTime = millis();
  }
}

function updateVoiceSlow() {
  micFft.analyze();

  let oohEnergy = micFft.getEnergy(180, 700);
  let eeeEnergy = micFft.getEnergy(1800, 3600);

  if (oohEnergy > 35 && oohEnergy > eeeEnergy * 1.2) {
    oohSlowAmount = min(oohSlowAmount + soundSlowStep, maxSoundSlow);
  } else {
    oohSlowAmount = max(oohSlowAmount - soundSlowStep, 0);
  }

  if (eeeEnergy > 35 && eeeEnergy > oohEnergy * 1.2) {
    eeeSlowAmount = min(eeeSlowAmount + soundSlowStep, maxSoundSlow);
  } else {
    eeeSlowAmount = max(eeeSlowAmount - soundSlowStep, 0);
  }
}

function getFireflySpeed(firefly) {
  let speed = musicSpeed;

  if (firefly.side == "left") {
    speed = speed - eeeSlowAmount;
  }

  if (firefly.side == "right") {
    speed = speed - oohSlowAmount;
  }

  return max(speed, 1);
}