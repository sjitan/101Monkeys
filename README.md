# 101st Monkey Labs: Wildly Transformative.

An open-source, bio-adaptive pacing companion. It uses real-time Augmented Reality and a generative AI guide to help users experiencing nervous system dysregulation (particularly ME/CFS and Dysautonomia) find their "reset" and reclaim their well-being.

This is not a "health tracker." It is an adaptive, privacy-first intervention platform. The AR is central: the audio guides what to do; the AR shows how to align. The core loop is a synchronous fusion of sensing, audio, and visual feedback. The AR display, with its target pose "ghost" and real-time alignment feedback, builds profound user trust: the camera isn't watching them; it's assisting them.

## Table of Contents
1.  [Project Vision & Mission](#1-project-vision--mission)
    *   [1.1 The 100th Monkey Principle](#11-the-100th-monkey-principle)
    *   [1.2 The Core Problem: A "Life Hijacked"](#12-the-core-problem-a-life-hijacked)
    *   [1.3 Our Solution: The Empathetic Companion](#13-our-solution-the-empathetic-companion)
    *   [1.4 The Market: "Autonomic Profile" Rubric](#14-the-market-autonomic-profile-rubric)
2.  [Core Architecture: The Hardened Spec](#2-core-architecture-the-hardened-spec)
    *   [Layer 1: Mission & Guiding Hypotheses](#layer-1-mission--guiding-hypotheses)
    *   [Layer 2: The Adaptive Cluster Network](#layer-2-the-adaptive-cluster-network)
    *   [Layer 3: The SQA (Fidelity Filter) Layer](#layer-3-the-sqa-fidelity-filter-layer)
    *   [Layer 4: The Complete Sensor & Feature Stack](#layer-4-the-complete-sensor--feature-stack)
    *   [Layer 5: The Core Engine (The On-Device DL Engine)](#layer-5-the-core-engine-the-on-device-dl-engine)
    *   [Layer 6: The "Audio-Visual" Engine (The Generative AI Guide)](#layer-6-the-audio-visual-engine-the-generative-ai-guide)
    *   [Layer 7: The Coherence Facilitation Platform (The Product)](#layer-7-the-coherence-facilitation-platform-the-product)
    *   [Layer 8: Future Vision: Towards Wearable AR](#layer-8-future-vision-towards-wearable-ar)
3.  [Tech Stack](#3-tech-stack)
4.  [System Requirements](#4-system-requirements)
5.  [Installation](#5-installation)
6.  [Configuration](#6-configuration)
7.  [Usage](#7-usage)
8.  [API Reference (fl_server)](#8-api-reference-fl_server)
    *   [REST Endpoints](#rest-endpoints)
    *   [WebSocket Endpoint](#websocket-endpoint)
9.  [Development Guide](#9-development-guide)
10. [Testing](#10-testing)
11. [Deployment](#11-deployment)
12. [Monitoring & Logging](#12-monitoring--logging)
13. [Security & Privacy-by-Design](#13-security--privacy-by-design)
14. [Contributing](#14-contributing)
15. [License](#15-license)
16. [Acknowledgments & Disclaimer](#16-acknowledgments--disclaimer)
17. [Sources & Further Reading](#17-sources--further-reading)

---

## 1. Project Vision & Mission

This section outlines the "Why" behind 101st Monkey Labs.

### 1.1 The 100th Monkey Principle

This experiment is built on a famous idea: The 100th Monkey Principle. The story goes that on an island, a few monkeys learned to wash their food. As more monkeys learned, a "critical mass" was reached. Suddenly, monkeys on other islands—with no contact—spontaneously started doing the same. It's a story about emergent transformation. The 101st Monkey is our "step beyond." We are a lab designed to create the optimal adaptive environment for this emergent transformation to occur for nervous system regulation.

### 1.2 The Core Problem: A "Life Hijacked"

This project is built for "shut-in" populations with ME/CFS and Dysautonomia. The core, unmet need is not just physiological (PEM), but a profound human crisis:
*   **A "Lost Self"**: Devastating grief for the life and identity "hijacked" by the illness.
*   **Profound Isolation**: The "doubly invisible" nature of the illness leads to medical gaslighting and social isolation.
*   **The Burden of Pacing**: A constant, "exhausting mental calculus" that reinforces the "sick role" and prevents presence.
A simple "energy tracker" fails because it's a "cold calculator" that worsens this burden.

### 1.3 Our Solution: The Empathetic Companion

Our philosophy is the "No-Dashboard Mandate." We are an intervention, not an analyzer. Our UI is the intervention itself. The core of the product is the **Sense -> Intervene (AR + Audio)** loop. This loop is built on a critical design principle: **Trust through Feedback**. "Camera-on, AR-on" is an empathetic bio-feedback loop.

Our core loop is: **Sense ➔ Evaluate ➔ Adapt ➔ Intervene**.
*   **Sense**: The sensor stack (`F_t` vector) runs in real-time.
*   **Evaluate & Adapt**: The `decision_engine` feeds `F_t` into the `Pacer_Model` to dynamically adapt the protocol.
*   **Intervene**: The `ar_renderer` and `ai_guide_engine` deliver the next synchronized audio-visual instruction.

### 1.4 The Market: "Autonomic Profile" Rubric

This "sorting hat" is the first step of the adaptive protocol. It is built on two measurable, physiological axes:
*   **X-Axis: Autonomic Responsiveness (ARe)**: The "flexibility" axis. Can the user's nervous system intentionally shift its state?
*   **Y-Axis: Autonomic Baseline (ABa)**: The "set point" axis (resting RMSSD).

This gives us four clinically-actionable Archetypes:
*   **The "Responsive" (High ARe / High ABa)**: The Ventral Vagal (ideal) profile.
*   **The "Insulated" (Low ARe / High ABa)**: The Dorsal Vagal (freeze) profile.
*   **The "Regulator-in-Training" (High ARe / Low ABa)**: The Sympathetic (anxious) profile.
*   **The "Depleted" (Low ARe / Low ABa)**: The core ME/CFS profile.

This Archetype is the initial input for the `Pacer_Model`'s adaptive strategy in Stage 1.

## 2. Core Architecture: The Hardened Spec

This section is the complete technical and product specification.

### Layer 1: Mission & Guiding Hypotheses
*   **Clinical (Pacer)**: Prevent PEM by using bio-adaptive AR + Audio interventions to regulate the vagal nerve.
*   **Research (Network)**: Facilitate and measure autonomic coherence via the "Group Sync."
*   **"Flinch" Hypothesis (SG)**: A non-conscious "autonomic flinch" (`PV` spike, `sEDA` jolt, `Thermal` shift, `RF_Bracing`) precedes PEM and psi events.
*   **"Amplify" Hypothesis (JD)**: A coherent group can "amplify" this weak "flinch" signal.

### Layer 2: The Adaptive Cluster Network
This is our privacy-first federated architecture.
*   **Client (PWA)**: 100% on-device. Handles all sensing, SQA filtering, model inference, and IndexedDB storage.
*   **fl_server**: A backend that manages Federated Clustering and conducts the real-time "Group Sync" event.
*   **The "Anonymized Report" (Privacy Fail-Safe)**:
    *   **WHAT IS NEVER SENT**: `F_t` (Feature Vector), `Y_actual` (Session Outcome), any health logs.
    *   **WHAT IS SENT**: The `model_delta` (anonymized learning) and the `APV` (cluster ID).
*   **The Loop**: The server sorts the `model_delta` into the correct cluster model. The client downloads the latest model for its cluster.

### Layer 3: The SQA (Fidelity Filter) Layer
This is the "fail-safe" front door to prevent "Garbage In, Garbage Out" (GIGO).
*   **Gating (The "Hard Stop")**: A lightweight, on-device CNN generates fidelity scores (`ocular_fidelity`, etc.). If below a threshold, the UI gives audio-visual feedback (e.g., "Signal is unclear. Please check your lighting.").
*   **Weighting (The "Attention")**: The `fidelity_score` is passed as a raw feature to the `Pacer_Model`'s Attention Layer (see Layer 5).

### Layer 4: The Complete Sensor & Feature Stack
This is the full inventory of raw features extracted on-device.
*   **[HUB 1]: Front Camera (RGB / PPG / IR)** (Requires "Eyes-Open, Device-Focused" use)
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
*   **Zero-Latency Intervention**: The core loop—Sense -> Evaluate -> Intervene—must be faster than human reaction time (sub-100ms). Cloud latency makes this impossible.
*   **Absolute Privacy & Trust**: The `F_t` vector (real-time nervous system data) never leaves the user's phone. This is the core of our privacy promise.
*   **Offline-First Reliability**: The core intervention (Stage 1 & 3) works without Wi-Fi.

#### 5.B: The "How It Works" Architecture
*   **Target Variable (`Y_actual`)**: The "Successful Safe Shift": `Y = 1` if (`RMSSDΔ z-score > +0.5`) AND (`PV_complexity z-score < +1.5`).
*   **The Architecture**: GRU with Input Attention.
    *   **Input (`F_t`)**: The full, raw, high-definition feature vector from Layer 4. We do not pre-fuse or "squash" signals. All sensor and fidelity streams are fed directly into the model.
    *   **The Input Attention Layer**: A trainable layer that learns to "pay attention" to the most relevant and high-fidelity features at each timestep.
    *   **The GRU Layer**: A Gated Recurrent Unit handles the time-series nature of the data, perfect for on-device inference (e.g., via TensorFlow.js).

#### 5.C: Adaptive Sequencing Logic (The Core Loop)
The `Pacer_Model` operates within a continuous feedback loop managed by `decision_engine.js`.
1.  An initial instruction is selected based on the user's starting state (`F_t`).
2.  As the user performs the audio-visual instruction, the `sensor_engine` captures real-time physiological response and adherence.
3.  This updated `F_t` is fed back into the `Pacer_Model` before the next instruction.
4.  The model predicts the likely success (U-score) of all potential next instructions/poses from the "Arsenal" (Layer 7.A).
5.  The `decision_engine` selects the optimal next step (the one with the highest U-score), which dynamically creates the user's path.
6.  This **Sense -> Evaluate -> Adapt -> Intervene** loop repeats every few seconds.

### Layer 6: The "Audio-Visual" Engine (The Generative AI Guide)
This is the user-facing product, designed as a real-time AR/CV app, guided by a generative AI companion.

*   **A. The `ar_renderer.js` (The Central Interface)**:
    *   **Purpose**: To provide the primary, real-time, visual intervention. This is the "face" of the empathetic companion.
    *   **Interface**: The UI displays the live front camera feed with an AR overlay (`<canvas>`).
    *   **Guidance**:
        *   A subtle target pose "ghost" shows the ideal alignment.
        *   The user's own detected pose skeleton is overlaid in real-time.
        *   **Real-Time Alignment Feedback**: `pose_matcher.js` compares the user's skeleton to the target. The `ar_renderer.js` provides simple color-coding (green/red).
*   **B. The `ai_guide_engine.js` (The Generative AI Guide)**:
    *   This is not a library of `.mp3` files. This is a generative AI guide that synthetically creates a calm, meditative voice in real-time.
    *   **Input**: It receives structured commands from `decision_engine.js`, such as:
        *   `{ action: 'deliver_pose', pose_id: 'pose_grounding_01' }`
        *   `{ action: 'correction', body_part: 'left_shoulder', cue: 'soften' }`
        *   `{ action: 'flinch_response', cue: 'release_bracing' }`
        *   `{ action: 'sync_start', group_size: 50 }`
    *   **Output**: It uses an on-device TTS (Text-to-Speech) model to generate seamless, adaptive audio. This is the "adaptive AI system that talks and listens."

### Layer 7: The Coherence Facilitation Platform (The Product)
This section defines the "arsenal" of interventions and the unified adaptive protocol that all users experience.

#### 7.A: 🧘‍♂️ The Chair Yoga "Arsenal" (Reference Library)
This is the reference library of all possible interventions the `Pacer_Model` can choose from. This is **NOT** a sequence.
1.  **Grounding / Centering Poses (Parasympathetic Priming & Vagal Focus)** 🧘‍♀️
    *   `pose_grounding_01`: Seated Mountain Pose (Tadasana)
    *   `pose_grounding_02`: Gentle Neck Rolls/Stretches
    *   `pose_grounding_03`: Shoulder Rolls/Shrugs
    *   `pose_grounding_04`: Seated Body Scan (Guided Focus)
    *   `pose_grounding_05`: Wrist & Ankle Circles
    *   `pose_grounding_06`: Palming the Eyes
    *   `pose_grounding_07`: Diaphragmatic Breathing Focus
2.  **Mobilizing / Energizing Poses (Gentle Activation + Autonomic Coherence)** ✨
    *   `pose_mobilizing_01`: Seated Cat-Cow (Marjaryasana/Bitilasana)
    *   `pose_mobilizing_02`: Gentle Seated Spinal Twist
    *   `pose_mobilizing_03`: Seated Side Bends (Parsva Sukhasana var.)
    *   `pose_mobilizing_04`: Seated Sun Salutation (Surya Namaskar var.)
    *   `pose_mobilizing_05`: Chair Pose (Utkatasana var.)
    *   `pose_mobilizing_06`: Seated Eagle Arms (Garudasana var.)
    *   `pose_mobilizing_07`: Leg Lifts/Extensions
3.  **Restorative / Release Poses (Deep Parasympathetic/Dorsal-to-Ventral Shift)** 😌
    *   `pose_restorative_01`: Supported Forward Fold (Paschimottanasana var.)
    *   `pose_restorative_02`: Seated Child's Pose (Balasana var.)
    *   `pose_restorative_03`: Supported Chest Opener (on chair)
    *   `pose_restorative_04`: Seated Gentle Hip Opener (Figure Four)
    *   `pose_restorative_05`: Chair Savasana (Corpse Pose)
    *   `pose_restorative_06`: "Humming Bee" Breath (Bhramari)

#### 7.B: The Unified Adaptive 3-Stage Protocol
This is the single, fully adaptive protocol that all users experience.
*   **Stage 1: Individual Calibration (Fully Adaptive)**
    *   **Goal**: To guide the user from their starting state (`F_t`) to the ideal, stable "sync-ready" state.
    *   **Mechanism**: The on-device `decision_engine` and `Pacer_Model` run the core **Sense -> Evaluate -> Adapt -> Intervene** loop, polling the "Arsenal" to find the highest U-score for the next step.
    *   **How it Adapts (The "Triage")**: The user's Archetype (Layer 3) dictates the model's initial strategy (e.g., up-regulate "Depleted," down-regulate "Regulator-in-Training").
*   **Stage 2: Group Sync (Group-Adaptive)**
    *   **Goal**: To test the "Amplify" and "Flinch" hypotheses in a live, networked coherence event.
    *   **Mechanism**: The `decision_engine` connects to the `fl_server` (Layer 2) via WebSocket. The server acts as a "conductor" for the group.
*   **Stage 3: Individual Equilibrium (Fully Adaptive)**
    *   **Goal**: To safely guide the user from the "Group Sync" state back to a stable, integrated ventral-vagal state.
    *   **Mechanism**: The on-device `Pacer_Model` takes full control again, running the same adaptive loop with a new goal: achieve the "Successful Safe Shift" (`Y_actual = 1`).

### Layer 8: Future Vision: Towards Wearable AR
While the current MVP is designed for smartphones (PWA), the long-term vision for the AR/CV component is integration with wearable AR glasses. This would provide a truly seamless, hands-free experience. The current architecture, using on-device CV and rendering, is designed with this future portability in mind.

## 3. Tech Stack

*   **Frontend**: Progressive Web App (PWA) using vanilla ES6 JavaScript, HTML5, and CSS.
    *   **AR/CV**: A custom rendering engine using WebGL and a lightweight pose estimation model (e.g., MoveNet) via TensorFlow.js.
    *   **AI Guide**: On-device Text-to-Speech (TTS) via the Web Speech API.
*   **Backend**: Serverless architecture using AWS Lambda (Python 3.11) and API Gateway.
    *   **Federated Learning Server (`fl_server`)**: A lightweight Python server (e.g., FastAPI or Flask) responsible for model aggregation and group sync coordination.
*   **Database**: IndexedDB on the client-side for storing user baselines and model versions. No server-side user database.
*   **Deployment**:
    *   Frontend: Static site hosting (e.g., Vercel, Netlify, AWS S3/CloudFront).
    *   Backend: Infrastructure as Code (IaC) using AWS CloudFormation or SAM.

## 4. System Requirements

*   **For Users**: A modern smartphone (iOS or Android) with a web browser supporting WebGL and WebRTC.
*   **For Developers**:
    *   Node.js v18+
    *   Python 3.11+
    *   Docker & docker-compose

## 5. Installation

To set up the development environment, clone the repository and install the dependencies.

```bash
# 1. Clone the repository
git clone https://github.com/101st-monkey-labs/pacer-app.git
cd pacer-app

# 2. Install backend dependencies
pip install -r fl_server/requirements.txt

# 3. (Optional) Install simulation dependencies
pip install -r sim/requirements.txt

# 4. (Optional) Install frontend verification dependencies
pip install -r frontend_verification/requirements.txt
playwright install # Installs necessary browser drivers
```

## 6. Configuration

The `fl_server` is configured via an `.env` file in its root directory. Create one from the example:

```bash
# In the fl_server directory
cp .env.example .env
```
Modify the `.env` file with your specific settings (e.g., API keys, database URLs).

## 7. Usage

1.  **Start the Backend `fl_server`**:
    ```bash
    python3 fl_server/main.py
    ```
    The API will be available at [http://localhost:8000](http://localhost:8000).

2.  **Start the Frontend PWA**:
    ```bash
    # Navigate to the app directory
    cd app
    # Start a simple Python web server
    python3 -m http.server 8080
    ```
    The PWA will be accessible at [http://localhost:8080/pacer.html](http://localhost:8080/pacer.html).

3.  **Run the Simulation Harness (in a new terminal)**:
    ```bash
    # Make sure the fl_server is running first
    python3 sim/harness.py
    ```

4.  **Run Frontend Verification (in a new terminal)**:
    ```bash
    # Make sure the frontend PWA is running first
    python3 frontend_verification/verify.py
    ```

## 8. API Reference (fl_server)

The `fl_server` provides a minimal API for federated learning and group sync.

### REST Endpoints

*   **`POST /api/v1/delta/upload`**
    *   **Body**: `{ apv: 'Archetype_ID', model_delta: '...' }`
    *   **Description**: Uploads an anonymized `model_delta` from a client to be aggregated.
*   **`GET /api/v1/model/download/:apv`**
    *   **Params**: `apv` (Archetype ID)
    *   **Description**: Downloads the latest aggregated cluster model for the user's archetype.

### WebSocket Endpoint

*   **`WS /ws/group_sync/:apv`**
    *   **Description**: The main connection for the Stage 2: Group Sync event.
    *   **Client Sends**: Anonymized, real-time "flinch" data.
    *   **Server Sends**: "Conductor" commands (e.g., `{ action: 'group_regulate', ... }`) to all connected clients.

## 9. Development Guide

*   **Branch Naming**: `feature/<name>`, `fix/<name>`, `docs/<name>`
*   **Commits**: Please follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.
*   **Linting**: `flake8` (Python), `ESLint` (JavaScript).
*   **Simulation**: A custom Python simulation harness is located in `/sim`. It mocks `F_t` vector streams to test the `decision_engine`'s adaptive logic and the `Pacer_Model`'s responses without a human-in-the-loop.

## 10. Testing

*   **Backend**: `pytest --cov=app tests/`
*   **Frontend**: Frontend verification is performed using a Playwright script. See `frontend_verification/` for details.
*   **Coverage Target**: We aim for >90% code coverage.

## 11. Deployment

*   **Frontend (PWA)**: Deployed as a static site to any modern web host (Vercel, Netlify, S3/CloudFront).
*   **Backend (fl_server)**: Built as a Docker container and deployed to a service like AWS Fargate, DigitalOcean App Platform, or Heroku.

## 12. Monitoring & Logging

*   **Server**: The `fl_server` uses standard FastAPI logging.
*   **Client**: Logging is minimal and opt-in. Anonymized performance and error metrics (e.g., model load time, SQA failure rate) may be sent.

## 13. Security & Privacy-by-Design

This system is built on a foundation of absolute, on-device privacy.
*   **Absolute Privacy & Trust**: The `F_t` vector (the user's real-time nervous system data) never leaves the user's phone. All `Pacer_Model` inference is 100% on-device.
*   **Anonymized Learning**: The only data sent to the server is the anonymized `model_delta` (a set of mathematical weights, not user data) and the anonymous `APV` (Archetype ID).
*   **Standard Security**: HTTPS is enforced on the `fl_server`, and all WebSocket connections are secure (`wss://`).

## 14. Contributing

We welcome contributions! Please fork the repository, create a `feature/` branch, and submit a pull request with a clear description of your changes. Ensure all tests pass.

## 15. License

[MIT](LICENSE) © 2025 101st Monkey Labs

## 16. Acknowledgments & Disclaimer

This project is inspired by the 100th Monkey Principle and the collective research into autonomic nervous system regulation.

*Disclaimer: This is a research and wellness platform. It makes no medical claims and is not a substitute for professional medical advice, diagnosis, or treatment.*

## 17. Sources & Further Reading

1.  **Polyvagal Theory**: Porges, S. W. (2011). *The Polyvagal Theory: Neurophysiological Foundations of Emotions, Attachment, Communication, and Self-regulation*. W. W. Norton & Company.
2.  **Heart Rate Variability (HRV)**: Task Force of The European Society of Cardiology and The North American Society of Pacing and Electrophysiology. (1996). Heart Rate Variability: Standards of Measurement, Physiological Interpretation, and Clinical Use. *Circulation*, 93(5), 1043–1065.
3.  **Federated Learning**: McMahan, B., Moore, E., Ramage, D., Hampson, S., & y Arcas, B. A. (2017). *Communication-Efficient Learning of Deep Networks from Decentralized Data*. Proceedings of the 20th International Conference on Artificial Intelligence and Statistics (AISTATS).
4.  **Biofeedback & ME/CFS**: Rijk, M. d., & Rijk, A. d. (2016). *Heart Rate Variability in Chronic Fatigue Syndrome*. Routledge.
5.  **Embodied Cognition & Yoga**: Schmalzl, L., Powers, C., & Henje Blom, E. (2015). The impact of mindfulness-based and yoga-based interventions on cognitive functions in healthy adults: A systematic review. *Frontiers in Human Neuroscience*, 9, 235.
