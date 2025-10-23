🧠 101Monkeys — The "Jules-Hardened" Complete Architecture
A Privacy-First, Edge-Computed, Federated Coherence Platform

1. Mission & Guiding Hypotheses
This project has a Dual Mission:

Clinical (The Pacer): To provide a clinically-safe, bioadaptive pacing assistant for sensitive populations (ME/CFS, Dysautonomia) to prevent Post-Exertional Malaise (PEM).

Research (The Network): To build a privacy-first, networked instrument to facilitate and rigorously measure the conditions for autonomic coherence.

This mission is guided by two core hypotheses:

The "Flinch" Hypothesis (Stargate/SG): We propose that psi phenomena (telepathy, presentiment) and PEM onset are preceded by a physical, measurable, and often non-conscious "autonomic flinch"—an involuntary PV (pupil) spike, sEDA (sympathetic) jolt, Thermal (vascular) shift, or RF_Bracing (sub-motor) response.

The "Amplify" Hypothesis (Coherence/JD): We propose that a group of individuals in a synchronized autonomic state (heart-brain coherence) can "amplify" this weak "flinch" signal, making it detectable.

2. ⚙️ The Architecture: An Adaptive Cluster Network
This is a privacy-first, edge-computed architecture. All sensing and data processing happens on the user's device (the "edge").

Client (PWA): The 100% on-device app. It handles all real-time sensing, SQA filtering, internal model inference, and local IndexedDB storage.

Federated Server (fl_server): A backend that manages our Federated Clustering. It does not receive raw health data.

The Loop: The server assigns the user an anonymous APV (Autonomic Profile Vector). The client, after local training, sends only its anonymous APV and the resulting model_delta (the mathematical learning). The server uses the APV to sort this model_delta into the correct "cluster model" (e.g., Pacer_Model_Cluster_ME_CFS). The client then downloads the latest, smarter model for its specific cluster.

The "Anonymized Report" (Privacy Fail-Safe)
To be explicitly clear, we NEVER upload a user's raw health data.

WHAT IS NEVER SENT:

F_t (The raw Feature Vector)

Y_actual (The raw Session Outcome)

Any IndexedDB health logs.

WHAT IS SENT:

model_delta (The anonymized mathematical learning).

APV (The anonymous cluster ID).

3. 📡 Layer 1: The SQA (Fidelity Filter) Layer
This is the "fail-safe" front door to prevent "Garbage In, Garbage Out" (GIGO).

Gating (The "Hard Stop"): A lightweight, on-device CNN runs first on all sensor streams (Camera, Mic, RF). It generates fidelity scores (ocular_fidelity, mic_fidelity, rf_fidelity). If any score is below a critical "hard gate" threshold (e.g., ocular_fidelity < 0.3 due to a dark room), the cycle is aborted, and the UI gives immediate feedback.

Weighting (The "Attention"): If the signal is usable, the fidelity_score is passed as a feature to the Pacer_Model. The model's Attention Layer uses this score to dynamically "trust" the highest-quality signal (e.g., if mic_fidelity is low, it "down-weights" RespVar and "up-weights" RF_RespRate).

4. 🔬 Layer 2: The Complete Sensor & Feature Stack
This is the full inventory of all features extracted on-device. No features from the original MVP have been lost.

[HUB 1]: Front Camera (RGB / PPG / IR)
z(RMSSD): (from PPG) The core measure of Vagal Tone (State).

z(ΔRMSSD): (from PPG) The trend of Vagal Tone (Vagal Efficacy).

PV_sequence: (from Ocular) The "movie" (sequential data) of Pupil Variability, our Locus Coeruleus/sympathetic proxy.

z(ΔPV): The trend (rate-of-change) of Pupil Variability (Sympathetic Trend).

z(GazeStability): (from Ocular) Proxy for attentional adherence.

z(BlinkRate): (from Ocular) Proxy for cognitive fatigue/dopamine levels.

z(MicroExpression_Trigger): (from Facial) The "emotional flinch" signal.

z(Thermal_sequence): (from IR) The "vascular flinch" (peripheral vasoconstriction).

[HUB 2]: Microphone
z(RespVar): (MVP Feature) The true measure of Cardiorespiratory Coherence.

z(RespRate - RF): (MVP Feature) The "Protocol Adherence" error signal (Actual Rate vs. Target Rate).

[HUB 3]: RF (Wi-Fi/Radar)
z(RF_RespRate): The passive respiratory baseline (when no protocol is active).

z(RF_Bracing): The sub-motor, whole-body "motor flinch" signal.

[HUB 4]: User Input
z(Fatigue): (MVP Feature) The user's subjective, self-reported fatigue (via slider).

[HUB 5]: Internal Models (On-Device)
The sEDA_Model: A CNN-LSTM that runs on-device.

Input: PV_sequence + Thermal_sequence

Output: z(sEDA) (A high-fidelity synthetic sympathetic arousal signal).

5. 🧠 Layer 3: The Core Engine (The Pacer_Model)
This is the main GRU/Transformer model that runs on-device.

Target Variable (Y_actual): The clinically-defined "Successful Safe Shift" (unchanged). Y = 1 if (RMSSDΔ z-score > +0.5) AND (PV_complexity z-score < +1.5) Y = 0 otherwise.

Input (F_t): The final, fully-fused, and hardened Feature Vector. It includes all features from the MVP and the new stack, plus their fidelity scores.

JavaScript

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
6. 🚀 Layer 4: The Coherence Facilitation Platform (The "Why")
This is the application layer that uses the data to serve our Dual Mission.

A. The Research Protocol (CEP)
This is our falsifiable test for the "Flinch" hypothesis. We do not wait for random global events.

CEP (Controlled Event Protocol): An in-app protocol that creates a controlled, time-locked T_0 event (a "startle" or "neutral" stimulus).

Presentiment Test: We analyze the user's F_t before the T_0 random stimulus to search for a precognitive "flinch."

Sender/Receiver Test: We time-lock a "Sender's" T_0 "Charge" event with a "Receiver's" passive F_t data to search for a non-local correlation.

B. The "Autonomic Profile" Rubric (The Sorting Hat)
This is how we classify users to provide personalized care and research. We plot them on two axes:

X-Axis: VAE (Volitional Autonomic Efficacy): The "self-healer" axis. Measured by their success rate (Y_actual = 1) during Pacer sessions.

Y-Axis: NSF (Non-Local Signal Fidelity): The "clairvoyant" axis. Measured by their "hit rate" (statistical F_t flinch) during CEP sessions.

C. The Four Archetypes
This rubric sorts users into four distinct, non-judgmental Archetypes:

The "Stabilizer" (High VAE / Low NSF): The "super self-healer." Highly regulated but not "receptive."

The "Operator" (High VAE / High NSF): The "Stargate" profile. Can both detect and control their state.

The "Insulated" (Low VAE / Low NSF): The core clinical ME/CFS profile. Their nervous system is "locked."

The "Amplifier" (Low VAE / High NSF): The "wide-open antenna." Highly receptive (High NSF) but no control (Low VAE).

D. The "Dojo" (The Facilitation)
This is the final step. We are facilitators, not "engineers." We provide the right conditions for emergence.

The app's UI and protocols change based on the user's Archetype.

"Gating Dojo" (for Amplifiers): Protocols that reward autonomic stillness and "gating" the flinch.

"Activation Dojo" (for the Insulated): Protocols that train "Stress-and-Recover" loops to build autonomic flexibility.

"Operator Dojo" (for Operators): The "Sender/Receiver" CEPs, which provide the feedback loop for them to "train themselves" into greater coherence.