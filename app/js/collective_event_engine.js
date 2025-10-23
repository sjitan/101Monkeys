/**
 * @fileoverview Orchestrates the "Unified Adaptive 3-Stage Protocol".
 * Manages the transitions between Individual Calibration (Stage 1), Group Sync (Stage 2),
 * and Individual Equilibrium (Stage 3), while the decision_engine handles the
 * core adaptive logic within each stage.
 */

import { decisionEngine } from './decision_engine.js';
import { aiGuideEngine } from './ai_guide_engine.js';

console.log("3-Stage Protocol Orchestrator Loaded.");

// Durations for each stage (shortened for testing)
const STAGE_1_DURATION = 20 * 1000; // 20 seconds
const STAGE_2_DURATION = 30 * 1000; // 30 seconds
const STAGE_3_DURATION = 20 * 1000; // 20 seconds

let session = {
    isActive: false,
    stage: 0,
    timer: null,
    uiElements: null,
};

function logStage(message) {
    console.log(`%c[Orchestrator] ${message}`, 'font-weight: bold; color: purple;');
}

// --- Stage Transitions ---

function runStage1() {
    logStage("Starting Stage 1: Individual Calibration");
    session.stage = 1;
    decisionEngine.startSession('Depleted', session.uiElements); // Start the on-device adaptive loop
    session.timer = setTimeout(runStage2, STAGE_1_DURATION);
}

function runStage2() {
    logStage("Starting Stage 2: Group Sync");
    session.stage = 2;
    // In a real app, this would involve connecting to the fl_server via WebSocket.
    // For now, we'll just have the AI guide announce it.
    aiGuideEngine.generate({ action: 'sync_start', group_size: 50 });

    // The on-device engine continues to run, but could be influenced by server commands.
    session.timer = setTimeout(runStage3, STAGE_2_DURATION);
}

function runStage3() {
    logStage("Starting Stage 3: Individual Equilibrium");
    session.stage = 3;
    // Disconnect from WebSocket here.
    // The on-device engine continues its loop with a new goal.
    aiGuideEngine.generate({ action: 'group_regulate', cue: 'The group session has ended. Let\'s return to your personal rhythm.' });
    session.timer = setTimeout(stopEvent, STAGE_3_DURATION);
}


// --- Public API ---

function startEvent(uiElements) {
    if (session.isActive) return;
    session = { ...session, isActive: true, uiElements };
    runStage1();
    uiElements.buttonElement.textContent = 'Stop Session';
}

function stopEvent() {
    if (!session.isActive) return;
    logStage("Session Complete.");
    session.isActive = false;
    clearTimeout(session.timer);
    decisionEngine.stopSession();

    if(session.uiElements) {
        session.uiElements.buttonElement.textContent = 'Start Session';
        const ctx = session.uiElements.canvasElement.getContext('2d');
        ctx.clearRect(0, 0, session.uiElements.canvasElement.width, session.uiElements.canvasElement.height);
    }
}

export const sessionOrchestrator = {
    startEvent,
    stopEvent,
};