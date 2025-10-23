# 🧠 101Monkeys — Jules-Ready Specification

**An On-Device, Multi-Modal, Privacy-First Bio-Pacing and Research Platform**

---

## 🎯 Mission

To deliver a clinically conservative, on-device pacing assistant that nudges the Autonomic Nervous System (ANS) toward coherence—measured, not imagined. We combine multimodal sensing (ocular, RF, synthetic EDA) with a rigorous, privacy-preserving machine learning architecture to provide real-time, personalized pacing for sensitive clinical populations (ME/CFS, Dysautonomia) while simultaneously creating a testbed for novel hypotheses on autonomic coherence.

---

## ⚙️ The Architecture: An Adaptive Cluster Network

Our system is a hybrid, edge-first architecture that uses a network of specialized, dynamically-loaded models to provide personalized and safe pacing.

1.  **Client/Edge (PWA):** The primary application runs entirely on the user's device. It handles all real-time sensing, data processing, model inference, and user-facing protocols. It operates fully offline, ensuring privacy and resilience.

2.  **Backend (AWS Lambda):** A lightweight, stateless `Cluster Assigner` service. Its sole responsibility is to assign a user to a physiological cluster based on their anonymized **Autonomic Profile Vector (APV)**. This allows the client to download the correct, specialized `Pacer_Model` for their neurotype.

3.  **Federated Learning:** The client periodically and anonymously contributes `model_delta` (the mathematical learnings from its on-device training) back to the federated server. This improves the cluster models over time without ever exposing raw user data.

---

## LAYER 1: The SQA (Fidelity Filter) & Gating

To solve the "Garbage In, Garbage Out" problem, all sensor data first passes through a two-stage Signal Quality Assurance (SQA) layer.

1.  **Gating (Go/No-Go):** A lightweight, on-device model provides a fidelity score for each sensor stream (e.g., `ocular_fidelity_score`, `rf_fidelity_score`). If the signal quality is below a critical threshold (due to poor lighting, motion blur, etc.), the processing cycle is aborted.

2.  **Weighting (Trust):** If the signal is usable, the fidelity score is passed as a feature to the main `Pacer_Model`. The model's Attention Layer learns to dynamically "trust" the highest-quality signal, down-weighting noisy inputs in real-time.

---

## THE FULL SENSOR STACK

Our platform fuses data from three distinct, on-device sensor modalities.

### 1. Wi-Fi/Radar (RF) Sensor
-   **Purpose:** Provides a passive, non-contact "true baseline" for respiration and heart rate, and detects the whole-body, sub-motor **"flinch" response** (`RF_Bracing`) with high sensitivity.
-   **Outputs:** `RF_RespRate`, `RF_Bracing`

### 2. The Internal Models -> The sEDA Model
-   **Purpose:** A synthetic Electrodermal Activity (sEDA) model that acts as our primary sympathetic nervous system proxy.
-   **Inputs:** `PV_sequence` (the "movie" of pupil variability over time) + `Thermal_sequence` (from the phone's thermal sensor).
-   **Output:** A single `sEDA_score` representing sympathetic arousal.

### 3. Ocular Sensing
-   **PupilPV:** A high-frequency measure of pupil diameter variability, acting as a proxy for sympathetic arousal (the "flinch").
-   **GazeStability:** A measure of fixation variance, acting as a proxy for attentional adherence and cognitive fatigue.

---

## THE PACER MODEL (The Core Engine)

The core of our system is a sequential deep learning model (GRU-based) that runs on-device via TensorFlow.js.

-   **Input:** A hardened, z-normalized feature vector `F_t` that fuses the multi-modal sensor data and their corresponding fidelity scores:
    `F_t = [z(PV_sequence), ocular_fidelity, z(sEDA), z(RF_RespRate), rf_fidelity, z(RF_Bracing), z(GazeStability)]`

-   **Target Variable (Y_actual):** A binary success outcome, defined as:
    `Y = 1` if `(RMSSDΔ z-score > +0.5) AND (PV_complexity z-score < +1.5)`
    `Y = 0` otherwise.

-   **Output:** A predicted "Utility Score" (`U`) that informs the real-time pacing decision.

---

## THE ANONYMIZED DATA FLOW (The "Report")

To protect user privacy while enabling federated learning, the client **never** sends raw physiological data. The anonymous report to the federated server consists only of:

1.  `model_delta`: The mathematical gradient updates representing the model's learnings.
2.  `APV (Autonomic Profile Vector)`: An anonymized vector of baseline physiological traits used by the backend for clustering.

The raw feature vector (`F_t`) and the actual outcome (`Y_actual`) **never leave the device.**

---

## THE RESEARCH PROTOCOL (The "Test")

To rigorously test our hypotheses, we use a **Controlled Event Protocol (CEP)**, a structured, on-device experimental framework.

| Stage        | Duration | Purpose                                       |
|--------------|----------|-----------------------------------------------|
| **BASELINE**   | 3 mins   | Establish a stable, pre-intervention baseline.  |
| **INTERVENTION** | 5 mins   | User engages with a specific pacing protocol. |
| **RECOVERY**   | 3 mins   | Measure the autonomic recovery post-intervention. |

This allows for falsifiable, scientifically valid tests, such as our **"Presentiment"** and **"Sender/Receiver"** experiments, where we analyze the time-locked autonomic responses of synchronized user groups.

---

## THE "THEORY OF IT ALL" (The "Why")

Our core mission is to test two fundamental hypotheses:

1.  **The "Flinch" Hypothesis:** That a measurable, sub-motor "flinch" response (detected via `RF_Bracing` and `PupilPV`) precedes a significant drop in autonomic coherence and can be used as a predictive feature to prevent Post-Exertional Malaise (PEM).

2.  **The "Amplify" Hypothesis:** That a group of individuals in a coherent state (synchronized via the CEP) can measurably "amplify" their collective autonomic signal, detectable as a non-local correlation in the physiological data of a "receiver" group.

This platform is designed to be the definitive instrument for exploring these questions with scientific rigor and clinical safety.
