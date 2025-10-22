import { postData } from './api.js';
import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

// --- DOM Elements ---
const videoElement = document.getElementById("input_video");
const protocolNameEl = document.getElementById("protocol-name");
const protocolLinkEl = document.getElementById("protocol-link");
const debugPanel = document.getElementById("debug-panel");
const debugOutput = document.getElementById("debug-output");

// --- MediaPipe and CV State ---
let lastHighCostMetrics = {};

const faceMesh = new FaceMesh({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
});

faceMesh.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await faceMesh.send({ image: videoElement });
    },
    width: 640,
    height: 360,
});
camera.start();

function onResults(results) {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
        const landmarks = results.multiFaceLandmarks[0];
        // In a real implementation, you would calculate these values.
        lastHighCostMetrics = {
            PupilDiameterPV: Math.random() * 0.5,
            GazeStabilityScore: Math.random(),
        };
    }
}

// --- Tiered Sensing Logic ---
function startSensing() {
    // Low-cost stream (always on)
    setInterval(async () => {
        const payload = {
            RMSSD: Math.random() * 50,
            RespRate: 12 + Math.random() * 6,
        };
        try {
            const result = await postData(payload);
            updateUI(result);
        } catch (e) {
            console.error("Low-cost stream failed:", e);
        }
    }, 30000); // Every 30 seconds

    // High-cost stream (conditional)
    setInterval(async () => {
        const payload = {
            RMSSD: Math.random() * 50,
            RespRate: 12 + Math.random() * 6,
            ...lastHighCostMetrics
        };
        try {
            const result = await postData(payload);
            updateUI(result);
        } catch (e) {
            console.error("High-cost stream failed:", e);
        }
    }, 300000); // Every 5 minutes
}

function updateUI(result) {
    protocolNameEl.textContent = result.body.protocolId;
    protocolLinkEl.href = result.body.videoUrl;
    if (result.debug) {
        debugOutput.textContent = JSON.stringify(JSON.parse(result.debug), null, 2);
    }
}

// --- Initialization ---
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === '1') {
    debugPanel.style.display = 'block';
}

startSensing();
