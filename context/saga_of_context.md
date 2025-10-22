# Saga of Context — Technical Foundations, Academic Basis, and Hypotheses

> Purpose: Give Jules, clinicians, and investors the *why* behind the *what* — framed academically, grounded in measurable signals, and explicit about what is hypothesis vs. validated.

## 0) TL;DR
- **Problem:** Autonomic dysregulation (low HRV, sympathetic overdrive) sustains chronic symptoms in CFS/ME and metabolic disease.
- **Intervention:** Adaptive behavioral nudges (breath/yoga micro-protocols) selected by a **closed loop** from real-time rPPG HRV.
- **Outcome:** Faster return to physiologic coherence post-nudge, logged longitudinally for learning.
- **Scope:** MVP is **behavioral** (non-medical, non-diagnostic); it measures & coaches coherence, records response, and learns.

## 1) Scientific Premise (Academic Core)
- **Control Model:** Psychoneuro-Endocrine-Immune (PNEI) axis.
- **Primary biomarker:** HRV (RMSSD) via remote PPG; **respiration metrics** as adjuncts.
- **Loop:** measure → decide (protocol library) → actuate (cue) → re-measure; write to DDB; optional pseudonymized copy for training.

## 2) Digital Biomarkers & Sensing
- **Tier-1:** rPPG HR/HRV, respiration (video-derived chest motion), rate variability as vagal proxy.
- **Tier-2:** Neck anthropometrics / AN (screening) and ocular pipelines are **outside MVP**; documented as future work.
- **Tier-3/4:** Gait/pose/affect — parked for post-MVP.

## 3) Closed-Loop Nudge Library
- **YogaProtocolLibrary** maps **states → micro-protocols**: BREATH_1 (slow exhale bias), RELAX_1 (visual cue + box breathing), etc.
- Protocol selection rule (MVP): threshold policy on RMSSD plus guardrails; RL/bandits later.

## 4) Compliance & Data Ethics
- No PHI in app logs; pseudonymization writes derived `AnonID` with KMS-salt; access scoped to one Lambda.
- Cognito JWT gates endpoints; CORS only for our origins in prod.

## 5) Strategic Platform Fit
- Serverless on AWS for speed; open-source MLOps optional later; hybridization (MLflow registry + serverless inference) is the path once models appear.

## 6) Emergent Coherence & Remote Healing (Joe Dispenza) — *Positioned Carefully*
**What we take:**
- The **heuristic** that intentional breathing/attention, individually or in groups, can **entrain** autonomic state toward coherence (higher HRV, smoother respiration patterns).
- The **idea** of “remote coherence” (group intention possibly correlating with individual HRV shifts) as a **testable hypothesis**.

**How we use it responsibly:**
- We **do not** claim medical efficacy or endorse unverified mechanisms.
- We **design experiments** our platform can actually measure:
  - Pre-register blinded group sessions (in-app), collect rPPG HRV time-series from participants and matched controls.
  - Define **primary endpoints** (ΔRMSSD, distributional shift in HRV spectra), **secondary** (subjective calm, PEM change where relevant).
  - Require **statistical corrections** for multiple comparisons; share negative and positive results.
- In product, we keep language **academic and neutral**; the MVP **only** claims “supports coherence practice and measures response.”

## 7) Roadmap Notes (Evidence ↔ Product)
- **Now (MVP):** rPPG HRV ingestion; threshold policy; micro-protocol cues; pre/post logging; dashboards.
- **Next:** Contextual policy (time-of-day, baseline trends), adaptive schedules, PEM-aware pacing for CFS.
- **Later:** Multi-signal fusion (respiration inference), personalization (bandits/RL), optional research modules (group coherence trials).

## 8) Appendix: Terms
- **Coherence:** here = improved parasympathetic balance indicated by HRV (RMSSD ↑) and regular respiration; *not* a metaphysical claim.
- **PEM:** post-exertional malaise; we log **self-rated PEMSeverityScore** post-session to avoid harm in CFS users.
