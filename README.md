# IDEA9103_TUT07-09_Group03_Final

# The Star Keeper

## Inspiration

*The Star Keeper* is deeply inspired by evocative interactive games and rich visual storytelling, focusing on emotion, rhythm, and atmosphere rather than complex control schemes.

### Core Influences

* **Gameplay Mechanics (*Journey*):** Inspired by the philosophy of subtle, organic environmental interaction. Players guide and interact with the world through simple movements and non-verbal vocalizations, fostering a calm yet deeply atmospheric experience.
* **Visual Aesthetic (*Grave of the Fireflies*):** Draws heavily on the poetic imagery of dancing, glowing entities against a dark backdrop. This directly influenced our split-screen visual narrative, contrasting warm-toned and cool-toned luminescent dynamics.

### Narrative Backstory

> *These are not ordinary fireflies, but shattered stars fallen from the sky. Fragments of red giants have drifted down as warm-colored fireflies **Sundrops**, while the ancient dust of white dwarfs hovers as cool-colored fireflies **Moonbeams**. Lost within the depths of a mystic forest, they drift aimlessly, waiting only for the resonance of the player’s voice to guide them home.*

Ultimately, the installation transforms the intuitive action of "catching fireflies" into a poetic ritual—inviting players to actively watch, vocalize, and collect cosmic energy through dynamic, playful interaction.

---

## Techniques

### 1. Code Overview

The project’s modular architecture divides game states and system logistics into five core scripts coordinated under a single `index.html`:

* **`sketch.js`**: Handles the foundation, including canvas initialization and the proactive preloading of multi-layered graphical and audio assets.
* **`Berlin Noise.js`**: Governs the core gameplay scene, utilizing Perlin noise algorithms to compute fluid firefly coordinates while rendering the top info UI.
* **`Audio input.js`**: Manages real-time microphone streams and FFT analysis to extract track amplitudes as well as vocal timbre structures.
* **`Time-based.js`**: Tracks time increments independently of the browser frame rate to precisely trigger global countdowns and environmental crisis events.
* **`User input.js`**: Monitors net cursor coordinates, custom click interaction boundaries, the Spacebar-based QTE progress bar, and final screen state transitions.

---

### 2. Implemented Techniques and Why

#### Perlin Noise
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
Manages event concurrency via boolean flags. It freezes the red firefly and ice countdowns whenever the 15-second silver note/ECG event is active, and blocks the silver note from spawning if another crisis is already present, perfectly preventing overlapping deadlocks.

---

### 3. Key Decisions Made by the Team

#### Safety RNG Mechanism
> **Decision:** Incorporate a strict safety check during the punitive "explosive disappearance" event.
> 
> **Rationale:** If the remaining count of a specific color matches or falls below the target mission count, the system is strictly forbidden from destroying it. This guarantees that the game always remains theoretically winnable despite random anomalies, eliminating player despair caused by system-generated deadlocks.

#### Shift from Pitch to Phoneme Control
> **Decision:** Restructure the voice recognition algorithm to detect relative formant ratios ("Ooh" / "Eee") rather than absolute pitch (High / Low).
> 
> **Rationale:** Initial prototype user testing revealed biological limitations where deep-voiced players completely struggled to trigger high-pitch mechanics. Shifting to vowel timbre extraction bypassed individual vocal range limits, strictly embodying the principles of accessible interaction design.

#### Adaptive QTE Hitbox Expansion
> **Decision:** Programmatically expand the mouse click hitbox radius for normal bugs to a forgiving 44 pixels during the special audio event.
> 
> **Rationale:** During the 15-second chaotic "ECG wave" event, fireflies move at extreme velocities in sharp zig-zag patterns. Expanding the hitbox balances the drastic spike in visual chaos, maintaining gameplay fairness and keeping the interaction engaging rather than frustrating.

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
* **Universal Phoneme Voice Control:** Utilizes Formant frequency extraction (analyzing relative resonance peaks instead of pitch-dependent fundamental frequency $F_0$) to distinguish player-vocalized "Ooh" and "Eee" tokens. Beyond dynamic deceleration, this mechanic acts as the absolute interaction gatekeeper: **capturing is strictly forbidden unless the player is actively do the voice input.**
* **Silver Note:** Capturing the silver note triggers a transition to a different background track, causing all fireflies to execute an ECG-like wave flight pattern synchronized to the rhythm of the new music.

#### Cross-Module Integrations
* **With Berlin Noise:** Transforms music frequency data into direct variable multipliers, overlaying a noticeable acoustic pulse onto the organic noise-driven velocity calculations.
* **With Time-based System:** Triggers severe boolean flags during active Silver Note events to forcefully pause global red firefly lifespans and ice freeze countdowns, avoiding extreme hazard overlaps.
* **With User Input:** Capturing the silver note expands the mouse click hitbox radius for normal fireflies, making them much easier to capture during the event.

---

### Time-based Mechanic — Xinyang Yu

#### Core Implementations
* **Global Countdown Tracker:** Monitors the deterministic 120-second game clock, enforcing the absolute highest runtime priority to stop interaction loops the exact millisecond the timer hits zero.
* **Red Firefly Spawning Engine:** Runs a strict 15-second generation cycle that introduces a rapid red firefly. Capturing it extends the session timer by 5 seconds, whereas a failure triggers an automated entity deletion and cooling cycle.
* **Frozen Side Hazard:** Deploys a recurring 30-second localized obstacle that blankets a randomized screen hemisphere with an un-interactive ice mask (`frozen.png`) for a fixed 5-second duration.
* **Punitive Disappearance Routine:** Triggers a 15-second automated check that forces a regular firefly to erupt. Employs an essential safety check: if the remaining counts match target mission variables, it prevents entity destruction to preserve game solvability.

#### Cross-Module Integrations
* **With Berlin Noise:** Feeds high-velocity parameters directly into the noise coordinate calculations whenever a red firefly is initialized, ensuring its flight path remains erratic and urgent.
* **With Audio Input:** Freezes all internal timers while a silver note event is active, and conversely blocks sound-based silver notes from spawning if an ice layer or red entity is currently occupying the scene.
* **With User Input:** Overrides the input system by disabling all click listeners within a frozen hemisphere and hiding the player net. Instantly breaks active QTE progress bars upon global time expiration.

---

### Perlin Noise & Randomness — Ruiyang Sun

#### Core Implementations
* **Population Initialization Matrice:** Restricts spatial generation to exactly 40 fireflies per round, locking hemisphere ratios between 10 and 30 entities to eliminate extreme RNG anomalies. Dynamically structures mission targets ($x$, $y$) to ensure they remain mathematically lower than total populations.
* **Perlin Noise Trajectory Engine:** Feeds unique random seeds into Perlin Noise generators to chart fluid, lifelike flight paths, overlaid with independent harmonic sine waves to replicate drifting biological levitation.
* **Anti-Clumping Separation Calculus:** Executes continuous local distance monitoring (`dist`), calculating localized separation forces to keep neighboring fireflies spaced apart, avoiding overlapping visual clutter.
* **State UI Component:** Renders the customized 118px information bar. Controls reactive, bounce-animated text-box counters that simulate a turning calendar page when targets increase (+1).

#### Cross-Module Integrations
* **With Audio Input:** Relinquishes noise paths during the silver note event, shifting entities into a high-amplitude ECG wave sequence.
* **With Time-based System:** Hooks directly into the system clock to instantly freeze coordinate modifications for fireflies caught within frozen sectors.
* **With User Input:** Pulls active entities out of the global coordinate tracking array the moment an QTE Progress Bar is verified, anchoring that specific firefly static in space while allowing the other 39 items to continue their fluid paths.

---

### User Input Mechanic — Yurui Li

#### Core Implementations
* **Contextual Net Cursor:** Features conditional logic that automatically returns the cursor to a pointer over interactive buttons, and completely nullifies it when entering a frozen sector.
* **Conditional QTE Triggering:** Clicking the central glowing point of a firefly will only initialize the floating progress bar if the voice input condition is simultaneously satisfied. User Input continuously verifies phonetic states, completely rejecting clicks on normal fireflies if the corresponding "Ooh" or "Eee" input is absent.
* **Evaluator Matrix:** Acts as the central evaluator for all caught entities (Normal, Red, Note). Dispatches success metrics to the UI counters or triggers immediate object deletion upon a failed QTE, ensuring the silver note is penalized with permanent removal.
* **End Game Portals:** Controls the display states for win/loss conditions.

#### Cross-Module Integrations
* **With Audio Input:** During the 15-second ECG event, the mouse click hitbox radius for normal bugs is programmatically expanded to a highly forgiving 44 pixels.
* **With Time-based System:** Respects time-based vetoes by dropping input tracking in frozen zones, and yields script controls to freeze the 20-second red firefly timer while its dedicated QTE bar is actively drawn.
* **With Berlin Noise:** Once a specific firefly has activated its progress bar, the Berlin Noise algorithm will freeze its coordinates on the spot.

---

## AI Acknowledgement

AI tools (specifically Large Language Models) were utilized as collaborative engineering assistants during the development of this project. AI was mainly used to:
Writing the foundational code and checking for conflicts between the code of each individual module.

---

## External References

We referred to the following authoritative sources for theoretical inspiration, interactive design philosophies, and technical acoustic guidance:

### 1. Game Design & Narrative Inspiration
* **thatgamecompany. (2012). *Journey* [Video Game].** * *Influence:* Inspired our core interactive philosophy—prioritizing emotional resonance, minimalist control systems, and rich environmental feedback over complex UI interactions.
* **Takahata, I. (Director). (1988). *Grave of the Fireflies* (火垂之墓) [Film]. Studio Ghibli.**
  * *Influence:* Heavily influenced the poetic visual narrative, dark atmospheric contrast, and the dualistic warm/cool color palettes of our floating luminescent particles.

### 2. Acoustic Analysis & Inclusivity Reference
* **Story, B. H., & Bunton, K. (2018). Formant frequencies of vowels in continuous speech as indicators of speaker identity and vowel category. *Journal of Speech, Language, and Hearing Research*, 61(11), 2689-2703.**
  * *Influence:* Provided modern empirical data confirming that relative vocal tract resonances (Formants $1 and $2) remain highly reliable benchmarks for categorization across structurally diverse speakers, regardless of their individual biological pitch variations ($F_0$). This research directly validated our team's decision to implement a phoneme-based trigger, eliminating vocal profile biases to deliver a highly inclusive interactive user interface.

---

## Interaction Instructions

Welcome to the mystical forest of **The Star Keeper**. Please follow these directives to guide the fallen stars home:

### 1. Awakening the Forest (Prerequisites)
* Ensure your **microphone** is plugged in, active, and that your browser has been granted permission to access audio input.
* Launch the application. Click **"Game Start"** to initiate the system countdown and begin audio playback.

### 2. General Gameplay Controls (Voice-Gated Capture)

Unlike standard clicking games, **you cannot capture a firefly without using your voice first.** Vocalization is the absolute key to unlocking the capture grid.

* **Step 1: Vocal Resonant Control (Unlock & Slow)**
  * Vocalize a sustained **"Ooh"** sound to target the cool-colored **Moonbeams** on the **Right** side of the screen. This slows them down and unlocks their capture state.
  * Vocalize a sustained **"Eee"** sound to target the warm-colored **Sundrops** on the **Left** side of the screen. This slows them down and unlocks their capture state.
* **Step 2: The Net Strike (Mouse Click)**
  * While actively maintaining the correct vocal sound ("Ooh" for right side / "Eee" for left side), hover your net cursor over a firefly's glowing core and **Left-Click**. *If you click without making the corresponding sound, the interaction will be completely ignored.*
* **Step 3: The QTE Ritual (Spacebar)**
  * Once successfully clicked, the targeted entity will lock in place, and a *QTE Progress Bar* will float over it.
  * Precisely press the **Spacebar** when the cursor lands inside the white success zone.
  * *Success:* The corresponding counter at the top increases by 1.
  * *Failure:* Normal bugs escape back into the wild to continue flying, whereas rare entities (red fireflies, musical notes) will directly disappear.

### 3. Special Events
* **Red Firefly:** Spawns every 15 seconds. It dashes erratically at intense speeds. Catching it before its 20-second lifespan ends adds an extra **+5 seconds** to your global countdown. *Note: Red fireflies are rare entities and are completely exempted from user voice-gating; you can click and capture them immediately without vocalizing.*
* **Frozen Side:** Every 30 seconds, a randomized screen hemisphere will be frozen (`frozen.png`) for a fixed 5-second duration. During a freeze, **all interactions in that area are disabled**, your net cursor will be completely hidden, and entities inside cannot be captured.
* **Silver Note:** Spawns once per game between the 20s and 90s mark. Catching it triggers a 15-second ECG event. The forest music shifts to a dynamic beat, the red firefly and ice countdowns are completely frozen, and all fireflies form two rows—entering from the left and right sides respectively—to perform an **ECG wave-like flight pattern**. During this time, the mouse click hitbox radius will expand significantly to 44 pixels—be sure to exploit this perfect window to clear your capture tasks! *Note: The silver note is completely exempted from user voice-gating; it can be clicked and captured immediately without vocalizing.*

### 4. Resets & Session Refreshing
* At any point during gameplay, you can click **"The Star Keeper"** button on the top-center UI to immediately wipe active states, regenerate random targets, and reset the 120-second game time.
* Upon entering a win/loss screen, click the **"Restart"** button to safely return to the main menu.