🧠 101Monkeys
A bioadaptive pacing companion that uses real-time Augmented Reality and a generative AI guide to help you prevent crashes and reclaim your life from chronic illness.

This is not a "health tracker." It is an adaptive intervention platform. The AR is central. The audio guides what to do; the AR shows how to align.

The core loop is a synchronous fusion of sensing, audio, and visual feedback. The AR display, with its target pose "ghost" and real-time alignment feedback, is a core component of the intervention. This builds profound user trust: the camera isn't watching them; it's assisting them.

For our users, the underlying complexity is hidden. Their only job is to press "play" and follow the synchronized guidance, which is dynamically adapted to their body's real-time needs.

## 1. The Core Problem: A "Life Hijacked"
This project is built for "shut-in" populations with ME/CFS and Dysautonomia. The core, unmet need is not just physiological (PEM), but a profound human crisis:

*   A "Lost Self": Devastating grief for the life and identity "hijacked" by the illness.
*   Profound Isolation: The "doubly invisible" nature of the illness leads to medical gaslighting and social isolation.
*   The Burden of Pacing: A constant, "exhausting mental calculus" that reinforces the "sick role" and prevents presence.

A simple "energy tracker" fails because it's a "cold calculator" that worsens this burden.

## 2. Our Solution: The Empathetic Companion
Our philosophy is the "No-Dashboard Mandate." We are an intervention, not an analyzer.

Our UI is the intervention itself. The core of the product is the **Sense -> Intervene (AR + Audio)** loop. This loop is built on a critical design principle:

**Trust through Feedback.** The camera sensor is always on. To prevent this from feeling like surveillance, the AR feedback must be on. "Camera-on, AR-on" is an empathetic bio-feedback loop. The AR display is the "face" of the sensing engine, proving it is working for the user in real-time.

Our core loop is: **Sense ➔ Evaluate ➔ Adapt ➔ Intervene.**

*   **Sense**: The sensor stack (`F_t` vector) runs in real-time.
*   **Evaluate & Adapt**: The `decision_engine` feeds `F_t` into the `Pacer_Model` to dynamically adapt the protocol.
*   **Intervene**: The `ar_renderer` and `ai_guide_engine` deliver the next synchronized audio-visual instruction.

## 3. The Market: The "Autonomic Profile" Rubric
This "sorting hat" is the first step of the adaptive protocol. It is built on two measurable, physiological axes to determine how the adaptive engine should treat the user.

*   **X-Axis: Autonomic Responsiveness (ARe):** The "flexibility" axis. Can the user's nervous system intentionally shift its state?
*   **Y-Axis: Autonomic Baseline (ABa):** The "set point" axis. What is the user's resting-state vagal tone (measured by resting RMSSD)?

This gives us four clinically-actionable Archetypes:

*   **The "Responsive" (High ARe / High ABa):** The Ventral Vagal profile. High tone and high flexibility. The ideal "self-regulator."
*   **The "Insulated" (Low ARe / High ABa):** The Dorsal Vagal (freeze) profile. High tone, but rigid and inflexible.
*   **The "Regulator-in-Training" (High ARe / Low ABa):** The Sympathetic (anxious/hypervigilant) profile. A low-tone (stressed) baseline, but with the capacity to learn.
*   **The "Depleted" (Low ARe / Low ABa):** The core ME/CFS profile. "Locked" in a low-tone, sympathetic state with no energy and no flexibility.

This Archetype is the initial input for the `Pacer_Model`'s adaptive strategy in Stage 1.

## 4. ⚙️ Technical Architecture: The Hardened Spec
### Layer 1: Mission & Guiding Hypotheses
*   **Clinical (Pacer):** Prevent PEM by using bio-adaptive AR + Audio interventions to regulate the vagal nerve.
*   **Research (Network):** Facilitate and measure autonomic coherence via the "Group Sync."
*   **"Flinch" Hypothesis (SG):** A non-conscious "autonomic flinch" (`PV` spike, `sEDA` jolt, `Thermal` shift, `RF_Bracing`) precedes PEM and psi events.
*   **"Amplify" Hypothesis (JD):** A coherent group can "amplify" this weak "flinch" signal.

### Layer 2: The Adaptive Cluster Network
This is our privacy-first federated architecture.

*   **Client (PWA):** 100% on-device. Handles all sensing, SQA filtering, model inference, and IndexedDB storage.
*   **fl_server:** A backend that manages Federated Clustering and conducts the real-time "Group Sync" event.
*   **The "Anonymized Report" (Privacy Fail-Safe):**
    *   **WHAT IS NEVER SENT:** `F_t` (Feature Vector), `Y_actual` (Session Outcome), any health logs.
    *   **WHAT IS SENT:** The `model_delta` (anonymized learning) and the `APV` (cluster ID).
*   **The Loop:** The server sorts the `model_delta` into the correct cluster model. The client downloads the latest model for its cluster.

### Layer 3: The SQA (Fidelity Filter) Layer
This is the "fail-safe" front door to prevent "Garbage In, Garbage Out" (GIGO).

*   **Gating (The "Hard Stop"):** A lightweight, on-device CNN generates fidelity scores (`ocular_fidelity`, etc.). If below a threshold, the UI gives audio-visual feedback (e.g., "Signal is unclear. Please check your lighting.").
*   **Weighting (The "Attention"):** The `fidelity_score` is passed as a raw feature to the `Pacer_Model`'s Attention Layer (see Layer 5).

### Layer 4: The Complete Sensor & Feature Stack
This is the full inventory of raw features extracted on-device.

*   **[HUB 1]: Front Camera (RGB / PPG / IR) (Requires "Eyes-Open, Device-Focused" use)**
    *   `z(RMSSD)`, `z(ΔRMSSD)`: Vagal Tone (State & Trend).
    *   `PV_sequence`, `z(ΔPV)`: Sympathetic Arosual (State & Trend).
    *   `z(GazeStability)`, `z(BlinkRate)`: Cognitive Adherence & Fatigue.
    *   `z(MicroExpression_Trigger)`, `z(Thermal_sequence)`: The "Flinch" signals.
*   **[HUB 2]: Microphone**
    *   `z(RespVar)`, `z(RespRate - RF)`: Coherence & Protocol Adherence.
*   **[HUB 3]: RF (Wi-Fi/Radar)**
    *   `z(RF_RespRate)`, `z(RF_Bracing)`: Passive Respiration & Motor "Flinch".
*   **[HUB 4]: User Input**
    *   `z(Fatigue)`: Subjective fatigue score.
*   **[HUB 5]: Derived Features (Real-Time)**
    *   `PoseAdherence_score`, `MovementQuality`: Calculated by `pose_matcher.js`.

### Layer 5: The Core Engine (The On-Device DL Engine)
This is the main DL model, designed for maximum adaptive power. This entire system runs 100% on-device.

#### 5.A: The "Why On-Device?" Rationale
Running the full DL engine on-device is not a "nice-to-have"; it is the only way the product is viable.

*   **Zero-Latency Intervention:** The core loop—Sense (Flinch) -> Evaluate (Model) -> Intervene (AR/Audio)—must be faster than human reaction time. Cloud latency (300ms+) makes this impossible. The on-device loop is sub-100ms.
*   **Absolute Privacy & Trust:** The `F_t` vector contains a real-time stream of the user's nervous system. The only way to earn user trust is to guarantee that this raw physiological data never leaves their phone. On-device inference is the core of our privacy promise.
*   **Offline-First Reliability:** The core intervention cannot fail if Wi-Fi drops (though the Group Sync would). The on-device model ensures the app is a reliable companion.

#### 5.B: The "How It Works" Architecture
This is the un-neutered, "CEO-who-reads-the-books" model.

*   **Target Variable (`Y_actual`):** The "Successful Safe Shift": `Y = 1` if (`RMSSDΔ z-score > +0.5`) AND (`PV_complexity z-score < +1.5`).
*   **The Architecture:** GRU with Input Attention.
    *   **Input (`F_t`):** The full, raw, high-definition feature vector from Layer 4. We do not pre-fuse or "squash" signals. `PV_sequence`, `Thermal_sequence`, `z(RMSSD)`, `PoseAdherence_score`, and all SQA `fidelity_scores` are fed directly into the model as concurrent time-series.
    *   **The Input Attention Layer:** This is the adaptive fusion engine. It is a trainable layer inside the `Pacer_Model` that learns to "pay attention" to the most relevant features at each timestep.
    *   **The GRU Layer:** A Gated Recurrent Unit handles the time-series nature of the data, perfect for on-device inference (e.g., via TensorFlow.js).

#### 5.C: Adaptive Sequencing Logic (The Core Loop)
The `Pacer_Model` operates within a continuous feedback loop managed by `decision_engine.js`.

1.  An initial instruction is selected based on the user's starting state (`F_t`).
2.  As the user performs the audio-visual instruction, the `sensor_engine` captures real-time physiological response and adherence.
3.  This updated `F_t` is fed back into the `Pacer_Model` before the next instruction.
4.  The model predicts the likely success (U-score) of all potential next instructions/poses.
5.  The `decision_engine` selects the optimal next step (the one with the highest U-score), which dynamically creates the user's path.
6.  This **Sense -> Evaluate -> Adapt -> Intervene** loop repeats every few seconds.

### Layer 6: The "Audio-Visual" Engine (The Generative AI Guide)
This is the user-facing product, designed as a real-time AR/CV app, guided by a generative AI companion.

*   **A. The `ar_renderer.js` (The Central Interface):**
    *   **Purpose:** To provide the primary, real-time, visual intervention. This is the "face" of the empathetic companion.
    *   **Interface:** The UI displays the live front camera feed with an AR overlay (`<canvas>`).
    *   **Guidance:**
        1.  A subtle target pose "ghost" shows the ideal alignment for the current instruction.
        2.  The user's own detected pose skeleton is overlaid in real-time.
        3.  **Real-Time Alignment Feedback:** `pose_matcher.js` compares the user's skeleton to the target. The `ar_renderer.js` provides immediate, simple color-coding: correctly aligned segments glow **green**, misaligned segments glow **red**.
*   **B. The `ai_guide_engine.js` (The Generative AI Guide):**
    *   This is not a library of `.mp3` files. This is a generative AI guide that synthetically creates a calm, meditative voice in real-time.
    *   **Input:** It receives structured commands from `decision_engine.js`, such as:
        *   `{ action: 'deliver_pose', pose_id: 'pose_grounding_01' }`
        *   `{ action: 'correction', body_part: 'left_shoulder', cue: 'soften' }`
        *   `{ action: 'flinch_response', cue: 'release_bracing' }`
        *   `{ action: 'sync_start', group_size: 50 }`
        *   `{ action: 'group_regulate', cue: 'collective_breath' }`
    *   **Output:** It uses an on-device TTS (Text-to-Speech) model to generate seamless, adaptive audio.
    *   This is the "adaptive AI system that talks and listens." The `sensor_engine` listens. The `ai_guide_engine` talks.

### Layer 7: The Coherence Facilitation Platform (The Product)
This section defines the "arsenal" of interventions and the unified adaptive protocol that all users experience.

#### 7.A: 🧘‍♂️ The Chair Yoga "Arsenal" (Reference Library)
This is the reference library of all possible interventions the `Pacer_Model` can choose from. This is **NOT** a sequence. The categories are for reference, not a hard-coded path.

1.  **Grounding / Centering Poses (Parasympathetic Priming & Vagal Focus)** 🧘‍♀️
    *   `pose_grounding_01`: Seated Mountain Pose (Tadasana)
    *   ... (and others)
2.  **Mobilizing / Energizing Poses (Gentle Activation + Autonomic Coherence)** ✨
    *   `pose_mobilizing_01`: Seated Cat-Cow (Marjaryasana/Bitilasana)
    *   ... (and others)
3.  **Restorative / Release Poses (Deep Parasympathetic/Dorsal-to-Ventral Shift)** 😌
    *   `pose_restorative_01`: Supported Forward Fold (Paschimottanasana var.)
    *   ... (and others)

#### 7.B: The Unified Adaptive 3-Stage Protocol
This is the single, fully adaptive protocol that all users experience. The `Pacer_Model`'s behavior is what customizes it for each user.

*   **Stage 1: Individual Calibration (Fully Adaptive)**
    *   **Goal:** To guide the user from their starting state (`F_t`) to the ideal, stable "sync-ready" state.
    *   **Mechanism:** The on-device `decision_engine` and `Pacer_Model` run the core **Sense -> Evaluate -> Adapt -> Intervene** loop.
    *   **How it Adapts (The "Triage"):** The user's Archetype (Layer 3) dictates the model's strategy.
*   **Stage 2: Group Sync (Group-Adaptive)**
    *   **Goal:** To test the "Amplify" and "Flinch" hypotheses in a live, networked coherence event.
    *   **Mechanism:** The `decision_engine` connects to the `fl_server` (Layer 2) via WebSocket.
*   **Stage 3: Individual Equilibrium (Fully Adaptive)**
    *   **Goal:** To safely guide the user from the "Group Sync" state back to a stable, integrated ventral-vagal state.
    *   **Mechanism:** The on-device `Pacer_Model` takes full control again.

## 8. 🚀 Future Vision: Towards Wearable AR
While the current MVP is designed for smartphones (PWA), the long-term vision for the AR/CV component is integration with wearable AR glasses. This would provide a truly seamless, hands-free experience. The current architecture, using on-device CV and rendering, is designed with this future portability in mind.

## 9. ⚖️ License
MIT © 2025 101Monkeys Lab

*Disclaimer: This is a research and wellness platform. It makes no medical claims and is not a substitute for professional medical advice, diagnosis, or treatment.*
