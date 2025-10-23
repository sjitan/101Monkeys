/**
 * @fileoverview Manages all rendering on the AR canvas.
 * This includes drawing the live video feed, the target pose "ghost",
 * and the user's real-time, color-coded skeleton.
 */

console.log("AR Renderer Engine Loaded.");

// --- Constants ---
const TARGET_COLOR = 'rgba(200, 200, 200, 0.8)'; // Light grey for the target pose
const ALIGNED_COLOR = 'rgba(0, 255, 0, 0.9)';   // Green for aligned segments
const MISALIGNED_COLOR = 'rgba(255, 0, 0, 0.9)'; // Red for misaligned segments
const LINE_WIDTH = 5;

// Defines the bone connections between joints for drawing the skeleton.
const boneConnections = [
    // Torso
    ['left_shoulder', 'right_shoulder'], ['left_hip', 'right_hip'],
    ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
    // Arms
    ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
    // Legs
    ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
];

let canvas = null;
let ctx = null;

/**
 * Initializes the renderer with the canvas element.
 * @param {HTMLCanvasElement} canvasElement - The canvas to draw on.
 */
function initialize(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    console.log('[ARRenderer] Initialized with canvas.');
}

/**
 * Draws a single bone (line) on the canvas.
 * @param {object} pose - The skeleton data.
 * @param {Array<string>} jointNames - The two joints to connect.
 * @param {string} color - The color to draw the line.
 * @param {number} width - The width of the line.
 */
function drawBone(pose, jointNames, color, width) {
    const [startJoint, endJoint] = jointNames.map(name => pose[name]);
    if (startJoint && endJoint && startJoint.confidence > 0.5 && endJoint.confidence > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startJoint.x * canvas.width, startJoint.y * canvas.height);
        ctx.lineTo(endJoint.x * canvas.width, endJoint.y * canvas.height);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }
}

/**
 * Draws a complete skeleton on the canvas.
 * @param {object} pose - The skeleton data to draw.
 * @param {string|object} color - The color for the skeleton. Can be a single color string
 *   or an object mapping segments to colors (for the user's pose).
 */
function drawSkeleton(pose, color) {
    if (!pose) return;

    for (const [segment, joints] of Object.entries({
        'torso': [['left_shoulder', 'right_shoulder'], ['left_hip', 'right_hip'], ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip']],
        'left_arm': [['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist']],
        'right_arm': [['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist']],
        'left_leg': [['left_hip', 'left_knee'], ['left_knee', 'left_ankle']],
        'right_leg': [['right_hip', 'right_knee'], ['right_knee', 'right_ankle']],
    })) {
        const segmentColor = typeof color === 'object' ? color[segment] : color;
        for (const bone of joints) {
            drawBone(pose, bone, segmentColor, LINE_WIDTH);
        }
    }
}


/**
 * The main render loop function. Clears the canvas and draws all elements.
 * @param {HTMLVideoElement} videoElement - The video feed to draw.
 * @param {object} targetPose - The target pose "ghost".
 * @param {object} userPose - The user's current pose.
 * @param {object} alignment - The alignment feedback from the pose matcher.
 */
function render(videoElement, targetPose, userPose, alignment) {
    if (!ctx) return;

    // 1. Clear the canvas and draw the video feed as the background.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // 2. Draw the target pose "ghost".
    drawSkeleton(targetPose, TARGET_COLOR);

    // 3. Determine the color for each segment of the user's pose.
    const userPoseColors = {};
    for (const segment in alignment) {
        userPoseColors[segment] = alignment[segment] === 'aligned' ? ALIGNED_COLOR : MISALIGNED_COLOR;
    }

    // 4. Draw the user's skeleton with the determined colors.
    drawSkeleton(userPose, userPoseColors);
}

export const arRenderer = {
    initialize,
    render,
};