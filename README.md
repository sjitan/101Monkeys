# 🧠 101Monkeys — Pacer Protocol MVP

**Baseline-Normalized Adaptive Decision Engine for Breath-to-Movement Regulation**

## 📖 Overview

101Monkeys is a research-driven prototype for a bioadaptive pacing assistant designed for ME/CFS, dysautonomia, and neuro-fatigue recovery. It merges biophysical sensing (HRV, respiration, ocular focus) with adaptive chair yoga and slow breathing protocols, enabling a closed-loop regulation system that adjusts difficulty and breath cadence in real time.

This MVP implements the Pacer Protocol — a modular, scientifically grounded framework that:

*   **Measures** user physiology on-device (RMSSD, RespRate, PupilPV, Fatigue)
*   **Computes** z-normalized baselines across multimodal metrics
*   **Applies** safety gates to avoid post-exertional crashes (PEM)
*   **Selects** and delivers the optimal protocol based on a deep learning model.

All processing and data storage happens **100% on-device** for privacy and offline functionality.

---

## ⚙️ System Architecture: Edge-Only PWA

The application is a Progressive Web App (PWA) designed to run **100% offline**. All sensing, processing, and decision-making happens on the client device.

| Layer                | Function                                            | Stack                                        |
| -------------------- | --------------------------------------------------- | -------------------------------------------- |
| **Application**      | PWA Shell, UI, Service Worker for offline access    | HTML / CSS / Vanilla JS                      |
| **Sensing Engine**   | Real-time physiological data processing             | `sensor_engine.js` (Camera/Mic APIs)         |
| **Decision Engine**  | GRU model execution and protocol selection          | `decision_engine.js`, `dl_engine.js` (TF.js) |
| **Data Layer**       | On-device storage for baselines and training data   | `baseline_store.js` (IndexedDB)              |
| **Privacy**          | All data remains on-device by default               | N/A                                          |
| **Optional Backend** | (Future) Opt-in data sync for research              | AWS Lambda / DynamoDB                        |

---

## 🧩 Core Logic: On-Device Deep Learning Engine

This MVP has transitioned from a linear weighted-score model to a predictive deep learning architecture running entirely on-device via TensorFlow.js.

### 1. Feature Vector (`F_t`)
At each time step, the `sensor_engine.js` computes a z-normalized feature vector:
`F_t = [z(RMSSD), z(ΔRMSSD), z(PV), z(ΔPV), z(RespVar), z(RespRate - RF), z(Fatigue)]`
This vector, including the critical rate-of-change features (Δ), captures the dynamic state of the user's autonomic nervous system.

### 2. GRU Model & Utility Score (`U`)
A pre-trained Gated Recurrent Unit (GRU) model, a type of recurrent neural network, takes the feature vector `F_t` as input. It outputs a **Utility Score (`U`)**, which represents the predicted probability of a successful clinical outcome if an intervention is applied.
`U = GRU(F_t)`

### 3. Decision Rule
The `decision_engine.js` selects the candidate protocol that is predicted to maximize the Utility Score (`U`), while respecting safety gates.
`Decision = argmax(U_protocol) for protocol in candidate_protocols`

### 4. Clinical Validation Loop (`Y_actual`)
After each 3-minute session, the application calculates the *actual* outcome (`Y_actual`) based on research-validated thresholds:
`Y_actual = 1` if `(RMSSDΔ z-score > +0.5)` AND `(PV_complexity z-score < +1.5)`
`Y_actual = 0` otherwise.

This `(F_t, Y_actual)` pair is logged locally, creating a high-quality dataset for continuous, on-device model training and validation.

---

## 🔬 Sensing Stack

| Modality              | Source                   | Purpose                       |
| --------------------- | ------------------------ | ----------------------------- |
| PPG (camera)          | Green channel            | HR + RMSSD                    |
| Respiration           | Mic envelope or tap button | RespRate + RespVar            |
| Ocular                | Front cam ROI            | PupilPV + GazeStability       |
| Fatigue (self-report) | Slider                   | Subjective calibration        |

### Processing (in `sensor_engine.js`)
*   Detrend + band-pass (0.5–4 Hz) for PPG signal.
*   Peak detection and rolling RMSSD calculation.
*   Calculation of z-scores against user's personal baseline (Median/MAD).
*   Computation of rate-of-change features (ΔRMSSD, ΔPV).
*   Output of the final `F_t` feature vector to the decision engine.

---

## ⚖️ Safety & Privacy

*   **100% Offline:** All sensing, computation, and data storage happens on the device. No data is sent to a server.
*   **Service Worker:** Ensures the application is always available, even without an internet connection.
*   **On-Device Database:** User baselines and session outcomes are stored locally using IndexedDB.
*   **Hard Safety Gates:** The `pacer_engine.js` includes a hard-coded safety gate to monitor `PV_complexity` in real-time and halt sessions if it exceeds the `+1.5 Z-score` threshold.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/sjitan/101Monkeys.git
cd 101Monkeys

# All logic is in the /app directory. No backend deployment is needed.

# Serve the local PWA
cd app
python3 -m http.server 8000

# Open http://localhost:8000 in your browser.
```

---

## 🧬 Project Status

This repository contains the completed MVP of the on-device PWA. The core components (`pacer_engine`, `sensor_engine`, `dl_engine`, `baseline_store`) are implemented with a functional, offline-first architecture. The DL model interaction is currently mocked but is wired into the decision loop correctly. The clinical validation loop, which calculates and stores `Y_actual`, is fully implemented, paving the way for future on-device model training.

---

## 🧰 License

MIT © 2025 101Monkeys Lab
No medical claims. For research and educational use only.
