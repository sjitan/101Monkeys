/**
 * @fileoverview The core bioadaptive sequencing engine for the new DL architecture.
 * Manages the "Sense -> Evaluate -> Adapt -> Intervene" loop, using a mock GRU
 * model to dynamically select interventions and command the generative AI guide.
 */

import { ProtocolLibrary } from './protocol_library.js';
import { targetPoses } from './target_poses.js';
import { sensorEngine } from './sensor_engine.js';
import { aiGuideEngine } from './ai_guide_engine.js';
import { arRenderer } from './ar_renderer.js';
import { poseMatcher } from './pose_matcher.js';
import { poseEstimationEngine } from './pose_estimation.js';

console.log("Adaptive Sequencing Engine (GRU Arch) Loaded.");

// --- Mock On-Device DL Model (GRU with Input Attention) ---
const Pacer_Model = {
    predict: (ft_sequence, candidate_steps, archetype) => {
        // Mock "Input Attention": Pay more attention to certain features based on archetype
        const attentionWeights = {
            'Depleted': { rmssd: 1.5, pose_adherence: 1.0 },
            'Regulator-in-Training': { seda: 1.2, rf_bracing: 1.3 },
            'default': { rmssd: 1.0, seda: 1.0, pose_adherence: 1.0 }
        };
        const weights = attentionWeights[archetype] || attentionWeights.default;

        // Predict a U-score for each candidate
        return candidate_steps.map(step => {
            let u_score = Math.random() * 0.5; // Base score
            if (step.pose_id.includes('restorative')) u_score += 0.4;
            if (step.pose_id.includes('mobilizing')) u_score += 0.2;

            // Apply mock attention
            const last_ft = ft_sequence[ft_sequence.length - 1];
            if (last_ft) {
                u_score += (last_ft.z_rmssd * (weights.rmssd || 1.0) - last_ft.seda * (weights.seda || 1.0) + last_ft.pose_adherence * (weights.pose_adherence || 1.0)) * 0.1;
            }
            return { step, u_score: Math.max(0, Math.min(1, u_score)) };
        });
    }
};

let session = {
    isActive: false, timer: null, animationFrameId: null,
    archetype: 'Depleted', // Default
    currentProtocolPlan: null, currentStepIndex: -1,
    currentTargetPose: null, uiElements: null, currentUserPose: null,
    ft_sequence: [], SEQUENCE_LENGTH: 10,
};

function runAdaptiveStep() {
    if (!session.isActive) return;

    // 1. Sense: Get latest features and add to the sequence
    const raw_features = sensorEngine.getAllFeatures();
    const derived_features = {
        pose_adherence: poseMatcher.calculatePoseAdherence(session.currentUserPose, session.currentTargetPose),
        movement_quality: poseMatcher.calculateMovementQuality(session.currentUserPose),
    };
    const latest_ft = { ...raw_features, ...derived_features };
    session.ft_sequence.push(latest_ft);
    if (session.ft_sequence.length > session.SEQUENCE_LENGTH) {
        session.ft_sequence.shift();
    }

    // 2. Evaluate: Determine candidate next steps
    const plannedNextStep = session.currentProtocolPlan.sequence[session.currentStepIndex + 1];
    const candidates = plannedNextStep ? [plannedNextStep] : [];
    candidates.push(ProtocolLibrary.SafetyProtocol.sequence[0]); // Always consider a safe option

    // 3. Adapt: Use the DL model to select the best step
    if (session.ft_sequence.length < session.SEQUENCE_LENGTH) {
        console.log(`[DecisionEngine] Collecting feature sequence... ${session.ft_sequence.length}/${session.SEQUENCE_LENGTH}`);
        executeStep(session.currentProtocolPlan.sequence[0]); // Repeat first pose while collecting
        return;
    }

    const predictions = Pacer_Model.predict(session.ft_sequence, candidates, session.archetype);
    predictions.sort((a, b) => b.u_score - a.u_score);
    const bestNext = predictions[0];

    console.log(`[DecisionEngine] Adaptive Choice: '${bestNext.step.pose_id}' (U-score: ${bestNext.u_score.toFixed(2)})`);

    if (bestNext.step === plannedNextStep) {
        session.currentStepIndex++;
    } else {
        console.log("[DecisionEngine] Override: Switched to safety/restorative protocol.");
    }

    // 4. Intervene: Execute the chosen step
    executeStep(bestNext.step);
}

function executeStep(step) {
    const { pose_id, duration } = step;
    session.currentTargetPose = targetPoses[pose_id];

    // Command the generative AI guide
    aiGuideEngine.generate({ action: 'deliver_pose', pose_id });

    // Schedule the next adaptive check
    clearTimeout(session.timer);
    session.timer = setTimeout(runAdaptiveStep, duration);
}

function renderLoop() {
    if (!session.isActive) return;
    const alignment = poseMatcher.calculatePoseAdherence(session.currentUserPose, session.currentTargetPose) > 0.7
        ? { torso: 'aligned', left_arm: 'aligned', right_arm: 'aligned' }
        : { torso: 'misaligned', left_arm: 'misaligned', right_arm: 'misaligned' };
    arRenderer.render(session.uiElements.videoElement, session.currentTargetPose, session.currentUserPose, alignment);
    session.animationFrameId = requestAnimationFrame(renderLoop);
}

function startSession(archetype, uiElements) {
    if (session.isActive) return;
    console.log(`[DecisionEngine] Starting Adaptive Session for Archetype: ${archetype}`);

    session = { ...session, isActive: true, archetype, uiElements, currentProtocolPlan: ProtocolLibrary.getProtocol(archetype) };

    poseEstimationEngine.start(pose => { session.currentUserPose = pose; });
    session.animationFrameId = requestAnimationFrame(renderLoop);
    runAdaptiveStep(); // Kick off the loop
}

function stopSession() {
    if (!session.isActive) return;
    console.log("[DecisionEngine] Stopping Adaptive Session.");
    session.isActive = false;
    clearTimeout(session.timer);
    cancelAnimationFrame(session.animationFrameId);
    poseEstimationEngine.stop();
}

export const decisionEngine = {
    startSession,
    stopSession,
};