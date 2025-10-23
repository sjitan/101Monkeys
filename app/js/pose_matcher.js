/**
 * @fileoverview Calculates pose adherence and movement quality scores.
 * This engine compares a user's detected pose with a target pose, providing
 * quantitative metrics for the main DL model.
 */

console.log("Pose Matcher Engine (with Adherence Scores) Loaded.");

const ALIGNMENT_THRESHOLD = 0.1; // 10% tolerance for joint distance

let previousPose = null;
let movementHistory = [];
const MOVEMENT_HISTORY_LENGTH = 10; // Frames to average for stability

/**
 * Calculates a PoseAdherence_score based on how well the user's pose matches the target.
 * @param {object} userPose - The user's detected skeleton data.
 * @param {object} targetPose - The target skeleton data.
 * @returns {number} A score from 0.0 to 1.0.
 */
function calculatePoseAdherence(userPose, targetPose) {
    if (!userPose || !targetPose) return 0;

    let totalDistance = 0;
    let jointCount = 0;

    for (const jointName in targetPose) {
        const userJoint = userPose[jointName];
        const targetJoint = targetPose[jointName];

        if (userJoint && userJoint.confidence > 0.5) {
            const distance = Math.sqrt(Math.pow(userJoint.x - targetJoint.x, 2) + Math.pow(userJoint.y - targetJoint.y, 2));
            // Inversely weight the distance: closer is better.
            totalDistance += Math.min(distance, ALIGNMENT_THRESHOLD);
            jointCount++;
        }
    }

    if (jointCount === 0) return 0;

    const averageDistance = totalDistance / jointCount;
    // Normalize the score: 1.0 for perfect alignment, 0.0 at the threshold.
    return 1.0 - (averageDistance / ALIGNMENT_THRESHOLD);
}

/**
 * Calculates a MovementQuality score based on the stability of the user's pose over time.
 * @param {object} userPose - The user's current detected skeleton data.
 * @returns {number} A score from 0.0 to 1.0, where 1.0 is perfectly still.
 */
function calculateMovementQuality(userPose) {
    if (!userPose || !previousPose) {
        previousPose = userPose;
        return 1.0; // Assume perfect stability on the first frame
    }

    let totalMovement = 0;
    let jointCount = 0;

    for (const jointName in userPose) {
        const currentJoint = userPose[jointName];
        const prevJoint = previousPose[jointName];

        if (currentJoint && prevJoint && currentJoint.confidence > 0.5) {
            totalMovement += Math.sqrt(Math.pow(currentJoint.x - prevJoint.x, 2) + Math.pow(currentJoint.y - prevJoint.y, 2));
            jointCount++;
        }
    }

    previousPose = userPose;
    if (jointCount === 0) return 1.0;

    // Add current movement to history and keep it at a fixed length
    movementHistory.push(totalMovement / jointCount);
    if (movementHistory.length > MOVEMENT_HISTORY_LENGTH) {
        movementHistory.shift();
    }

    const averageMovement = movementHistory.reduce((a, b) => a + b, 0) / movementHistory.length;
    // Normalize: Assume a small amount of movement is normal. Inversely score it.
    // The '0.05' is a magic number representing a high amount of jitter.
    return Math.max(0, 1.0 - (averageMovement / 0.05));
}

export const poseMatcher = {
    calculatePoseAdherence,
    calculateMovementQuality,
};