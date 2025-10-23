/**
 * @fileoverview The core bioadaptive sequencing engine.
 * This engine manages the continuous "Sense -> Evaluate -> Adapt -> Intervene" loop,
 * dynamically selecting the next best intervention based on real-time physiological feedback.
 */

import { ProtocolLibrary } from './protocol_library.js';
import { targetPoses } from './target_poses.js';
import { sensorEngine } from './sensor_engine.js';
import { audioEngine } from './audio_engine.js';
import { arRenderer } from './ar_renderer.js';
import { poseMatcher } from './pose_matcher.js';
import { poseEstimationEngine } from './pose_estimation.js';


console.log("Adaptive Sequencing Engine Loaded.");

// --- Mock Pacer_Model ---
const Pacer_Model = {
    predict: (current_ft, candidate_step) => {
        if (candidate_step.pose_id.includes('restorative')) return 0.9;
        if (candidate_step.pose_id.includes('mobilizing')) return 0.7;
        return 0.5;
    }
};

let session = {
    isActive: false,
    timer: null,
    animationFrameId: null,
    currentProtocol: null,
    currentStepIndex: -1,
    currentTargetPose: null,
    uiElements: null,
    currentUserPose: null,
};

// --- Main Session Logic ---

function runAdaptiveStep() {
    if (!session.isActive) return;

    const latest_ft = sensorEngine.getMockFeatures();
    const plannedNextStep = session.currentProtocol.sequence[session.currentStepIndex + 1];

    // Terminate if the protocol is complete
    if (!plannedNextStep) {
        stopSession();
        return;
    }

    const candidates = [plannedNextStep, ProtocolLibrary.SafetyProtocol.sequence[0]];

    const predictions = candidates.map(step => ({
        step: step,
        u_score: Pacer_Model.predict(latest_ft, step)
    }));
    predictions.sort((a, b) => b.u_score - a.u_score);

    const bestNextStep = predictions[0].step;
    console.log(`[DecisionEngine] Adaptive Choice: Selected '${bestNextStep.pose_id}' with score ${predictions[0].u_score.toFixed(2)}`);

    if (bestNextStep === plannedNextStep) {
        session.currentStepIndex++;
    } else {
        console.log(`[DecisionEngine] Overriding planned protocol with safety step.`);
    }

    executeStep(bestNextStep);
}

function executeStep(step) {
    const { pose_id, duration } = step;

    audioEngine.play(`${pose_id}.mp3`);
    session.currentTargetPose = targetPoses[pose_id];

    session.timer = setTimeout(runAdaptiveStep, duration);
}

function renderLoop() {
    if (!session.isActive) return;
    const alignment = poseMatcher.matchPoses(session.currentUserPose, session.currentTargetPose);
    arRenderer.render(session.uiElements.videoElement, session.currentTargetPose, session.currentUserPose, alignment);
    session.animationFrameId = requestAnimationFrame(renderLoop);
}

function startSession(archetype, uiElements) {
    if (session.isActive) return;
    console.log("[DecisionEngine] Starting Adaptive Session...");

    session = {
        isActive: true,
        timer: null,
        animationFrameId: null,
        currentProtocol: ProtocolLibrary.getProtocol(archetype),
        currentStepIndex: -1,
        currentTargetPose: null,
        uiElements: uiElements,
        currentUserPose: null,
    };

    poseEstimationEngine.start(pose => { session.currentUserPose = pose; });

    // Start the single, continuous render loop
    session.animationFrameId = requestAnimationFrame(renderLoop);

    // Kick off the first adaptive step
    runAdaptiveStep();
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