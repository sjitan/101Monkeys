/**
 * @fileoverview Manages the state and flow of the 15-minute Collective Resonance Event.
 * This engine orchestrates the three main stages of the event:
 * 1. Individualized Triage & Warm-Up (Audio Only)
 * 2. Group Sync & Coherence (Audio + AR Visuals)
 * 3. Individualized Cool-Down & Stabilization (Audio Only)
 */

import { decisionEngine } from './decision_engine.js';
import { audioEngine } from './audio_engine.js';
import { ProtocolLibrary } from './protocol_library.js';
import { poseEstimationEngine } from './pose_estimation.js';
import { poseMatcher } from './pose_matcher.js';
import { arRenderer } from './ar_renderer.js';

console.log("Collective Event Engine (3-Stage AR) Loaded.");

// Use shorter durations for easier testing.
const WARMUP_DURATION = 7 * 1000;   // 7 seconds for testing
const GROUP_SYNC_DURATION = 15 * 1000; // 15 seconds for testing (duration of the AR protocol)
const COOLDOWN_DURATION = 5 * 1000;  // 5 seconds for testing

let state = {
    stage: 'idle',
    timer: null,
    protocol: null,
    startTime: 0,
    currentUserPose: null,
    currentTargetPose: null,
    lastAlignment: {},
    animationFrameId: null,
    uiElements: null,
};

function logStage(message) {
    console.log(`%c[EventEngine] ${message}`, 'font-weight: bold; color: blue;');
    if (state.uiElements && state.uiElements.statusElement) {
        state.uiElements.statusElement.textContent = `Status: ${message}`;
    }
}

// --- AR Render Loop ---
function renderLoop() {
    if (state.stage !== 'group_sync') return; // Only render during the AR stage

    const elapsedTime = Date.now() - state.startTime;
    const { poses } = state.protocol;
    let currentTarget = state.currentTargetPose;
    for (const pose of poses) {
        if (elapsedTime >= pose.timestamp) {
            currentTarget = pose;
        }
    }
    if (state.currentTargetPose !== currentTarget) {
        state.currentTargetPose = currentTarget;
        logStage(`Group Sync - New Pose: ${currentTarget.name}`);
    }

    state.lastAlignment = poseMatcher.matchPoses(state.currentUserPose, currentTarget?.pose);
    arRenderer.render(state.uiElements.videoElement, currentTarget?.pose, state.currentUserPose, state.lastAlignment);

    state.animationFrameId = requestAnimationFrame(renderLoop);
}


// --- Event Stages ---
function runStage1_WarmUp() {
    logStage('Stage 1: Individualized Warm-Up');
    state.stage = 'warmup';

    const triageDecision = decisionEngine.runFastTriage();
    audioEngine.play(triageDecision.audioProtocol);

    state.timer = setTimeout(runStage2_GroupSync, WARMUP_DURATION);
}

function runStage2_GroupSync() {
    logStage('Stage 2: Group Sync & Coherence (AR Active)');
    state.stage = 'group_sync';
    state.protocol = ProtocolLibrary.getProtocol('Default'); // The AR-enabled protocol
    state.startTime = Date.now(); // Reset timer for the protocol's timestamps

    audioEngine.play('dojo_group/aligned_chair_yoga_flow_01.mp3');
    poseEstimationEngine.start(pose => { state.currentUserPose = pose; });

    state.animationFrameId = requestAnimationFrame(renderLoop);

    state.timer = setTimeout(runStage3_Cooldown, GROUP_SYNC_DURATION);
}

function runStage3_Cooldown() {
    logStage('Stage 3: Individualized Cool-Down');
    state.stage = 'cooldown';

    // Clean up AR resources
    cancelAnimationFrame(state.animationFrameId);
    poseEstimationEngine.stop();
    const { canvasElement } = state.uiElements;
    const ctx = canvasElement.getContext('2d');
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    const triageDecision = decisionEngine.runFastTriage();
    // In a real app, we'd have specific cool-down audio. Reusing warm-up for now.
    const cooldownAudio = triageDecision.userArchetype === 'Amplifier'
        ? 'dojo_amplifier/cooldown_stabilize_01.mp3'
        : triageDecision.audioProtocol;
    audioEngine.play(cooldownAudio);

    state.timer = setTimeout(endEvent, COOLDOWN_DURATION);
}

function endEvent() {
    logStage('Event Complete');
    state.stage = 'idle';
    clearTimeout(state.timer);

    if (state.uiElements) {
        state.uiElements.buttonElement.textContent = 'Start AR Session';
    }
}

// --- Public API ---
function startEvent(uiElements) {
    if (state.stage !== 'idle') return;

    // Correct order: Set UI elements first, then log.
    state.uiElements = uiElements;
    logStage("Event Initializing...");

    arRenderer.initialize(uiElements.canvasElement);

    runStage1_WarmUp();
}

function stopEvent() {
    if (state.stage === 'idle') return;
    logStage('Event Manually Stopped');
    clearTimeout(state.timer);
    cancelAnimationFrame(state.animationFrameId);
    poseEstimationEngine.stop();
    endEvent();
}

export const collectiveEventEngine = {
    startEvent,
    stopEvent,
};