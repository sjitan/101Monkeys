🧠 101Monkeys
An audio-first, bioadaptive pacing companion that helps you prevent crashes and reclaim your life from chronic illness.

This is not a "health tracker" or an "energy dashboard." It is an adaptive intervention platform designed to do one thing: reduce the cognitive load of being sick.

For our users, their F_t vector, their "flinch" data, and their "energy score" are meaningless. That's our data to manage the feedback loop. The user's only job is to press "play" and follow the guided audio protocol—a calm, meditative voice that delivers the exact chair yoga or breathing exercise their body needs, right when it needs it.

## 1. The Core Problem: A "Life Hijacked"
This project is built on a deep understanding of our core users: the "shut-in" populations with ME/CFS (Myalgic Encephalomyelitis/Chronic Fatigue Syndrome) and Dysautonomia.

Based on our research, the core problem is not just the physiological symptom of Post-Exertional Malaise (PEM). The real, unmet need is the profound human crisis that follows:

*   **A "Lost Self"**: A devastating sense of grief for the life, career, and identity that was "hijacked" by the illness.
*   **Profound Isolation**: The "doubly invisible" nature of the illness leads to medical gaslighting, social isolation, and the loss of community.
*   **The Burden of Pacing**: Pacing is the only survival tool, but it's a double-edged sword. It demands a constant, "exhausting mental calculus" that reinforces the "sick role" and makes it "virtually impossible to stay fully present."

A simple "energy tracker" fails because it worsens this problem. It's a "cold calculator" that can increase self-blame ("you failed your energy budget") and reinforce the user's identity as a "manager of their illness" rather than a participant in life.

## 2. Our Solution: The "Audio-First" Companion
Our philosophy is the "No-Dashboard Mandate." We are an intervention, not an analyzer.

The user's entire experience is built around the `app/js/audio_engine.js`. This is the product.

Our core loop is: **Sense ➔ Triage ➔ Intervene.**

*   **Sense**: Our full sensor stack (Layer 3) runs a real-time analysis of the user's `F_t` vector (their complete physiological state).
*   **Triage**: Our "Triage Component" (Layer 4) instantly analyzes this `F_t` data against the user's assigned "Archetype." It makes a decision (e.g., "This is an Amplifier in a high-stress state").
*   **Intervene**: The Triage Component calls the `audio_engine`, which plays the exact guided protocol needed (e.g., `audio_engine.play('gating_protocol_02_10min.mp3')`).

The "empathetic UI" is not a set of well-worded alerts. It is the calm, meditative, human voice delivering the right intervention at the right time.

## 3. The Market: The "Autonomic Profile" Rubric
Our entire architecture is built to serve the unique, non-monolithic needs of our clinical market. We classify users on two performance-based axes to determine their "Archetype." This is our "sorting hat" for the whole platform.

*   **X-Axis: VAE (Volitional Autonomic Efficacy)**: The "self-healer" axis. Can they intentionally regulate their ANS? (Measured by `Y_actual = 1` success rate in Pacer sessions).
*   **Y-Axis: NSF (Non-Local Signal Fidelity)**: The "clairvoyant" axis. Is their nervous system a "wide-open antenna"? (Measured by "hit rate" of `F_t` flinches during CEP sessions).

This gives us our four user Archetypes:

*   **The "Stabilizer" (High VAE / Low NSF)**: The "super self-healer." Highly regulated.
*   **The "Operator" (High VAE / High NSF)**: The "Stargate" profile. Can both detect and control their state. This is our opt-in research cohort.
*   **The "Insulated" (Low VAE / Low NSF)**: The core clinical ME/CFS profile. Their nervous system is "locked."
*   **The "Amplifier" (Low VAE / High NSF)**: Our most vulnerable user. A "wide-open antenna" with no control, leading to autonomic chaos.

## 4. ⚙️ Technical Architecture: The "Jules-Hardened" Spec
This is the complete, federated, edge-first architecture that powers the platform.

### Layer 1: Mission & Guiding Hypotheses
*   **Clinical (Pacer)**: Prevent PEM for ME/CFS & Dysautonomia populations.
*   **Research (Network)**: Facilitate and measure autonomic coherence.
*   **"Flinch" Hypothesis (SG)**: A non-conscious "autonomic flinch" (PV spike, sEDA jolt, Thermal shift, RF_Bracing) precedes PEM and psi events.
*   **"Amplify" Hypothesis (JD)**: A coherent group can "amplify" this weak "flinch" signal.

### Layer 2: The Adaptive Cluster Network
This is our privacy-first federated architecture.

*   **Client (PWA)**: 100% on-device. Handles all sensing, SQA filtering, model inference, and IndexedDB storage.
*   **fl_server**: A backend that manages Federated Clustering. It does not receive raw health data.
*   **The "Anonymized Report" (Privacy Fail-Safe)**:
    *   **WHAT IS NEVER SENT**: `F_t` (Feature Vector), `Y_actual` (Session Outcome), any health logs.
    *   **WHAT IS SENT**: The `model_delta` (the anonymized mathematical learning) and the `APV` (the anonymous cluster ID).
*   **The Loop**: The server sorts the `model_delta` into the correct "cluster model" using the `APV`. The client downloads the latest, smarter model for its specific cluster (e.g., `Pacer_Model_Cluster_Amplifier`).

### Layer 3: The SQA (Fidelity Filter) Layer
This is the "fail-safe" front door to prevent "Garbage In, Garbage Out" (GIGO).

*   **Gating (The "Hard Stop")**: A lightweight, on-device CNN runs first on all sensor streams (Camera, Mic, RF). It generates fidelity scores (`ocular_fidelity`, `mic_fidelity`, `rf_fidelity`). If any score is below a critical "hard gate" threshold, the cycle is aborted, and the UI gives audio feedback (e.g., "Signal is unclear. Please check your lighting and try again.").
*   **Weighting (The "Attention")**: If the signal is usable, the `fidelity_score` is passed as a feature to the `Pacer_Model`. The model's Attention Layer uses this score to dynamically "trust" the highest-quality signal (e.g., if `mic_fidelity` is low, it "down-weights" `RespVar` and "up-weights" `RF_RespRate`).

### Layer 4: The Complete Sensor & Feature Stack
This is the full inventory of all features extracted on-device. No features from the original MVP have been lost.

*   **[HUB 1]: Front Camera (RGB / PPG / IR)**
    *   `z(RMSSD)`: (from PPG) The core measure of Vagal Tone (State).
    *   `z(ΔRMSSD)`: (from PPG) The trend of Vagal Tone (Vagal Efficacy).
    *   `PV_sequence`: (from Ocular) The "movie" (sequential data) of Pupil Variability, our Locus Coeruleus/sympathetic proxy.
    *   `z(ΔPV)`: The trend (rate-of-change) of Pupil Variability (Sympathetic Trend).
    *   `z(GazeStability)`: (from Ocular) Proxy for attentional adherence.
    *   `z(BlinkRate)`: (from Ocular) Proxy for cognitive fatigue/dopamine levels.
    *   `z(MicroExpression_Trigger)`: (from Facial) The "emotional flinch" signal.
    *   `z(Thermal_sequence)`: (from IR) The "vascular flinch" (peripheral vasoconstriction).
*   **[HUB 2]: Microphone**
    *   `z(RespVar)`: (MVP Feature) The true measure of Cardiorespiratory Coherence.
    *   `z(RespRate - RF)`: (MVP Feature) The "Protocol Adherence" error signal (Actual Rate vs. Target Rate).
*   **[HUB 3]: RF (Wi-Fi/Radar)**
    *   `z(RF_RespRate)`: The passive respiratory baseline (when no protocol is active).
    *   `z(RF_Bracing)`: The sub-motor, whole-body "motor flinch" signal.
*   **[HUB 4]: User Input**
    *   `z(Fatigue)`: (MVP Feature) The user's subjective, self-reported fatigue (via slider).
*   **[HUB 5]: Internal Models (On-Device)**
    *   **The sEDA_Model**: A CNN-LSTM that runs on-device.
        *   **Input**: `PV_sequence` + `Thermal_sequence`
        *   **Output**: `z(sEDA)` (A high-fidelity synthetic sympathetic arousal signal).

### Layer 5: The Core Engine (The Pacer_Model)
This is the main GRU/Transformer model that runs on-device.

*   **Target Variable (Y_actual)**: The clinically-defined "Successful Safe Shift" (unchanged).
    *   `Y = 1` if (`RMSSDΔ z-score > +0.5`) AND (`PV_complexity z-score < +1.5`)
    *   `Y = 0` otherwise.
*   **Input (F_t)**: The final, fully-fused, and hardened Feature Vector.

```javascript
// The F_t vector fed into the Pacer_Model
F_t = [
  // === Fidelity Weights (from SQA Layer) ===
  ocular_fidelity,
  mic_fidelity,
  rf_fidelity,

  // === Vagal (Heart) (from Camera) ===
  z(RMSSD),
  z(ΔRMSSD),

  // === Sympathetic (Arousal) ===
  z(PV_sequence),      // (from Camera)
  z(ΔPV),            // (from Camera)
  z(Thermal_sequence), // (from Camera IR)
  z(sEDA),           // (from Internal sEDA_Model)

  // === Motor "Flinch" ===
  z(RF_Bracing),              // (from RF)
  z(MicroExpression_Trigger), // (from Camera)

  // === Respiratory (Coherence & Adherence) ===
  z(RespVar),        // (from Mic)
  z(RespRate - RF),  // (from Mic, MVP Feature)
  z(RF_RespRate),    // (from RF)

  // === Cognitive (Fatigue & Adherence) ===
  z(GazeStability), // (from Camera)
  z(BlinkRate),     // (from Camera)
  z(Fatigue)        // (from User Input, MVP Feature)
]
```
### Layer 6: The Coherence Facilitation Platform (The "Dojo")
This is the "Audio-First" application layer that serves our Dual Mission.

*   **A. The "Dojo Audio Engine" (`app/js/audio_engine.js`)**:
    *   This is the user-facing product. It is not a dashboard.
    *   It's an adaptive audio player containing libraries of "nice voice, almost meditative" guided chair yoga and breathing protocols.
    *   The `decision_engine` (our "Triage Component") analyzes the user's Archetype + real-time `F_t` and plays the exact audio protocol their body needs.
*   **B. The "Dojos" (The Facilitation)**:
    *   We are facilitators, not "engineers." We provide the right conditions for emergence.
    *   The audio protocols are tailored to the user's Archetype.
    *   **"Gating Dojo" (for Amplifiers)**: Audio protocols that reward autonomic stillness and "gating" the flinch.
    *   **"Activation Dojo" (for the Insulated)**: Audio protocols that train "Stress-and-Recover" loops to build autonomic flexibility.
    *   **"Operator Dojo" (for Operators)**: The "Sender/Receiver" CEPs, which provide the audio-guided feedback loop for them to "train themselves" into greater coherence.
*   **C. The Research Protocol (CEP)**:
    *   This is our falsifiable test for the "Flinch" hypothesis.
    *   **CEP (Controlled Event Protocol)**: An in-app protocol that creates a controlled, time-locked `T_0` event (a "startle" or "neutral" stimulus).
    *   **Presentiment Test**: We analyze the user's `F_t` before the `T_0` random stimulus to search for a precognitive "flinch."
    *   **Sender/Receiver Test**: We time-lock a "Sender's" `T_0` "Charge" event with a "Receiver's" passive `F_t` data to search for a non-local correlation.
*   **D. The "Human-Centered" Features (The "Why" Revisited)**:
    *   To address the "lost self" and "isolation" from our market research, the platform also includes:
    *   **Private Journal**: An optional, 100% on-device (IndexedDB) journal module with prompts to process grief and find non-physical identity.
    *   **Connection Module**: An optional, opt-in "Buddy System" to share "small wins" or a "readiness" status with 1-3 trusted friends.

## 5. 📚 Research & Market Validation Library
The strategy for this platform is built on extensive market and user research. These documents provide the full "Saga of Context" and justification for our "Audio-First, Empathetic-Companion" approach.

*   `./docs/PMR_Market_Validation.md`: (The first "Lit Review"). This document validates the $460M+ market for a PEM-prevention tool for ME/CFS and Dysautonomia and confirms our core user personas.
*   `./docs/PMR_Human_Centered_Critique.md`: (The "Revised" Lit Review). This critical analysis introduces the real user problem: the "lost self," grief, and isolation. It provides the "why" for our pivot away from a "cold calculator" and toward an "empathetic companion."

## 6. 🚀 Project Status
*   **Phase**: 1.0 (MVP)
*   **Status**: The Jules-Hardened architecture is specified. Development is focused on implementing the SQA Layer, the sEDA_Model, and the Dojo Audio Engine as the core MVP features.
*   **Next Steps**:
    1.  Implement `app/js/sensor_engine.js` for the full `F_t` vector.
    2.  Implement `app/js/audio_engine.js` with the initial "Dojo" audio libraries.
    3.  Implement the `fl_server` for Federated Clustering.

## 7. ⚖️ License
MIT © 2025 101Monkeys Lab

*Disclaimer: This is a research and wellness platform. It makes no medical claims and is not a substitute for professional medical advice, diagnosis, or treatment.*
