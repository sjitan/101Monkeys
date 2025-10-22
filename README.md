# 🧠 101Monkeys — Pacer Protocol MVP

**Baseline-Normalized Adaptive Decision Engine for Breath-to-Movement Regulation**

## 📖 Overview

101Monkeys is a research-driven prototype for a bioadaptive pacing assistant designed for ME/CFS, dysautonomia, and neuro-fatigue recovery. It merges biophysical sensing (HRV, respiration, ocular focus) with adaptive chair yoga and slow breathing protocols, enabling a closed-loop regulation system that adjusts difficulty and breath cadence in real time.

This MVP implements the Pacer Protocol — a modular, scientifically grounded framework that:

*   **Measures** user physiology on-device (RMSSD, RespRate, PupilPV, Fatigue)
*   **Computes** z-normalized baselines across multimodal metrics
*   **Applies** safety gates to avoid post-exertional crashes (PEM)
*   **Selects** and delivers the lowest-effort effective protocol dynamically

No data leaves the device unless explicitly logged to anonymized tables.

---

## 🎯 Mission & Principles

**Deliver a clinically conservative, on-device pacing assistant that nudges the Autonomic Nervous System (ANS) toward coherence—measured, not imagined—by combining slow, individualized breathing, low-effort chair movement, and real-time safety gates for people with ME/CFS and dysautonomia.**

| Pillar             | What it means                                                                                 | How we implement it                                                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Coherence-first**| Synchronize respiration, heart rhythm (RSA/HRV), and attention into a low-effort, stable state. | Breath pacer targets resonant frequency (≈5–6.5 bpm) with exhale-biased IE ratios; engine tunes cadence from RMSSD and RespVar.                                                      |
| **Vagal up-regulation** | Increase cardiac vagal activity without exertion or strain.                                       | Optimize RMSSDΔ every 2–3 minutes; down-shift protocols if PV complexity or HR rise.                                                                                            |
| **PEM safety**     | Never trade “calm now” for a crash tomorrow.                                                  | Hard HR gate (RHR+15 bpm), PV complexity gate, RMSSD trend gate; defaults to Restorative.                                                                                        |
| **On-device truth**| Physiology first, narrative second.                                                           | Camera PPG + respiration + ocular on device; no streaming; anonymized logs opt-in.                                                                                              |
| **Explainable**    | Every cue traceable to a metric.                                                              | UI shows baseline, z-scores, and why a pose/breath was chosen.                                                                                                                  |

---

## ⚙️ System Architecture

| Layer           | Function                               | Stack                               |
| --------------- | -------------------------------------- | ----------------------------------- |
| **Infra**       | CloudFormation + Lambda + DynamoDB     | AWS                                 |
| **Backend**     | Python 3.11 Lambdas                    | API Gateway / Cognito               |
| **Frontend (PWA)** | Local RMSSD + respiration sensing     | HTML / CSS / Vanilla JS             |
| **Local Engine**| Decision & pacing                      | JS                                  |
| **Data Layer**  | Rolling baselines + user profile       | LocalStorage + DynamoDB             |
| **Privacy**     | On-device analytics only               | No uploads                          |

---

## 🪄 Coherence & ANS Regulation (What we mean by “coherence”)

“Coherence” here is operationalized, not mystical: a state where breath cadence, heart rhythm variability (RMSSD/RSA), and attentional load (ocular stability/pupil variability) are phase-aligned and low-effort. Practically:

*   **Input (command):** slow paced breathing at individual resonant frequency (start 6.5 → sweep to 5.0 bpm), test IE ratios {1:1, 1:1.5, 1:2}.
*   **Desired ANS signature:** ↑RMSSD, stable/low PV complexity, low RespVar at target cadence.
*   **Decision loop:** pick lowest-effort pose that preserves coherence while increasing RMSSD without violating safety gates.
*   **If coherence breaks (PV↑ or HR↑):** step down to Restorative and widen exhale cue; reduce visual stimulation.

This gives us a measurable coherence score used in S:

`Coherence = α1 * z(RMSSDΔ)  - α2 * z(PV_complexity)  - α3 * z(RespVar)  - α4 * |RespRate - RF_target|_z`
Weights are loaded from PacerPolicyConfig and tuned per user.

## 🧠 Multimodal Coherence Sensing (Theta-Wave Proxy via Pupil Metrics)

### Scientific Rationale

During deep heart–brain coherence states (as documented in Dispenza’s EEG/ECG datasets and HeartMath-aligned studies), the cortex often enters a theta-dominant rhythm (4–7 Hz) that co-occurs with:
*   Reduced pupillary micro-fluctuation amplitude (parasympathetic stability)
*   Increased smooth-pursuit steadiness (gaze stability)
*   Reduced saccadic entropy

Those ocular markers correlate with prefrontal–limbic synchrony and vagal tone, making pupil variability (PV) a viable theta-wave proxy when direct EEG is unavailable.

### Implementation in 101Monkeys

| Signal        | Proxy For                                      | Source        | Usage                                                  |
| ------------- | ---------------------------------------------- | ------------- | ------------------------------------------------------ |
| **PupilPV (σ/μ of pupil area)** | Theta rhythm amplitude / parasympathetic engagement | Front camera ROI | Weight w_pv in S utility; coherence surrogate           |
| **GazeStability (fixation variance)** | Attentional oscillation / alpha-theta balance  | Same ROI      | Secondary coherence signal                             |
| **RespVar**     | Respiratory coupling / phase stability         | Mic / button  | Used to confirm rhythm lock-in                         |

The combined ocular metrics act as a non-invasive coherence surrogate, allowing real-time feedback even without EEG.

### Safe Integration
*   **Frame rate gating:** 15–30 FPS minimum before computing PV.
*   **No raw media saved:** frames converted to scalar PV + stability metrics in-memory, discarded after aggregation.
*   **Fail-safe:** if camera signal < quality threshold, PV → null and engine re-weights S to RMSSD/RespVar only.
*   **No biometric identification:** optical flow limited to ROI dynamics; all features destroyed post-computation.

### Mathematical Hook

`CoherenceScore = α1*z(RMSSDΔ) - α2*z(PupilPVσ) - α3*z(RespVar) - α4*|RespRate - RF_target|_z`

Theta-like ocular quiescence (↓PVσ, ↓RespVar) increases the coherence score and drives visual dimming feedback to reinforce the state.

---

## 🧩 Core Logic: Adaptive Decision Engine

### Formula
`z(x) = (x - median_baseline) / MAD_baseline`
`S =  w_rmssd * z(RMSSDΔ) - w_pv * z(PupilPV) - w_respvar* z(RespVar) - w_resprate * |RespRate - RF_target|_z - w_fatigue* z(FatigueAdj)`

### Decision Rule

Select `max(S)` among safe, low-effort poses. Enforce gates:

| Gate              | Threshold                                  | Scientific Justification                                                                                                                                                                 |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HR Gate**       | HR ≤ baseline + 15 bpm                     | A conservative safety gate to prevent autonomic stress and stay within the anaerobic threshold.                                                                                         |
| **PEM Gate**      | RMSSDΔ ≥ -20 % of baseline median          | A sustained drop in resting RMSSD (20%+) is a recognized sign of autonomic fatigue and sympathetic dominance, often preceding a crash in ME/CFS. This threshold acts as a quantitative proxy for PEM risk. |
| **PV Gate**       | PV complexity ≤ baseline + 2 MAD           | An increase of ≥2 MAD in pupil variability indicates a sympathetic flare.                                                                                                                |
| **PEM Score**     | pemScore ≤ 2                               | Self-reported PEM score from the user.                                                                                                                                                   |

If any fail → downgrade to Restorative Protocol.

---

## 🧘‍♀️ The Saga of Context

(Scientific and developmental narrative)

*   **Genesis** — Began as a simple HRV logger for pacing ME/CFS activity. Prototype depended on AWS for compute; decision logic ran remotely.
*   **Failure State** — Cloud-first design caused latency and reliability issues. Sensor placeholders and unnormalized data created false positives in fatigue prediction.
*   **Pivot Point** — Shifted to on-device signal processing (PPG + audio + gaze). Introduced rolling baselines (median/MAD) to remove noise and user variance.
*   **The Breath Question** — Incorporated controlled respiration (RF 5–6.5 bpm, IE 1:1–1:2) following Lehrer et al., Resonant Frequency Breathing (2013) and Kundalini Yoga prāṇāyāma mechanics, adapted without retention or strain.
*   **Normalization Breakthrough** — Unified HRV, RespVar, and PV metrics via z-scores over 7-session baselines, enabling valid cross-signal weighting.
*   **Clinical Integrity** — Hard-coded safety gates prevent overexertion (PEM triggers). This positions 101Monkeys as a rehabilitation-adjacent tool, not wellness fluff.
*   **Phase II (Now)** — Full local app build-out (no network dependency), transparent physiology, and scientific traceability — readable, explainable, deployable.

## 🌬️ Adaptive Breath & Movement Engine

Dynamic pacing (6.5 → 4.5 bpm sweep). Optimal IE ratio determined by RMSSD gain. Adaptive pose suggestion with on-screen visual cue and haptic feedback. Real-time safety override → rest protocol if HR or PV gate fails.

### JD-Inspired “The Breath” — What we include, what we exclude

We acknowledge popular “spinal/columnar” breath practices (often taught by Joe Dispenza and lineages of Kundalini/prāṇāyāma) that emphasize directed inhale, axial elongation, pelvic floor lift, and cranial focus. To keep 101Monkeys clinical and safe for ME/CFS/dysautonomia, we translate the intent (vagal activation + attentional channeling) into quantified, low-risk parameters:

**We INCLUDE (quantified):**

*   Slow, paced respiration at user RF (≈5–6.5 bpm).
*   Exhale-biased IE (1:1 to 1:2), empirically chosen per user by RMSSD gain.
*   Axial elongation cue (seated Tadasana) at micro-effort with chair support.
*   Soft cranial attention (gaze convergence mild, no strain), tracked by pupillary stability.

**We EXCLUDE (risk-managed):**

*   High-pressure retentions / Valsalva-like locks (contraindicated due to sympathetic surges).
*   Forced bandha intensity or any maneuver that elevates HR above RHR+15 bpm.
*   Large amplitude spinal pumping; we use micro-movement only.

### Joe Dispenza-Inspired Breath & Heart-Brain Coherence

Dr. Joe Dispenza teaches that the heart and brain function as a dynamic system. The core of his method lies in cultivating coherent heart rhythms (via intentional breathing and elevated emotional states) which then “inform” the brain into synchronized, higher-order activity. In the Pacer Protocol MVP, we borrow the mechanistic inspiration from Dispenza’s heart-brain coherence paradigm and translate it into measurable, safety-first parameters suitable for a hypersensitive ANS population (ME/CFS/dysautonomia).

---

## 🔬 Sensing Stack

| Modality              | Source                   | Purpose                       |
| --------------------- | ------------------------ | ----------------------------- |
| PPG (camera)          | Green channel            | HR + RMSSD                    |
| Respiration           | Mic envelope or tap button | RespRate + RespVar            |
| Ocular                | Front cam ROI            | PupilPV + GazeStability       |
| Fatigue (self-report) | Slider                   | Subjective calibration        |

### Processing (in `sensor_engine.js`)

*   **Signal Quality:** Implement a Signal Quality Metric (SQM) for PPG and PV. If quality is below a threshold, the respective z-score is nullified.
*   Detrend + band-pass (0.5–4 Hz)
*   Peak detection (300 ms refractory)
*   Rolling RMSSD (N=30 beats)
*   RespVar = SD(inter-breath interval)/mean interval
*   Local median/MAD baselines
*   Output bundle → decision_engine.js

All signals run in-browser only.

---

## 🗄️ Data Schema (DynamoDB)

| Table                  | Purpose                            |
| ---------------------- | ---------------------------------- |
| **YogaProtocolLibrary**| Pose library (≥20 chair poses)     |
| **ANSLongitudinalData**| RMSSD, RespVar, PV, Fatigue logs   |
| **UserProfiles**       | Rolling medians, MAD baselines     |
| **AnonymizedTrainingData** | De-ID logs for model training      |
| **PacerPolicyConfig**  | Weights + thresholds               |
| **AuditEvents**        | Safety logs                        |

---

## 🛠️ Folder Structure

```
infra/      # CloudFormation, deploy scripts, seeder
lambda/     # Python Lambdas (pacer, data, billing)
app/        # Frontend (HTML, JS, CSS)
docs/       # README, test plan, demo script
ci/         # GitHub actions
```

---

## ⚖️ Safety & Privacy

*   No streaming media or personal data.
*   Cognito-authenticated API for metrics only.
*   All physiological metrics local first.
*   Pseudonymized training data (salted hashes via KMS).
*   PEM protection gates hardcoded.
*   **Asynchronous Logging:** The `/pacer/log` endpoint performs an asynchronous update to the user's baseline to ensure the logging API is unaffected by latency.

---

## 🔍 Research References

*   Lehrer et al. (2013), Resonant Frequency Breathing
*   Brown & Gerbarg (2005), Sudarshan Kriya Yogic Breathing in Stress and Anxiety
*   Thayer et al. (2012), Heart-Brain Connection and Autonomic Balance
*   Cook et al. (2022), Post-Exertional Malaise and HRV Predictors in ME/CFS
*   NASA Ames (2021), Adaptive Physiologic Feedback Systems for Autonomic Regulation
*   Harati et al. (2019), on pupillary micro-oscillation damping and theta entrainment
*   McCraty & Atkinson, HeartMath (2017)

---

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/sjitan/101Monkeys.git
cd 101Monkeys

# Deploy backend
cd infra
bash deploy.sh

# Run local PWA
cd ../app
python3 -m http.server 8080
# Then open http://localhost:8080/pacer.html.
```

---

## 🧩 Demo Flow

1.  Grant camera + mic access
2.  Sit upright, start pacer
3.  System computes HRV & recommends pose
4.  Follow breath arc on screen
5.  Safety gate test → auto rest if triggered
6.  Log + baseline update

---

## 🧬 Roadmap

| Phase | Focus                                | Owner                 |
| ----- | ------------------------------------ | --------------------- |
| I     | Local RMSSD + pacer baseline         | Jules                 |
| II    | Adaptive decision engine (z-normed)  | Gemini                |
| III   | Test & refactor (Claude/Replit)      | You                   |
| IV    | Publish demo + white paper           | Team                  |

---

## Founder's Note

The Saga of Context is not just a project history; it's the philosophical bedrock of 101Monkeys. We believe that to manage a complex system like the human autonomic nervous system, we need tools that are equally nuanced. This project is a move away from one-size-fits-all wellness apps and toward a future of personalized, data-driven, and clinically-aware self-regulation. We're building a tool that we hope will empower individuals to navigate their own physiology with greater precision and safety.

---

## 🧰 License

MIT © 2025 101Monkeys Lab
No medical claims. For research and educational use only.
