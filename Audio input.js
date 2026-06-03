// Audio system: forest music, voice slowing, silver note, and ECG event.

let bgSongs = [];
let bgSong = null;
let bgFft = null;
let mic = null;
let micFft = null;
let audioStarted = false;

let baseSpeed = 10;
let musicSpeed = 10;
let musicPartDuration = 25;
let musicPartStartTime = 0;
let lastMusicReadTime = 0;
let currentSongIndex = -1;
let targetBgVolume = 1;

let oohSlowAmount = 0;
let eeeSlowAmount = 0;
let soundSlowStep = 0.35;
let maxSoundSlow = 9;
let voiceCaptureThreshold = 1.2;
let musicalNoteImg = null;
let silverNote = null;
let silverNoteHasAppeared = false;
let silverNoteSpawnSecond = 30;

let beatSound = null;
let beatFft = null;
let beatEnergy = 0;
let ecgEventActive = false;
let ecgStartTime = 0;
let ecgDuration = 15000;

// Load all audio files and image assets used by the audio system.

function preloadAudioFiles() {
  bgSongs[0] = loadSound("assets/assets-midnight-forest.mp3");
  bgSongs[1] = loadSound("assets/assets-magic-forest.mp3");
  bgSongs[2] = loadSound("assets/assets-mysterious-forest-lofi.mp3");

  beatSound = loadSound(
    "assets/beat.mp3",
    function (sound) {
      beatSound = sound;
    },
    function () {
      beatSound = null;
    }
  );

  musicalNoteImg = loadImage(
    "assets/musical note.png",
    function (img) {
      musicalNoteImg = img;
    },
    function () {
      musicalNoteImg = null;
    }
  );
}

// Start microphone input and begin playing background music.

function startAudioSystem() {
  if (!audioStarted) {
    audioStarted = true;

    mic = new p5.AudioIn();
    mic.start();

    micFft = new p5.FFT(0.8, 128);
    micFft.setInput(mic);
  }

  if (bgSong === null) {
    startNextMusicPart();
  }
}

// Reset audio speed and voice effects for a new round.

function resetAudioRound() {
  musicSpeed = baseSpeed;
  oohSlowAmount = 0;
  eeeSlowAmount = 0;
  lastMusicReadTime = 0;
  musicPartStartTime = 0;

  if (audioStarted) {
    startNextMusicPart();
  }
}

// Stop all active audio and clear background music states.

function stopAudioSystem() {
  if (bgSong !== null) {
    bgSong.stop();
  }

  if (beatSound !== null) {
    beatSound.stop();
  }

  bgSong = null;
  bgFft = null;
  currentSongIndex = -1;
}

// Choose and play the next random background music segment.

function startNextMusicPart() {
  if (bgSongs.length === 0) {
    return;
  }

  let oldSong = bgSong;

  if (oldSong !== null) {
    oldSong.setVolume(0, 0.6);
    setTimeout(function () {
      oldSong.stop();
    }, 700);
  }

  let nextSongIndex = floor(random(bgSongs.length));

  if (nextSongIndex === currentSongIndex && bgSongs.length > 1) {
    nextSongIndex = (nextSongIndex + 1) % bgSongs.length;
  }

  currentSongIndex = nextSongIndex;
  bgSong = bgSongs[currentSongIndex];

  let maxStartTime = max(0, bgSong.duration() - musicPartDuration - 1);
  let randomStartTime = random(maxStartTime);

  bgSong.play(0, 1, 0, randomStartTime, musicPartDuration + 1);
  bgSong.setVolume(targetBgVolume, 0.8);

  bgFft = new p5.FFT(0.8, 128);
  bgFft.setInput(bgSong);

  musicPartStartTime = millis();
  lastMusicReadTime = millis() - 5000;
}

// Update music switching, music analysis, and voice-based slowing.

function updateAudioSystem() {
  if (!audioStarted || bgSong === null) {
    return;
  }

  if (millis() - musicPartStartTime > musicPartDuration * 1000) {
    startNextMusicPart();
  }

  updateMusicSpeed();
  updateVoiceSlow();
}

// Analyze background music energy to control firefly movement speed.

function updateMusicSpeed() {
  if (bgFft === null) {
    return;
  }

  if (millis() - lastMusicReadTime > 5000) {
    bgFft.analyze();

    let allEnergy = bgFft.getEnergy(20, 20000);
    let bassEnergy = bgFft.getEnergy(20, 250);
    let highEnergy = bgFft.getEnergy(2500, 9000);
    let contrast = abs(bassEnergy - highEnergy) * 0.35;
    let soundY = map(allEnergy + contrast, 0, 255, 3, 20);

    musicSpeed = constrain(soundY, 3, 20);
    lastMusicReadTime = millis();
  }
}

// Analyze microphone input to slow fireflies using voice sounds.

function updateVoiceSlow() {
  if (micFft === null) {
    return;
  }
  
  micFft.analyze();

  let oohEnergy = micFft.getEnergy(180, 700);
  let eeeEnergy = micFft.getEnergy(1800, 3600);

  if (oohEnergy > 35 && oohEnergy > eeeEnergy * 1.18) {
    oohSlowAmount = min(oohSlowAmount + soundSlowStep, maxSoundSlow);
  } else {
    oohSlowAmount = max(oohSlowAmount - soundSlowStep * 0.65, 0);
  }

  if (eeeEnergy > 35 && eeeEnergy > oohEnergy * 1.18) {
    eeeSlowAmount = min(eeeSlowAmount + soundSlowStep, maxSoundSlow);
  } else {
    eeeSlowAmount = max(eeeSlowAmount - soundSlowStep * 0.65, 0);
  }
}

// Calculate the current movement speed for a specific firefly.

function getFireflySpeed(firefly) {
  if (firefly.side === "left" && eeeSlowAmount > 0.5) {
    return constrain(2.2 + (maxSoundSlow - eeeSlowAmount) * 0.18, 1.2, 4.5);
  }

  if (firefly.side === "right" && oohSlowAmount > 0.5) {
    return constrain(2.2 + (maxSoundSlow - oohSlowAmount) * 0.18, 1.2, 4.5);
  }

  return constrain(musicSpeed, 3, 20);
}

// Convert firefly movement speed into a scale value.

function getFireflySpeedScale(firefly) {
  return getFireflySpeed(firefly) / baseSpeed;
}

// A capture can only begin after the player is actively using Ooh or Eee.
function isAnyVoiceControlActive() {
  return oohSlowAmount > voiceCaptureThreshold || eeeSlowAmount > voiceCaptureThreshold;
}

// Left fireflies require Eee; right fireflies require Ooh.
function isVoiceControlActiveForSide(side) {
  if (side === "left") {
    return eeeSlowAmount > voiceCaptureThreshold;
  }

  if (side === "right") {
    return oohSlowAmount > voiceCaptureThreshold;
  }

  return false;
}

function canStartCaptureAfterVoice(kind, target) {
  if (kind === "note") {
    return isAnyVoiceControlActive();
  }

  if (target !== null && target.side !== undefined) {
    return isVoiceControlActiveForSide(target.side);
  }

  return false;
}

// Reset the special silver note and ECG event for a new round.

function startSpecialNoteRound() {
  silverNote = null;
  silverNoteHasAppeared = false;
  silverNoteSpawnSecond = floor(random(20, 91));
  ecgEventActive = false;
  ecgStartTime = 0;
  beatEnergy = 0;
}

// Update silver note spawning, movement, and ECG event status.

function updateSpecialNoteSystem() {
  if (gameState !== "playing") {
    return;
  }

  updateEcgEvent();

  if (!silverNoteHasAppeared && silverNote === null) {
    let elapsed = floor((millis() - roundStartTime) / 1000);

    if (elapsed >= silverNoteSpawnSecond && roundTimeLeft > 10 && !hasSpecialNoteConflict()) {
      createSilverNote();
    }
  }

  if (silverNote !== null && activeCapture === null) {
    moveSilverNote();
  }
}

// Check whether another special event blocks the silver note.

function hasSpecialNoteConflict() {
  return redFirefly !== null || freezeSide !== null || activeCapture !== null || ecgEventActive;
}

// Create a silver note at a random playable position.

function createSilverNote() {
  silverNote = {
    x: random(55, width - 55),
    y: random(topUIHeight + 55, height - 55),
    size: 34,
    vx: random(-0.8, 0.8),
    vy: random(-0.8, 0.8),
    noiseSeedX: random(1000),
    noiseSeedY: random(1000),
    noiseSpeed: random(0.004, 0.008)
  };

  silverNoteHasAppeared = true;
}

// Move the silver note using smooth noise-based motion.

function moveSilverNote() {
  let time = frameCount * silverNote.noiseSpeed;
  let nx = noise(silverNote.noiseSeedX, time);
  let ny = noise(silverNote.noiseSeedY, time);
  let targetVX = map(nx, 0, 1, -1.2, 1.2);
  let targetVY = map(ny, 0, 1, -1.2, 1.2);

  silverNote.vx = lerp(silverNote.vx, targetVX, 0.04);
  silverNote.vy = lerp(silverNote.vy, targetVY, 0.04);
  silverNote.x += silverNote.vx;
  silverNote.y += silverNote.vy;

  if (silverNote.x < 45 || silverNote.x > width - 45) {
    silverNote.vx *= -1;
    silverNote.noiseSeedX += random(50);
  }

  if (silverNote.y < topUIHeight + 35 || silverNote.y > height - 45) {
    silverNote.vy *= -1;
    silverNote.noiseSeedY += random(50);
  }

  silverNote.x = constrain(silverNote.x, 45, width - 45);
  silverNote.y = constrain(silverNote.y, topUIHeight + 35, height - 45);
}

// Draw the glowing silver note on the screen.

function drawSilverNote() {
  if (silverNote === null || gameState !== "playing") {
    return;
  }

  let pulse = 0.5 + 0.5 * sin(frameCount * 0.08);
  blendMode(ADD);
  noStroke();
  fill(220, 230, 255, 70 + pulse * 70);
  circle(silverNote.x, silverNote.y, silverNote.size * 2.25);
  fill(255, 255, 255, 60);
  circle(silverNote.x, silverNote.y, silverNote.size * 1.25);
  blendMode(BLEND);

  if (musicalNoteImg) {
    imageMode(CENTER);
    image(musicalNoteImg, silverNote.x, silverNote.y, silverNote.size, silverNote.size);
    imageMode(CORNER);
  } else {
    drawFallbackMusicNote(silverNote.x, silverNote.y, silverNote.size);
  }
}

// Draw a simple music note when the image asset is unavailable.

function drawFallbackMusicNote(x, y, s) {
  stroke(232, 238, 255);
  strokeWeight(3);
  line(x + s * 0.1, y - s * 0.45, x + s * 0.1, y + s * 0.25);
  line(x + s * 0.1, y - s * 0.45, x + s * 0.42, y - s * 0.36);
  noStroke();
  fill(232, 238, 255);
  ellipse(x - s * 0.12, y + s * 0.25, s * 0.38, s * 0.25);
}

// Trigger the ECG event after the silver note is captured.

function catchSilverNoteSuccess(x, y) {
  silverNote = null;
  startEcgEvent(x, y);
}

// Remove the silver note after a failed capture attempt.

function failSilverNoteQTE() {
  silverNote = null;
}

// Start the ECG event and move fireflies toward exit paths.

function startEcgEvent(noteX, noteY) {
  ecgEventActive = true;
  ecgStartTime = millis();
  beatEnergy = 0;

  for (let f of gameFireflies) {
    if (f.visible === true && f.caught === false) {
      f.ecgStartX = f.x;
      f.ecgStartY = f.y;

      let exit = getNearestExitPoint(f.x, f.y);
      f.ecgExitX = exit.x;
      f.ecgExitY = exit.y;
    }
  }

  targetBgVolume = 0.2;

  if (bgSong !== null) {
    bgSong.setVolume(0.2, 0.5);
  }

  if (beatSound !== null) {
    beatSound.stop();
    beatSound.loop();
    beatFft = new p5.FFT(0.75, 128);
    beatFft.setInput(beatSound);
  }
}

// Find the closest off-screen exit point for a firefly.

function getNearestExitPoint(x, y) {
  let leftD = x;
  let rightD = width - x;
  let topD = y;
  let bottomD = height - y;
  let smallest = min(leftD, rightD, topD, bottomD);

  if (smallest === leftD) {
    return { x: -80, y: y };
  }
  if (smallest === rightD) {
    return { x: width + 80, y: y };
  }
  if (smallest === topD) {
    return { x: x, y: -80 };
  }
  return { x: x, y: height + 80 };
}

// Update ECG beat energy and end the event when time is over.

function updateEcgEvent() {
  if (!ecgEventActive) {
    return;
  }

  if (beatFft !== null) {
    beatFft.analyze();
    beatEnergy = beatFft.getEnergy(20, 20000);
  }

  if (millis() - ecgStartTime >= ecgDuration) {
    endEcgEvent();
  }
}

// Move fireflies into ECG-style wave patterns during the event.

function updateEcgFirefly(f, index) {
  let age = millis() - ecgStartTime;

  if (age < 2000) {
    let p = constrain(age / 2000, 0, 1);
    f.x = lerp(f.ecgStartX, f.ecgExitX, p);
    f.y = lerp(f.ecgStartY, f.ecgExitY, p);
    return;
  }

  let p = constrain((age - 2000) / (ecgDuration - 2000), 0, 1);
  let sideIndex = index % 20;
  let lane = sideIndex - 9.5;
  let waveHeight = 22 + beatEnergy * 0.18;
  let wave = sin(p * TWO_PI * 5 + index * 0.7) * waveHeight;
  let y = height / 2 + lane * 12 + wave;

  if (f.side === "left") {
    f.x = lerp(-80, width / 2 - 58, p);
  } else {
    f.x = lerp(width + 80, width / 2 + 58, p);
  }

  f.y = constrain(y, topUIHeight + 35, height - 35);
}

// End the ECG event and restore normal music and firefly movement.

function endEcgEvent() {
  ecgEventActive = false;
  targetBgVolume = 1;

  if (beatSound !== null) {
    beatSound.stop();
  }

  if (bgSong !== null) {
    bgSong.setVolume(1, 1);
  }

  for (let f of gameFireflies) {
    delete f.ecgStartX;
    delete f.ecgStartY;
    delete f.ecgExitX;
    delete f.ecgExitY;
    keepFireflyInBounds(f);
  }
}

// Stop the ECG beat event and reset the background volume target.

function stopBeatEvent() {
  ecgEventActive = false;

  if (beatSound !== null) {
    beatSound.stop();
  }

  targetBgVolume = 1;
}