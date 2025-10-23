/**
 * @fileoverview Contains the logic for comparing a user's detected pose with a target pose.
 * This engine calculates the alignment of key body segments and provides feedback.
 */

console.log("Pose Matcher Engine Loaded.");

// Defines the joints that make up each major body segment.
const bodySegments = {
    'torso':          ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
    'left_arm':       ['left_shoulder', 'left_elbow', 'left_wrist'],
    'right_arm':      ['right_shoulder', 'right_elbow', 'right_wrist'],
    'left_leg':       ['left_hip', 'left_knee', 'left_ankle'],
    'right_leg':      ['right_hip', 'right_knee', 'right_ankle'],
};

// A simple threshold for determining if a joint is "aligned".
// If the normalized distance between the user's joint and the target joint
// is less than this value, it's considered a match.
const ALIGNMENT_THRESHOLD = 0.1; // 10% of the canvas width/height

/**
 * Calculates the Euclidean distance between two 2D points.
 * @param {{x: number, y: number}} p1 - The first point.
 * @param {{x: number, y: number}} p2 - The second point.
 * @returns {number} The distance between the points.
 */
function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Compares the user's current pose to a target pose and returns alignment feedback.
 * @param {object} userPose - The user's detected skeleton data.
 * @param {object} targetPose - The target skeleton data from the protocol library.
 * @returns {object} An object containing alignment status for each body segment (e.g., { left_arm: 'aligned' }).
 */
function matchPoses(userPose, targetPose) {
    const alignment = {};

    if (!userPose || !targetPose) {
        return {}; // Return empty object if data is missing
    }

    for (const segmentName in bodySegments) {
        const jointNames = bodySegments[segmentName];
        let isSegmentAligned = true;

        for (const jointName of jointNames) {
            const userJoint = userPose[jointName];
            const targetJoint = targetPose[jointName];

            // Ensure both joints are detected with sufficient confidence
            if (!userJoint || !targetJoint || userJoint.confidence < 0.5) {
                isSegmentAligned = false;
                break; // Skip this joint if it's unreliable
            }

            const distance = getDistance(userJoint, targetJoint);
            if (distance > ALIGNMENT_THRESHOLD) {
                isSegmentAligned = false;
                break; // One misaligned joint means the whole segment is misaligned
            }
        }
        alignment[segmentName] = isSegmentAligned ? 'aligned' : 'misaligned';
    }

    return alignment;
}

export const poseMatcher = {
    matchPoses,
};