/**
 * @fileoverview Manages the state and flow of the 15-minute Collective Resonance Event.
 * This module orchestrates the three main stages of the event:
 * 1. Individualized Triage & Warm-Up (5 mins)
 * 2. Group Sync & Coherence (5 mins)
 * 3. Individualized Cool-Down & Stabilization (5 mins)
 */

import { decisionEngine } from './decision_engine.js';
import { audioEngine } from './audio_engine.js';
import { sensorEngine } from './sensor_engine.js';

// Constants for event timing (in milliseconds for setTimeout)
// Using shorter durations for easier testing.
const WARMUP_DURATION = 5 * 1000; // 5 seconds for testing
const GROUP_SYNC_DURATION = 5 * 1000; // 5 seconds for testing
const COOLDOWN_DURATION = 5 * 1000; // 5 seconds for testing
// const WARMUP_DURATION = 5 * 60 * 1000; // 5 minutes
// const GROUP_SYNC_DURATION = 5 * 60 * 1000; // 5 minutes
// const COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

let eventState = {
    stage: 'idle',
    timer: null,
};

/**
 * Logs the current stage of the event.
 * @param {string} message - The message to log.
 */
function logStage(message) {
    console.log(`%c[CollectiveEventEngine] ${message}`, 'font-weight: bold; color: blue;');
}

/**
 * Runs Stage 1: Individualized Triage & Warm-Up.
 * This stage determines the user's current state and plays a tailored warm-up protocol.
 */
function runStage1_WarmUp() {
    logStage('Stage 1: Individualized Triage & Warm-Up STARTING');
    eventState.stage = 'warmup';

    // 1. Run the Fast Triage to get an immediate decision.
    const triageDecision = decisionEngine.runFastTriage();

    // 2. Command the audio engine to play the selected protocol.
    if (triageDecision && triageDecision.audioProtocol) {
        audioEngine.play(triageDecision.audioProtocol);
    } else {
        console.error('[CollectiveEventEngine] Triage failed, cannot play warm-up audio.');
        // In a real app, we might play a default "safe" protocol here.
    }

    // 3. Set a timer to transition to the next stage.
    eventState.timer = setTimeout(runStage2_GroupSync, WARMUP_DURATION);
}

/**
 * Runs Stage 2: Group Sync & Coherence.
 * This stage plays a synchronized audio file for all participants and increases sensor sensitivity.
 */
function runStage2_GroupSync() {
    logStage('Stage 2: Group Sync & Coherence STARTING');
    eventState.stage = 'group_sync';

    // 1. Simulate receiving a "START" packet from a time-sync service.
    logStage('Time-Sync "START" packet received.');

    // 2. Command the audio engine to play the synchronized group protocol.
    audioEngine.play('dojo_group/aligned_chair_yoga_flow_01.mp3');

    // 3. Set the sensor engine to maximum sensitivity for analysis.
    // In a real app, this might increase sampling rates or enable more sensors.
    sensorEngine.setSensitivity('high'); // Assuming sensorEngine has this method.
    logStage('Sensor sensitivity set to HIGH for coherence analysis.');

    // 4. Set a timer to transition to the next stage.
    eventState.timer = setTimeout(runStage3_Cooldown, GROUP_SYNC_DURATION);
}

/**
 * Runs Stage 3: Individualized Cool-Down & Stabilization.
 * This stage re-triages the user and plays a calming, individualized cool-down protocol.
 */
function runStage3_Cooldown() {
    logStage('Stage 3: Individualized Cool-Down & Stabilization STARTING');
    eventState.stage = 'cooldown';

    // 1. Reset sensor sensitivity to normal.
    sensorEngine.setSensitivity('normal');
    logStage('Sensor sensitivity reset to NORMAL.');

    // 2. Run the Fast Triage again to assess the user's post-session state.
    // The logic inside runFastTriage might be different for a cool-down,
    // but for now, we'll reuse it.
    const triageDecision = decisionEngine.runFastTriage();

    // 3. Command the audio engine to play an appropriate cool-down protocol.
    // We will select a specific cool-down file based on the archetype.
    let cooldownAudio;
    if (triageDecision && triageDecision.userArchetype === 'Amplifier') {
        cooldownAudio = 'dojo_amplifier/cooldown_stabilize_01.mp3';
    } else {
        // Default or Insulated-specific cooldown
        cooldownAudio = 'dojo_amplifier/cooldown_stabilize_01.mp3'; // Using amplifier's for now
    }
    audioEngine.play(cooldownAudio);


    // 4. Set a timer for the end of the event.
    eventState.timer = setTimeout(endEvent, COOLDOWN_DURATION);
}

/**
 * Ends the event and cleans up.
 */
function endEvent() {
    logStage('Event COMPLETE. Cleaning up.');
    eventState.stage = 'idle';
    clearTimeout(eventState.timer);
    eventState.timer = null;
}

/**
 * Starts the Collective Resonance Event.
 */
function startEvent() {
    if (eventState.stage !== 'idle') {
        console.warn('[CollectiveEventEngine] Event is already running.');
        return;
    }
    logStage('Collective Resonance Event Initializing...');
    runStage1_WarmUp();
}

export const collectiveEventEngine = {
    startEvent,
};