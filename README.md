# 🧠 101Monkeys — Phase 3: The Adaptive Cluster Network

**A Self-Organizing, Multi-Model Platform for Delivering Clinically Superior Pacing and Rigorously Testing Coherence Hypotheses.**

---

## 📖 Overview: A Strategic Pivot

The **101Monkeys Pacer Protocol** began by establishing a robust, on-device sensor for individual autonomic regulation. However, our Phase 2 architecture, based on a single "Global Model," contained two critical, interconnected flaws that would fail a hardening review:

1.  **The "Global Model" is a Trap:** A single model, even one trained via federated learning, is a critical clinical and business flaw. The autonomic "crash" signature for an ME/CFS user is **fundamentally different** from that of a healthy "Stargate" researcher. By averaging them, we create a model that is **not optimal for anyone** and could even be **dangerous** for our core clinical users.

2.  **The "Global Event" Hypothesis is Unfalsifiable:** Relying on *external*, uncontrolled events (earthquakes, market crashes) to test our coherence hypotheses is a logistical and statistical nightmare. It is not a scientifically rigorous method and leaves our core mission as a vague "maybe."

This document outlines **Phase 3**, a strategic pivot to a self-organizing, multi-model network. We will simultaneously deliver a **clinically superior pacer** for our core users while building a **rigorously controlled protocol** to test our coherence hypotheses.

This new phase introduces two non-negotiable components: **Federated Clustering** and the **Controlled Event Protocol (CEP).**

---

## ⚙️ System Architecture: Edge-First with a Clustering Backend

Our architecture is now a hybrid model that prioritizes on-device computation while using a lightweight backend for intelligent model routing.

*   **Client / Edge (PWA):** The primary application running on the user's device.
    *   **Responsibilities:** All real-time, high-frequency tasks: physiological sensing (`sensor_engine.js`), pacing, and executing the experimental protocol (`cep_engine.js`).
    *   **Federated Model Loading:** It dynamically loads the correct, cluster-specific deep learning model by first querying the backend (`federated_manager.js`, `dl_engine.js`).

*   **Backend (AWS Lambda):** A stateless, lightweight service.
    *   **Responsibility:** The `Cluster Assigner`'s sole job is to run a clustering algorithm (currently stubbed) that assigns a `userId` to a specific physiological cluster (e.g., `cluster_A`, `cluster_B`).
    *   **Output:** It tells the client which cluster it belongs to and where to download the appropriate model (`/app/tfl/cluster_A/model.json`).

---

## 🔬 Core Components

### 1. Federated Clustering: Personalized and Safe

Instead of training one global model, we now deploy a **network of specialized models.**

1.  **Assignment:** When a user logs in, the `FederatedManager` on the client sends the `userId` to the `Cluster Assigner` Lambda.
2.  **Clustering:** The backend determines the user's physiological cluster. *In the future, this will be based on the user's baseline autonomic signature.* For now, it's a simple, deterministic assignment.
3.  **Dynamic Loading:** The client receives its cluster assignment and the path to the corresponding model. The `DLEngine` then downloads and initializes this specialized model.

This ensures that the pacing algorithm is always tailored to the user's specific neurotype, providing a safer and more effective experience for our clinical population.

### 2. The Controlled Event Protocol (CEP): A Rigorous Experimental Framework

The CEP replaces our reliance on unfalsifiable "global events" with a structured, repeatable, and analyzable experimental protocol. It is managed on the client by the `cep_engine.js`, which loads its configuration from `app/config/cep_protocol.json`.

A typical CEP session consists of three distinct stages:

| Stage        | Duration | Purpose                                                              | Data Tag           |
|--------------|----------|----------------------------------------------------------------------|--------------------|
| **BASELINE**   | 3 mins   | Establish a stable, pre-intervention physiological baseline.         | `cep_stage:baseline` |
| **INTERVENTION** | 5 mins   | User engages with the pacer or a specific coherence-training task. | `cep_stage:intervention` |
| **RECOVERY**   | 3 mins   | Measure the autonomic response and recovery post-intervention.       | `cep_stage:recovery` |

By tagging every data point with its CEP stage, we can now perform rigorous, time-locked analysis to test our hypotheses. For example, we can now ask: "Did the `INTERVENTION` stage produce a statistically significant change in `RMSSD` compared to the `BASELINE` stage?" This is a falsifiable, scientifically valid question.

---

## 🧪 A Testable Hypothesis

With this new architecture, we can revisit our scientific mission with newfound rigor. The **101Monkeys** app is a **networked, high-sensitivity "biometric antenna"** designed to test for non-local autonomic coherence.

*   **The Question:** Can a group of individuals, synchronized via the CEP, measurably influence each other's autonomic state in a way that is not explainable by local factors?
*   **The Method:** We can now conduct experiments where one group (the "senders") undergoes the `INTERVENTION` stage while another group (the "receivers") remains in a `BASELINE` stage. We can then analyze the receivers' data for anomalous physiological responses that are time-locked to the senders' intervention.
*   **The Data:** The `(F_t, Y_actual, cep_stage, cluster_id)` tuple is our new core data point, enabling a new level of analytical precision for both individual pacing and network-level signal detection.
