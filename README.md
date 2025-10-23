🧠 101Monkeys
A bioadaptive pacing companion that uses audio-visual guidance and Augmented Reality to help you prevent crashes and reclaim your life from chronic illness.

This is not a "health tracker" or a simple "audio app." It is an adaptive intervention platform that delivers personalized Chair Yoga and breathing exercises through a unique combination of computer vision, AR, and audio. The AR display, with its target pose "ghost" and real-time alignment feedback, is a core component of the intervention. The audio guides what to do; the AR shows how to align.

For our users, the underlying complexity is hidden. Their only job is to press "play" and follow the synchronized audio-visual guidance, which is dynamically adapted to their body's real-time needs.

## 1. The Core Problem: A "Life Hijacked"
This project is built on a deep understanding of our core users: the "shut-in" populations with ME/CFS (Myalgic Encephalomyelitis/Chronic Fatigue Syndrome) and Dysautonomia.

Based on our research, the core problem is not just the physiological symptom of Post-Exertional Malaise (PEM). The real, unmet need is the profound human crisis that follows:

*   **A "Lost Self"**: A devastating sense of grief for the life, career, and identity that was "hijacked" by the illness.
*   **Profound Isolation**: The "doubly invisible" nature of the illness leads to medical gaslighting, social isolation, and the loss of community.
*   **The Burden of Pacing**: Pacing is the only survival tool, but it's a double-edged sword. It demands a constant, "exhausting mental calculus" that reinforces the "sick role" and makes it "virtually impossible to stay fully present."

A simple "energy tracker" fails because it worsens this problem. It's a "cold calculator" that can increase self-blame ("you failed your energy budget") and reinforce the user's identity as a "manager of their illness" rather than a participant in life.

## 2. Our Solution: The Empathetic Companion
Our philosophy is the "No-Dashboard Mandate." We are an intervention, not an analyzer. The user's entire experience is built around the synchronized audio-visual engine.

Our core loop is: **Sense ➔ Evaluate ➔ Adapt ➔ Intervene.**

*   **Sense**: Our full sensor stack runs a real-time analysis of the user's `F_t` vector.
*   **Evaluate & Adapt**: The `decision_engine` feeds this `F_t` into the `Pacer_Model` to predict the best next step, dynamically adapting the protocol.
*   **Intervene**: The `audio_engine` and `ar_renderer` deliver the selected audio-visual instruction.

The "empathetic UI" is the combination of a calm, meditative voice and clear, non-judgmental visual feedback that delivers the right intervention at the right time.

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
This is the full inventory of all features extracted on-device.

*   **[HUB 1]: Front Camera (RGB / PPG / IR)**
    *   `z(RMSSD)`, `z(ΔRMSSD)`: Vagal Tone (State & Trend).
    *   `PV_sequence`, `z(ΔPV)`: Sympathetic Arousal (State & Trend).
    *   `z(GazeStability)`, `z(BlinkRate)`: Cognitive Adherence & Fatigue.
    *   `z(MicroExpression_Trigger)`, `z(Thermal_sequence)`: The "Flinch" signals.
*   **[HUB 2]: Microphone**
    *   `z(RespVar)`, `z(RespRate - RF)`: Coherence & Protocol Adherence.
*   **[HUB 3]: RF (Wi-Fi/Radar)**
    *   `z(RF_RespRate)`, `z(RF_Bracing)`: Passive Respiration & Motor "Flinch".
*   **[HUB 4]: User Input**
    *   `z(Fatigue)`: Subjective fatigue score.
*   **[HUB 5]: Internal Models (On-Device)**
    *   **The sEDA_Model**: Fuses `PV_sequence` + `Thermal_sequence` into `z(sEDA)`, a high-fidelity sympathetic arousal signal.

### Layer 5: The Core Engine (The Pacer_Model)
This is the main GRU/Transformer model that runs on-device.

*   **Target Variable (Y_actual)**: The clinically-defined "Successful Safe Shift": `Y = 1` if (`RMSSDΔ z-score > +0.5`) AND (`PV_complexity z-score < +1.5`).
*   **Input (F_t)**: The final, fully-fused, and hardened Feature Vector from Layer 4.
*   **Adaptive Sequencing Logic (The Core Loop)**: The `Pacer_Model` is not used just once per session. It operates within a continuous feedback loop managed by `decision_engine.js`.
    1.  An initial protocol/pose is selected based on the user's starting state (`F_t`).
    2.  As the user performs the audio-visual instruction, the `sensor_engine` captures real-time physiological response and adherence (`PoseAdherence`, `MovementQuality`).
    3.  This updated `F_t` is fed back into the `Pacer_Model` before the next instruction.
    4.  The model predicts the likely success (U-score) of potential next poses/cues.
    5.  The `decision_engine` selects the optimal next step, which may dynamically override the original plan to ensure safety and efficacy (e.g., switching to a restorative pose if stress is detected).
    6.  This **Sense -> Evaluate -> Adapt -> Intervene** loop repeats every few seconds throughout the session, creating a truly bioadaptive experience.

### Layer 6: The Coherence Facilitation Platform (The Product)
This is the audio-visual application layer that serves our Dual Mission.

*   **A. The "Audio-Visual" Engine (`app/js/audio_engine.js` + `ar_renderer.js`)**:
    *   This is the **user-facing product**. It delivers **synchronized audio and visual guidance**. It is *not* a dashboard.
    *   **Primary Modality (Audio):** An adaptive audio player delivering guided Chair Yoga + Breathing protocols.
    *   **Complementary Modality (Visual AR Feedback):** Provides glanceable, intuitive, visual confirmation of pose alignment via a real-time, color-coded AR skeleton overlay. The audio guides *what* to do; the AR shows *how* to align.

*   **B. 🧘‍♂️ Chair Yoga Pose Library**:
    *   This library defines the fundamental building blocks for the adaptive interventions. Each pose requires synchronized assets for both the `audio_engine` and the `ar_renderer`.
    *   **Asset Requirements Per Pose:**
        1.  **Audio Instruction (.mp3):** A calm audio segment guiding the user.
        2.  **Target Pose Skeleton (`target_poses.js`):** Defines the canonical keypoint coordinates for the pose "ghost".
    *   **Pose Categories:**
        *   **Grounding / Centering:** Seated Mountain, Neck Rolls, etc.
        *   **Mobilizing / Energizing:** Seated Cat-Cow, Spinal Twist, etc.
        *   **Restorative / Release:** Supported Forward Fold, Chair Savasana, etc.

*   **C. The Research & Human-Centered Features**:
    *   **Research Protocol (CEP):** A falsifiable, in-app test for the "Flinch" hypothesis.
    *   **Private Journal & Connection Module:** Optional, on-device features to address the "lost self" and isolation.

## 7. 📚 Project Documentation (The Saga of Context)
The strategic, market, and user research that forms the "Saga of Context" for this project is maintained in the `/docs` directory.

*   `./docs/PMR_Market_Validation.md`: Validates the market for a PEM-prevention tool for ME/CFS and confirms our user personas.
*   `./docs/PMR_Human_Centered_Critique.md`: Introduces the *real* user problem: the "lost self," grief, and isolation.
*   **`./docs/THEORETICAL_FRAMEWORK_DETAILED.md`**: This internal document provides the **detailed scientific and theoretical background** (Vagus Nerve, Stargate/Psi, JD/Coherence, Kundalini) that informs our architecture.

## 8. 🚀 Future Vision: Towards Wearable AR
While the current MVP is designed for smartphones (PWA), the long-term vision for the AR/CV component is integration with wearable AR glasses. This would provide a truly seamless, hands-free experience where the user could perform the Chair Yoga while seeing the target pose "ghost" and their own alignment feedback reflected in a mirror or overlaid onto their environment. The current architecture, using on-device CV and rendering, is designed with this future portability in mind.

## 9. ⚖️ License
MIT © 2025 101Monkeys Lab

*Disclaimer: This is a research and wellness platform. It makes no medical claims and is not a substitute for professional medical advice, diagnosis, or treatment.*
