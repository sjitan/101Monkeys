/**
 * @fileoverview Defines the canonical, normalized keypoint coordinates for all target poses.
 * This data is used by the pose_matcher to calculate adherence and by the
 * ar_renderer to display the target pose "ghost" in the AR overlay.
 */

console.log("Target Poses Library Loaded.");

export const targetPoses = {
    // --- 1. Grounding / Centering Poses ---
    'pose_grounding_01': { // Seated Mountain Pose (Tadasana)
        'left_shoulder':  { x: 0.65, y: 0.25, confidence: 1.0 }, 'right_shoulder': { x: 0.35, y: 0.25, confidence: 1.0 },
        'left_elbow':     { x: 0.65, y: 0.40, confidence: 1.0 }, 'right_elbow':    { x: 0.35, y: 0.40, confidence: 1.0 },
        'left_wrist':     { x: 0.65, y: 0.55, confidence: 1.0 }, 'right_wrist':    { x: 0.35, y: 0.55, confidence: 1.0 },
        'left_hip':       { x: 0.60, y: 0.50, confidence: 1.0 }, 'right_hip':      { x: 0.40, y: 0.50, confidence: 1.0 },
    },

    // --- 2. Mobilizing / Energizing Poses ---
    'pose_mobilizing_01_cat': { // Seated Cat Pose
        'left_shoulder':  { x: 0.62, y: 0.30, confidence: 1.0 }, 'right_shoulder': { x: 0.38, y: 0.30, confidence: 1.0 },
        'left_hip':       { x: 0.60, y: 0.52, confidence: 1.0 }, 'right_hip':      { x: 0.40, y: 0.52, confidence: 1.0 },
    },
    'pose_mobilizing_01_cow': { // Seated Cow Pose
        'left_shoulder':  { x: 0.68, y: 0.28, confidence: 1.0 }, 'right_shoulder': { x: 0.32, y: 0.28, confidence: 1.0 },
        'left_hip':       { x: 0.60, y: 0.48, confidence: 1.0 }, 'right_hip':      { x: 0.40, y: 0.48, confidence: 1.0 },
    },

    // --- 3. Restorative / Release Poses ---
    'pose_restorative_01': { // Supported Forward Fold
        'left_shoulder':  { x: 0.65, y: 0.35, confidence: 1.0 }, 'right_shoulder': { x: 0.35, y: 0.35, confidence: 1.0 },
        'left_elbow':     { x: 0.70, y: 0.50, confidence: 1.0 }, 'right_elbow':    { x: 0.30, y: 0.50, confidence: 1.0 },
        'left_wrist':     { x: 0.75, y: 0.65, confidence: 1.0 }, 'right_wrist':    { x: 0.25, y: 0.65, confidence: 1.0 },
        'left_hip':       { x: 0.60, y: 0.50, confidence: 1.0 }, 'right_hip':      { x: 0.40, y: 0.50, confidence: 1.0 },
    },
};
