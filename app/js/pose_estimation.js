/**
 * @fileoverview Simulates a real-time Pose Estimation engine like MediaPipe or TensorFlow.js MoveNet.
 * This mock engine provides a continuous stream of skeleton data (joint coordinates)
 * to emulate the output of a live camera feed being processed by a pose detection model.
 */

console.log("Mock Pose Estimation Engine Loaded.");

// A base seated pose, representing a user sitting upright in a chair.
// Coordinates are normalized (0.0 to 1.0).
const baseSeatedPose = {
    'nose':          { x: 0.50, y: 0.15, z: 0.0, confidence: 0.99 },
    'left_eye':      { x: 0.52, y: 0.13, z: 0.0, confidence: 0.99 },
    'right_eye':     { x: 0.48, y: 0.13, z: 0.0, confidence: 0.99 },
    'left_shoulder':  { x: 0.65, y: 0.25, z: 0.0, confidence: 0.98 },
    'right_shoulder': { x: 0.35, y: 0.25, z: 0.0, confidence: 0.98 },
    'left_elbow':     { x: 0.75, y: 0.40, z: 0.0, confidence: 0.95 },
    'right_elbow':    { x: 0.25, y: 0.40, z: 0.0, confidence: 0.95 },
    'left_wrist':     { x: 0.85, y: 0.55, z: 0.0, confidence: 0.92 },
    'right_wrist':    { x: 0.15, y: 0.55, z: 0.0, confidence: 0.92 },
    'left_hip':       { x: 0.60, y: 0.50, z: 0.0, confidence: 0.99 },
    'right_hip':      { x: 0.40, y: 0.50, z: 0.0, confidence: 0.99 },
    'left_knee':      { x: 0.60, y: 0.70, z: 0.0, confidence: 0.96 },
    'right_knee':     { x: 0.40, y: 0.70, z: 0.0, confidence: 0.96 },
    'left_ankle':     { x: 0.60, y: 0.90, z: 0.0, confidence: 0.90 },
    'right_ankle':    { x: 0.40, y: 0.90, z: 0.0, confidence: 0.90 },
};

let intervalId = null;

/**
 * Generates a new pose by applying a small amount of random noise to the base pose.
 * This simulates the natural, subtle movements of a person sitting still.
 * @returns {object} A randomized skeleton object.
 */
function generateRandomizedPose() {
    const newPose = {};
    for (const jointName in baseSeatedPose) {
        const { x, y, z, confidence } = baseSeatedPose[jointName];
        newPose[jointName] = {
            x: x + (Math.random() - 0.5) * 0.02, // Small horizontal noise
            y: y + (Math.random() - 0.5) * 0.02, // Small vertical noise
            z: z,
            // Simulate slight fluctuations in model confidence
            confidence: Math.max(0, confidence * (0.98 + Math.random() * 0.04))
        };
    }
    return newPose;
}

/**
 * Starts the mock pose estimation stream.
 * @param {function(object): void} callback - The function to call with new pose data on each "frame".
 */
function start(callback) {
    if (intervalId) {
        console.warn('[PoseEstimation] Estimation is already running.');
        return;
    }
    console.log('[PoseEstimation] Starting mock pose estimation stream...');
    // Provide an initial pose immediately upon starting
    callback(generateRandomizedPose());

    // Then, start the continuous stream to simulate a live camera feed
    intervalId = setInterval(() => {
        const pose = generateRandomizedPose();
        callback(pose);
    }, 100); // Simulate ~10 frames per second
}

/**
 * Stops the mock pose estimation stream.
 */
function stop() {
    if (intervalId) {
        console.log('[PoseEstimation] Stopping mock pose estimation stream.');
        clearInterval(intervalId);
        intervalId = null;
    }
}

export const poseEstimationEngine = {
    start,
    stop,
};