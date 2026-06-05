// Audio system: forest music, microphone voice control, silver note, and ECG event.

// Background music players and FFT analyzer for reading the current forest track.
let bgSongs = [];
let bgSong = null;
let bgFft = null;

// Microphone input and FFT analyzer for detecting Ooh/Eee vocal sounds.
let mic = null;
let micFft = null;
let micIsReady = false;
let micLevel = 0;
let audioStarted = false;

// Music speed is sampled every few seconds and mapped into the normal firefly motion system.
let baseSpeed = 10;
let musicSpeed = 10;
let musicPartDuration = 25;
let musicPartStartTime = 0;
let lastMusicReadTime = 0;
let currentSongIndex = -1;
let targetBgVolume = 0.45;

// Voice control state: Eee freezes the left/orange side, Ooh freezes the right/blue side.
let oohSlowAmount = 0;
let eeeSlowAmount = 0;
let soundSlowStep = 0.35;
let maxSoundSlow = 9;
let voiceEnergyThreshold = 22;
let voiceLevelThreshold = 0.008;
let voiceSlowDuration = 5000;
let voiceSlowRampDuration = 80;
let voiceSlowFactor = 0;
let voiceOverrideSpeed = 0;
let leftVoiceSlowStart = -10000;
let rightVoiceSlowStart = -10000;
let wasHearingOoh = false;
let wasHearingEee = false;
let lastVoiceDebug = "none";
let voiceNoiseFloor = 0.004;
let voiceSignalAmount = 0;
let voiceCalibrationStart = 0;
let voiceCalibrationDuration = 2200;
let voiceLevelBoost = 0.014;
let voiceRatioBoost = 1.9;

// Silver note state. It appears 1-2 times per round and can trigger the ECG event.
let musicalNoteImg = null;
let silverNote = null;
let noteCount = 0;
let maxNotesThisRound = 0;
let nextNoteSpawnSecond = 0;

// Beat audio and timing for the ECG wave movement.
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

// Start microphone input and begin playing background music after the user clicks Start.
function startAudioSystem() {
  userStartAudio();

  if (getAudioContext().state !== "running") {
    getAudioContext().resume();
  }

  if (!audioStarted) {
    audioStarted = true;

    // Create the microphone and FFT analyzer immediately, then bind again after permission succeeds.
    mic = new p5.AudioIn();
    micFft = new p5.FFT(0.65, 512);
    micFft.setInput(mic);

    mic.start(
      function () {
        micIsReady = true;
        micFft.setInput(mic);
        voiceCalibrationStart = millis();
      },
      function () {
        micIsReady = false;
      }
    );
  }

  if (bgSong === null) {
    startNextMusicPart();
  }
}

// Reset music speed and voice-triggered freeze effects for a new round.
function resetAudioRound() {
  musicSpeed = baseSpeed;
  oohSlowAmount = 0;
  eeeSlowAmount = 0;
  micLevel = 0;
  leftVoiceSlowStart = -10000;
  rightVoiceSlowStart = -10000;
  wasHearingOoh = false;
  wasHearingEee = false;
  lastVoiceDebug = "none";
  voiceSignalAmount = 0;
  voiceCalibrationStart = millis();
  lastMusicReadTime = 0;
  musicPartStartTime = 0;

  if (audioStarted) {
    startNextMusicPart();
  }
}

// Stop all active audio when returning to the start screen or ending a round.
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

// Choose and play a random 25-second segment from one of the forest tracks.
function startNextMusicPart() {
  if (bgSongs.length === 0) {
    return;
  }

  let oldSong = bgSong;
  if (oldSong !== null) {
    oldSong.stop();
  }

  let nextSongIndex = floor(random(bgSongs.length));
  if (nextSongIndex === currentSongIndex && bgSongs.length > 1) {
    nextSongIndex = (nextSongIndex + 1) % bgSongs.length;
  }

  currentSongIndex = nextSongIndex;
  bgSong = bgSongs[currentSongIndex];

  if (bgSong === undefined || bgSong === null) {
    bgSong = null;
    bgFft = null;
    return;
  }

  let maxStartTime = max(0, bgSong.duration() - musicPartDuration - 1);
  let randomStartTime = random(maxStartTime);

  bgSong.play(0, 1, 0, randomStartTime, musicPartDuration + 1);
  bgSong.setVolume(targetBgVolume, 0.8);

  bgFft = new p5.FFT(0.8, 128);
  bgFft.setInput(bgSong);

  musicPartStartTime = millis();
  lastMusicReadTime = millis() - 5000;
}

// Update music switching, music analysis, and microphone-based freeze effects.
function updateAudioSystem() {
  if (!audioStarted) {
    return;
  }

  updateVoiceFreeze();

  if (bgSong !== null) {
    if (millis() - musicPartStartTime > musicPartDuration * 1000) {
      startNextMusicPart();
    }

    updateMusicSpeed();
  }
}

// Analyze the forest music energy and convert it into the normal firefly speed.
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

// Analyze microphone input and freeze the matching side for five seconds.
function updateVoiceFreeze() {
  let heardOoh = false;
  let heardEee = false;
  let now = millis();

  // Keyboard fallback is only for testing whether the freeze pipeline works.
  if (keyIsPressed) {
    if (key === "i" || key === "I") {
      heardEee = true;
    }
    if (key === "o" || key === "O") {
      heardOoh = true;
    }
  }

  // The microphone and background music use different FFT inputs; this reads only the physical mic.
  if (mic !== null && micFft !== null && !heardOoh && !heardEee) {
    micFft.analyze();

    let lowEnergy = micFft.getEnergy(140, 900);
    let midEnergy = micFft.getEnergy(900, 1600);
    let highEnergy = micFft.getEnergy(1600, 5200);
    let voiceEnergy = micFft.getEnergy(140, 5200);

    micLevel = mic.getLevel();

    // Calibrate the room sound first. This includes any background music leaking from speakers.
    let isCalibrating = millis() - voiceCalibrationStart < voiceCalibrationDuration;
    let levelAboveFloor = micLevel - voiceNoiseFloor;
    let levelRatio = micLevel / max(voiceNoiseFloor, 0.001);
    let hasVoice =
      !isCalibrating &&
      micLevel > voiceLevelThreshold &&
      levelAboveFloor > voiceLevelBoost &&
      levelRatio > voiceRatioBoost &&
      voiceEnergy > voiceEnergyThreshold;

    if (!hasVoice) {
      updateVoiceNoiseFloor(micLevel);
      voiceSignalAmount = max(0, voiceSignalAmount - 1);
    } else {
      // Ooh is a darker sound, so check the low/high balance before checking Eee brightness.
      let highToLow = highEnergy / max(lowEnergy, 1);
      let lowRatio = lowEnergy / max(voiceEnergy, 1);
      let highRatio = highEnergy / max(voiceEnergy, 1);
      let oohCandidate = lowEnergy > 18 && (highToLow < 0.72 || (lowRatio > 0.5 && highRatio < 0.28));
      let eeeCandidate = highEnergy > 14 && (highToLow >= 0.72 || highRatio >= 0.24);

      if (oohCandidate) {
        heardOoh = true;
      } else if (eeeCandidate) {
        heardEee = true;
      } else if (highToLow < 0.8) {
        heardOoh = true;
      } else {
        heardEee = true;
      }

      voiceSignalAmount = max(micLevel * 1000, voiceEnergy);
    }
  }

  // Reduce music while voice control is active so speaker sound is less likely to leak into the mic.
  updateVoiceMusicDucking(heardOoh || heardEee);

  if (heardOoh) {
    triggerVoiceFreeze("right", now);
    oohSlowAmount = maxSoundSlow;
    lastVoiceDebug = "Ooh freezes right";
  } else {
    oohSlowAmount = max(oohSlowAmount - soundSlowStep * 0.65, 0);
  }

  if (heardEee) {
    triggerVoiceFreeze("left", now);
    eeeSlowAmount = maxSoundSlow;
    lastVoiceDebug = "Eee freezes left";
  } else {
    eeeSlowAmount = max(eeeSlowAmount - soundSlowStep * 0.65, 0);
  }

  wasHearingOoh = heardOoh;
  wasHearingEee = heardEee;
}

// Slowly learn the current non-player sound level so background music is treated as ambience.
function updateVoiceNoiseFloor(level) {
  let riseRate = millis() - voiceCalibrationStart < voiceCalibrationDuration ? 0.14 : 0.035;
  let fallRate = 0.006;

  if (level > voiceNoiseFloor) {
    voiceNoiseFloor = lerp(voiceNoiseFloor, level, riseRate);
  } else {
    voiceNoiseFloor = lerp(voiceNoiseFloor, level, fallRate);
  }

  voiceNoiseFloor = constrain(voiceNoiseFloor, 0.002, 0.08);
}

// Lower background music when the mic hears the player or while a side is frozen.
function updateVoiceMusicDucking(voiceNow) {
  if (bgSong === null || ecgEventActive) {
    return;
  }

  let freezeActive = isSideVoiceSlowActive("left") || isSideVoiceSlowActive("right");

  if (voiceNow || freezeActive) {
    bgSong.setVolume(0.08, 0.08);
  } else {
    bgSong.setVolume(targetBgVolume, 0.4);
  }
}

// Start the five-second full freeze window for one side.
function triggerVoiceFreeze(side, startTime) {
  if (side === "left") {
    leftVoiceSlowStart = startTime;
  }

  if (side === "right") {
    rightVoiceSlowStart = startTime;
  }
}

// Backward-compatible wrapper for older code that still calls triggerVoiceSlow().
function triggerVoiceSlow(side, startTime) {
  triggerVoiceFreeze(side, startTime);
}

// Calculate current speed for code paths that use speed instead of movement scale.
function getFireflySpeed(firefly) {
  if (isSideVoiceSlowActive(firefly.side)) {
    return voiceOverrideSpeed;
  }

  return constrain(musicSpeed, 3, 20);
}

// Convert the speed number into a scale used by some movement code versions.
function getFireflySpeedScale(firefly) {
  return getFireflySpeed(firefly) / baseSpeed;
}

// Return the start time of the freeze effect for the requested side.
function getSideVoiceSlowStart(side) {
  if (side === "left") {
    return leftVoiceSlowStart;
  }

  return rightVoiceSlowStart;
}

// A side remains controlled for five seconds after the matching voice is detected.
function isSideVoiceSlowActive(side) {
  return millis() - getSideVoiceSlowStart(side) < voiceSlowDuration;
}

// Return 1 when the side is frozen and 0 when it is free.
function getSideSlowProgress(side) {
  if (isSideVoiceSlowActive(side)) {
    return 1;
  }

  return 0;
}

// Berlin Noise.js multiplies normal firefly movement by this scale.
function getSideSlowSpeedScale(side) {
  if (isSideVoiceSlowActive(side)) {
    return voiceSlowFactor;
  }

  return 1;
}

// Voice is not a capture requirement in this version; it only makes normal fireflies easier to catch.
function canStartCaptureDuringSideSlow(kind, target) {
  return true;
}

// Reset the silver note and ECG event for a fresh round.
function startSpecialNoteRound() {
  silverNote = null;
  noteCount = 0;
  maxNotesThisRound = floor(random(1, 3));
  nextNoteSpawnSecond = floor(random(15, 25));
  ecgEventActive = false;
  ecgStartTime = 0;
  beatEnergy = 0;
}

// Update the silver note spawn schedule, note movement, and ECG event status.
function updateSpecialNoteSystem() {
  if (gameState !== "playing") {
    return;
  }

  updateEcgEvent();

  if (noteCount < maxNotesThisRound && silverNote === null) {
    let elapsed = floor((millis() - roundStartTime) / 1000);

    if (elapsed >= nextNoteSpawnSecond && roundTimeLeft > 10 && !hasSpecialNoteConflict()) {
      createSilverNote();
      noteCount++;
      nextNoteSpawnSecond = elapsed + floor(random(30, 45));
    }
  }

  if (silverNote !== null && activeCapture === null) {
    moveSilverNote();

    if (millis() - silverNote.spawnTime > 10000) {
      silverNote = null;
    }
  }
}

// Prevent silver note from appearing during red firefly, frozen side, QTE, ECG, or post-ECG cooldown.
function hasSpecialNoteConflict() {
  let cooldownActive = typeof postEcgCooldown !== "undefined" ? postEcgCooldown > 0 : false;
  return redFirefly !== null || freezeSide !== null || activeCapture !== null || ecgEventActive || cooldownActive;
}

// Create a silver note at a clear random playable position.
function createSilverNote() {
  let position = getClearRandomPosition(
    {
      minX: 30,
      maxX: width - 30,
      minY: topUIHeight + 55,
      maxY: height - 55
    },
    105,
    90
  );

  silverNote = {
    x: position.x,
    y: position.y,
    size: 48,
    vx: (random(1) < 0.5 ? -1 : 1) * random(3, 4),
    vy: random(-1, 1),
    waveOffset: random(TWO_PI),
    spawnTime: millis()
  };
}

// Move the silver note with a horizontal glide and a gentle vertical wave.
function moveSilverNote() {
  silverNote.x += silverNote.vx;
  silverNote.y += sin(frameCount * 0.16 + silverNote.waveOffset) * 2.1 + silverNote.vy;
  pushAwayFromOtherObjects(silverNote, 86, 0.65);

  if (silverNote.x < 24 || silverNote.x > width - 24) {
    silverNote.vx *= -1;
  }

  if (silverNote.y < topUIHeight + 35 || silverNote.y > height - 45) {
    silverNote.vy *= -1;
  }

  silverNote.x = constrain(silverNote.x, 24, width - 24);
  silverNote.y = constrain(silverNote.y, topUIHeight + 35, height - 45);
}

// Draw the silver note image, with a fallback if the asset is missing.
function drawSilverNote() {
  if (silverNote === null || gameState !== "playing") {
    return;
  }

  if (musicalNoteImg) {
    tint(238, 240, 255, 245);
    imageMode(CENTER);
    image(musicalNoteImg, silverNote.x, silverNote.y, silverNote.size, silverNote.size);
    imageMode(CORNER);
    noTint();
  } else {
    drawFallbackMusicNote(silverNote.x, silverNote.y, silverNote.size);
  }
}

// Fallback note drawing if musical note.png is missing.
function drawFallbackMusicNote(x, y, s) {
  stroke(232, 238, 255);
  strokeWeight(3);
  line(x + s * 0.1, y - s * 0.45, x + s * 0.1, y + s * 0.25);
  line(x + s * 0.1, y - s * 0.45, x + s * 0.42, y - s * 0.36);
  noStroke();
  fill(232, 238, 255);
  ellipse(x - s * 0.12, y + s * 0.25, s * 0.38, s * 0.25);
}

// Trigger the ECG event after a successful silver-note QTE.
function catchSilverNoteSuccess(x, y) {
  silverNote = null;
  startEcgEvent(x, y);
}

// Remove the silver note after a failed capture attempt.
function failSilverNoteQTE() {
  silverNote = null;
}

// Start the ECG event, lower forest music volume, and launch the beat track.
function startEcgEvent(noteX, noteY) {
  ecgEventActive = true;
  ecgStartTime = millis();
  beatEnergy = 0;

  let leftTotal = 0;
  let rightTotal = 0;

  for (let f of gameFireflies) {
    if (f.visible === true && f.caught === false) {
      if (f.side === "left") {
        leftTotal++;
      } else {
        rightTotal++;
      }
    }
  }

  let leftIndex = 0;
  let rightIndex = 0;

  for (let f of gameFireflies) {
    if (f.visible === true && f.caught === false) {
      f.ecgStartX = f.x;
      f.ecgStartY = f.y;

      if (f.side === "left") {
        f.ecgExitX = -100;
        f.ecgExitY = height / 2;
        let spacing = leftTotal > 1 ? leftIndex / (leftTotal - 1) : 0.5;
        f.ecgTargetX = map(spacing, 0, 1, width * 0.06, width * 0.46);
        leftIndex++;
      } else {
        f.ecgExitX = width + 100;
        f.ecgExitY = height / 2;
        let spacing = rightTotal > 1 ? rightIndex / (rightTotal - 1) : 0.5;
        f.ecgTargetX = map(spacing, 0, 1, width * 0.54, width * 0.94);
        rightIndex++;
      }
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

// Update ECG beat energy and end the event when its duration is over.
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

// Move normal fireflies out, then back in with beat-driven ECG-style waves.
function updateEcgFirefly(f) {
  let age = millis() - ecgStartTime;

  if (age < 1500) {
    let p = constrain(age / 1500, 0, 1);
    f.x = lerp(f.ecgStartX, f.ecgExitX, p * p);
    f.y = lerp(f.ecgStartY, f.ecgExitY, p * p);
    return;
  }

  if (age < 2000) {
    f.x = f.ecgExitX;
    f.y = f.ecgExitY;
    return;
  }

  let returnP = constrain((age - 2000) / 2000, 0, 1);
  let easeOut = 1 - Math.pow(1 - returnP, 3);
  let waveFreq = 0.012;
  let timeScroll = frameCount * 0.08;
  let dir = f.side === "left" ? -1 : 1;
  let baseAmplitude = map(beatEnergy, 0, 255, 15, 210);
  let unevenFactor = 0.65 + 0.35 * sin(f.ecgTargetX * 0.025);
  let phase = f.ecgTargetX * waveFreq + timeScroll * dir;
  let waveY = sin(phase) * baseAmplitude * unevenFactor;
  let targetY = height / 2 + waveY;

  f.x = lerp(f.ecgExitX, f.ecgTargetX, easeOut);
  f.y = lerp(f.ecgExitY, targetY, easeOut);
  f.y = constrain(f.y, topUIHeight + 35, height - 35);
}

// End ECG mode and restore normal music volume and normal firefly movement.
function endEcgEvent() {
  ecgEventActive = false;
  targetBgVolume = 0.45;

  if (beatSound !== null) {
    beatSound.stop();
  }

  if (bgSong !== null) {
    bgSong.setVolume(targetBgVolume, 1);
  }

  for (let f of gameFireflies) {
    delete f.ecgStartX;
    delete f.ecgStartY;
    delete f.ecgExitX;
    delete f.ecgExitY;
    delete f.ecgTargetX;
    keepFireflyInBounds(f);
  }
}

// Stop ECG audio immediately when a round ends or the player restarts.
function stopBeatEvent() {
  ecgEventActive = false;

  if (beatSound !== null) {
    beatSound.stop();
  }

  targetBgVolume = 0.45;
}
