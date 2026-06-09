# IDEA9103_TUT07-09_Group03_Final

# The Star Keeper

## Inspiration

*The Star Keeper* is deeply inspired by evocative interactive games and rich visual storytelling, focusing on emotion, rhythm, and atmosphere rather than complex control schemes.

### Core Influences

* **Gameplay Mechanics (*Journey*):** Inspired by the philosophy of subtle, organic environmental interaction. Players guide and interact with the world through simple movements, fostering a calm yet deeply atmospheric experience.
* **Visual Aesthetic (*Grave of the Fireflies*):** Draws on the poetic imagery of dancing, glowing entities against a dark backdrop. This directly influenced our split-screen visual narrative, contrasting warm-toned and cool-toned luminescent dynamics.

### Narrative Backstory

> *These are not ordinary fireflies, but shattered stars fallen from the sky. Fragments of red giants have drifted down as warm-colored fireflies **Sundrops**, while the ancient dust of white dwarfs hovers as cool-colored fireflies **Moonbeams**. Lost within the depths of a mystic forest, they drift aimlessly, waiting only for the resonance of the player’s voice to guide them home.*

Ultimately, the installation transforms the intuitive action of "catching fireflies" into a poetic ritual—inviting players to actively watch, vocalize, and collect cosmic energy through dynamic, playful interaction.

---

## Techniques

### 1. Code Overview

The project’s modular architecture divides game states and system logistics into five core scripts coordinated under a single `index.html`:

* **`sketch.js`**: Handles the foundation, including canvas initialization and the proactive preloading of multi-layered graphical and audio assets.
* **`Perlin noise and randomness.js`**: Governs the core gameplay scene, utilizing Perlin noise algorithms to compute fluid firefly coordinates while rendering the top info UI.
* **`Audio.js`**: Manages real-time microphone streams and FFT analysis to extract track amplitudes as well as vocal timbre structures.
* **`Time-based.js`**: Tracks time increments independently of the browser frame rate to precisely trigger global countdowns and environmental crisis events.
* **`User input.js`**: Monitors net cursor coordinates, custom click interaction boundaries, the Spacebar-based QTE progress bar, and final screen state transitions.

---

### 2. Implemented Techniques and Why

#### Perlin noise
Grants fireflies fluid, organic random flight paths overlaid with a sine-wave floating effect. This eliminates the jerky, artificial movement of ordinary random motion and simulates natural biological hovering.

#### Time-based System
Utilizes time increments to manage the core 120-second countdown and drive periodic obstacles (such as the 15-second red firefly respawn, the 30-second half-screen freeze, and the 15-second normal bug explosion). This guarantees tight, predictable control over gameplay pacing regardless of device performance.

#### Voice Interaction
Extracts vowel phonemes ("Ooh" and "Eee" via formant characteristics) in real-time. By bypassing individual physiological vocal pitch differences, it removes biological interaction barriers and ensures universal inclusivity.

#### Audio Visualization
Uses Fast Fourier Transform (FFT) to analyze background music frequencies. It maps the bass amplitude every 5 seconds into speed multipliers that directly modify the noise algorithm, causing the fireflies' velocity to pulse visibly with the rhythm.

#### Adaptive Layout
Dynamically rebuilds the game canvas boundaries based on the running device's screen dimensions. This ensures a perfect, seamless full-screen effect on any display size or device type.

#### Intelligent Custom Cursor
Redraws the pointer into a stylized "net" icon with smart state switching. It reverts to a standard arrow over buttons for easy navigation and hides completely inside frozen zones to visually signal blocked interaction, silently guiding player behavior.

#### Mutual Exclusion Event Chain
Manages event concurrency via boolean flags. It freezes the red firefly and ice countdowns whenever the 15-second silver note/ECG event is active, perfectly preventing overlapping deadlocks.

---

### 3. Key Decisions Made by the Team

#### Safety RNG Mechanism
> **Decision:** Incorporate a strict safety check during the punitive "explosive disappearance" event.
> 
> **Rationale:** If the remaining count of a specific color matches or falls below the target mission count, the system is strictly forbidden from destroying it. This guarantees that the game always remains theoretically winnable despite random anomalies, eliminating player despair caused by system-generated deadlocks.

#### Shift from Pitch to Phoneme Control
> **Decision:** Restructure the voice recognition algorithm to detect relative formant ratios ("Ooh" / "Eee") rather than absolute pitch (High / Low).
> 
> **Rationale:** The feedback got from coordinator revealed biological limitations where deep-voiced players completely struggled to trigger high-pitch mechanics. Shifting to vowel timbre extraction bypassed individual vocal range limits, strictly embodying the principles of accessible interaction design.

#### Expanded Capture Accessibility During the ECG Event
> **Decision:** During the 15-second ECG event, the standard QTE progress bar is temporarily bypassed. Instead, a successful capture is triggered immediately when the player clicks within the target's hitbox radius. In addition, the hitbox radius for fireflies is expanded to 44 pixels, making them significantly easier to catch during the event.
> 
> **Rationale:** During the ECG event, fireflies move at extremely high speeds and follow sharp zig-zag wave patterns synchronized with the beat audio. Removing the QTE requirement and enlarging the click detection radius helps balance the sudden increase in visual complexity and interaction difficulty. This adjustment maintains gameplay fairness, reduces player frustration, and encourages active participation during the event. As a result, the ECG sequence feels like a rewarding bonus experience rather than a punishment for the player.
---

## Mechanic Ownership

This section detail the technical architecture, division of labor, and inter-module integrations within **The Star Keeper**. The codebase is explicitly split into five standalone scripts, assigning clear development ownership to each team member.

---

### Foundational Architecture: `sketch.js`

Beyond the four required interactive mechanics, `sketch.js` serves as the foundational orchestrator controlling the global lifecycle and core visual utilities of the installation.

* **Global Setup & Asset Management:** Initializes the primary canvas, manages global execution states, and acts as the central hub connecting preloading tasks across all modular scripts.
* **Responsive Display Engine:** Listens to real-time window resizing events to dynamically scale coordinates (`windowResized`), ensuring an adaptive full-screen viewport across varying display configurations.
* **Scene Controller Machine:** Tracks the active application state loop, routing rendering workflows between the main start screen, active gameplay view, and final evaluation screens.
* **Visual & Typographic Assets:** Governs the aesthetic rendering of the start menu, incorporating a 2D animated floating figures, an antique parchment overlay.

---

### Audio Mechanic — Hongxiao He

#### Core Implementations
* **Music & Ambient Pacing:** Cycles through three long-form background audio tracks, seamlessly extracting randomized 25-second acoustic blocks. Leverages RMS amplitude monitoring every 5 seconds to map sound levels into velocity boundaries scaled between 3 and 20.
* **Universal Phoneme Voice Control:** Utilizes Formant frequency extraction (analyzing relative resonance peaks instead of pitch-dependent fundamental frequency $F_0$) to distinguish player-vocalized "Ooh" and "Eee" tokens. Beyond dynamic deceleration, this mechanic acts as the absolute interaction gatekeeper.
* **Silver Note:** Capturing the silver note triggers a transition to a different background track, causing all fireflies to execute an ECG-like wave flight pattern synchronized to the rhythm of the new music.

#### Cross-Module Integrations
* **With Perlin noise:** Transforms music frequency data into direct variable multipliers, overlaying a noticeable acoustic pulse onto the organic noise-driven velocity calculations.
* **With Time-based System:** Triggers severe boolean flags during active Silver Note events to forcefully pause global red firefly lifespans and ice freeze countdowns, avoiding extreme hazard overlaps.
* **With User Input:** Capturing the silver note expands the mouse click hitbox radius for normal fireflies, making them much easier to capture during the event.

---

### Time-based Mechanic — Xinyang Yu

#### Core Implementations
* **Global Countdown Tracker:** Monitors the deterministic 120-second game clock, enforcing the absolute highest runtime priority to stop interaction loops the exact millisecond the timer hits zero.
* **Red Firefly Spawning Engine:** Runs a strict 15-second generation cycle that introduces a rapid red firefly and lasting for 20-second. Capturing it extends the session timer by 5 seconds, whereas a failure triggers an automated entity deletion and cooling cycle.
* **Frozen Side Hazard:** Deploys a recurring 30-second localized obstacle that blankets a randomized screen hemisphere with an un-interactive ice mask (`frozen.png`) for a fixed 5-second duration.
* **Punitive Disappearance Routine:** Triggers a 15-second automated check that forces a regular firefly to erupt. Employs an essential safety check: if the remaining counts match target mission variables, it prevents entity destruction to preserve game solvability.

#### Cross-Module Integrations
* **With Perlin noise:** Feeds high-velocity parameters directly into the noise coordinate calculations whenever a red firefly is initialized, ensuring its flight path remains erratic and urgent.
* **With Audio Input:** Freezes all internal timers while a silver note event is active.
* **With User Input:** Overrides the input system by disabling all click listeners within a frozen hemisphere and hiding the player net. Instantly breaks active QTE progress bars upon global time expiration.

---

### Perlin Noise & Randomness — Ruiyang Sun

#### Core Implementations
* **Population Initialization Matrice:** Restricts spatial generation to exactly 40 fireflies per round, locking hemisphere ratios between 10 and 30 entities to eliminate extreme RNG anomalies. Dynamically structures mission targets ($x$, $y$) to ensure they remain mathematically lower than total populations.
* **Perlin Noise Trajectory Engine:** Feeds unique random seeds into Perlin Noise generators to chart fluid, lifelike flight paths, overlaid with independent harmonic sine waves to replicate drifting biological levitation.
* **Anti-Clumping Separation Calculus:** Executes continuous local distance monitoring (`dist`), calculating localized separation forces to keep neighboring fireflies spaced apart, avoiding overlapping visual clutter.
* **State UI Component:** Renders the customized 118px information bar. Controls reactive, bounce-animated text-box counters that simulate a turning calendar page when targets increase (+1).
* **Randomnes:** The required number of fireflies to capture is randomly generated each round, ensuring that every playthrough presents a different challenge and encouraging players to return for repeated attempts.

#### Cross-Module Integrations
* **With Audio Input:** Relinquishes noise paths during the silver note event, shifting entities into a high-amplitude ECG wave sequence.
* **With Time-based System:** Hooks directly into the system clock to instantly freeze coordinate modifications for fireflies caught within frozen sectors.
* **With User Input:** Pulls active entities out of the global coordinate tracking array the moment an QTE Progress Bar is verified, anchoring that specific firefly static in space while allowing the other items to continue their fluid paths.

---

### User Input Mechanic — Yurui Li

#### Core Implementations
* **Contextual Net Cursor:** Features conditional logic that automatically returns the cursor to a pointer over interactive buttons, and completely nullifies it when entering a frozen sector.
* **QTE Trigger Mechanic:** After the player produces the required Ooh or Eee vocal input and clicks on a firefly, a QTE progress bar appears. To successfully capture the target, the player must press the Spacebar while the moving cursor is within the white success zone of the bar. The position and size of the white zone are randomly generated each time, increasing both the challenge and the clarity of the capture process while making the interaction more engaging and enjoyable.
* **Evaluator Matrix:** Acts as the central evaluator for all caught entities (Normal, Red, Note). Dispatches success metrics to the UI counters or triggers immediate object deletion upon a failed QTE.
* **End Game Portals:** Controls the display states for win/loss conditions.

#### Cross-Module Integrations
* **With Audio Input:** During the 15-second ECG event, the mouse click hitbox radius for normal bugs is programmatically expanded to a highly forgiving 44 pixels.
* **With Time-based System:** Respects time-based vetoes by dropping input tracking in frozen zones, and yields script controls to freeze the 20-second red firefly timer while its dedicated QTE bar is actively drawn.
* **With Berlin Noise:** Once a specific firefly has activated its progress bar, the Berlin Noise algorithm will freeze its coordinates on the spot.

---

## AI Acknowledgement

AI tools were utilized as collaborative engineering assistants during the development of this project. AI was mainly used to:
Writing the foundational code and checking for conflicts between the code of each individual module.
Several features that were important to our game design, but fell outside the scope of the course requirements, were also implemented. These additions have been clearly annotated and explained through code comments.

---

## External References

We referred to the following authoritative sources for theoretical inspiration, interactive design philosophies, and technical acoustic guidance:

### 1. Game Design & Narrative Inspiration
* **thatgamecompany. (2012). *Journey* [Video Game].** * *Influence:* Inspired our core interactive philosophy—prioritizing emotional resonance, minimalist control systems, and rich environmental feedback over complex UI interactions.
* **Takahata, I. (Director). (1988). *Grave of the Fireflies* [Film]. Studio Ghibli.**
  * *Influence:* Heavily influenced the poetic visual narrative, dark atmospheric contrast, and the dualistic warm/cool color palettes of our floating luminescent particles.

### 2. Acoustic Analysis & Inclusivity Reference
* **Story, B. H., & Bunton, K. (2018). Formant frequencies of vowels in continuous speech as indicators of speaker identity and vowel category. *Journal of Speech, Language, and Hearing Research*, 61(11), 2689-2703.**
  * *Influence:* Provided modern empirical data confirming that relative vocal tract resonances remain highly reliable benchmarks for categorization across structurally diverse speakers, regardless of their individual biological pitch variations. This research directly validated our team's decision to implement a phoneme-based trigger, eliminating vocal profile biases to deliver a highly inclusive interactive user interface.

---

## Interaction Instructions

Welcome to the mystical forest of **The Star Keeper**. Please follow these directives to guide the fallen stars home:

### 1. Awakening the Forest (Prerequisites)
* Ensure your **microphone** is plugged in, active, and that your browser has been granted permission to access audio input.
* Launch the application. Click **"GO!"** to initiate the system countdown and begin audio playback.

### 2. General Gameplay Controls (Voice-Gated Capture)


* **Step 1: Vocal Control**
  * Vocalizing "Eee" or "Ooh" can temporarily immobilize the warm-colored or cool-colored fireflies respectively, making them easier to capture.
* **Step 2: The Net Strike (Mouse Click)**
  * When the net cursor is positioned over the glowing center of a firefly and the player left-clicks, a QTE progress bar is triggered. To successfully capture the firefly, the player must press the Spacebar when the moving cursor enters the white success zone of the progress bar. Successfully captured fireflies disappear from the screen and leave behind a flashing four-pointed star at their original position. Fireflies that fail the capture attempt continue flying normally.


### 3. Special Events
* **Red Firefly:** Spawns every 15 seconds. It dashes erratically at intense speeds. Catching it before its 20-second lifespan ends adds an extra +5 seconds to your global countdown. *Note: Red fireflies are rare entities and are completely exempted from user voice-gating; you can click and capture them immediately without vocalizing.*
* **Frozen Side:** Every 30 seconds, a randomized screen hemisphere will be frozen for a fixed 5-second duration. During a freeze, all interactions in that area are disabled, your net cursor will be completely hidden, and entities inside cannot be captured.
* **Silver Note:** The Silver Note spawns once at a random time between 20 and 90 seconds after the start of the game and will not appear on the same side consecutively. 
* **ECG wave-like flight pattern:** During this event, capturing fireflies no longer requires the QTE progress bar, and the click detection radius for normal fireflies is expanded to 44 pixels, making them significantly easier to catch.
* **Normal Firefly Disappearance:** Every 30 seconds, one randomly selected firefly will disappear from the field and be replaced by a flashing four-pointed star effect at its original position. A built-in safety check ensures that enough fireflies of each type remain available, so the current round's capture objectives can still be completed.

### 4. Resets & Session Refreshing
* At any point during gameplay, you can click **"The Star Keeper"** button on the top-center UI to immediately wipe active states, regenerate random targets, and reset the 120-second game time.
* Upon entering a win/loss screen, click the **Play Again** or **Try Again**button to safely return to the main menu.