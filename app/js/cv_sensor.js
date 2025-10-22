// --- Integrated Computer Vision Sensor ---
// This script now imports and uses the auth and api modules
// to create a complete, functional data pipeline from client to server.

import { FaceMesh } from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";
import * as auth from './cognito_auth.js';
import * as api from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const videoElement = document.getElementById("input_video");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");

    // --- Data Buffers & State ---
    const PUPIL_DIAMETER_BUFFER_SIZE = 30;
    const GAZE_BUFFER_SIZE = 30;
    let pupilDiameterBuffer = [];
    let gazeBuffer = [];

    let lastMetrics = {
        pupilDiameterPV: 0,
        gazeStabilityScore: 100,
    };

    // --- Helper Functions ---
    const getDistance = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    const calculateMean = (arr) => arr.reduce((acc, val) => acc + val, 0) / arr.length;
    const calculateVectorMean = (arr) => {
        const sum = arr.reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), { x: 0, y: 0 });
        return { x: sum.x / arr.length, y: sum.y / arr.length };
    };

    // --- Main CV Logic ---
    function onResults(results) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
            const landmarks = results.multiFaceLandmarks[0];

            // Pupillometry
            const leftPupilDiameter = getDistance(landmarks[475], landmarks[477]);
            const rightPupilDiameter = getDistance(landmarks[470], landmarks[472]);
            const avgPupilDiameter = (leftPupilDiameter + rightPupilDiameter) / 2.0;
            pupilDiameterBuffer.push(avgPupilDiameter);
            if (pupilDiameterBuffer.length > PUPIL_DIAMETER_BUFFER_SIZE) pupilDiameterBuffer.shift();

            if (pupilDiameterBuffer.length === PUPIL_DIAMETER_BUFFER_SIZE) {
                const maxDiameter = Math.max(...pupilDiameterBuffer);
                const minDiameter = Math.min(...pupilDiameterBuffer);
                lastMetrics.pupilDiameterPV = (maxDiameter - minDiameter) * 1000;
            }

            // Gaze Stability
            const pupilCenterX = (landmarks[475].x + landmarks[477].x) / 2;
            const pupilCenterY = (landmarks[475].y + landmarks[477].y) / 2;
            gazeBuffer.push({ x: pupilCenterX, y: pupilCenterY });
            if (gazeBuffer.length > GAZE_BUFFER_SIZE) gazeBuffer.shift();

            if (gazeBuffer.length === GAZE_BUFFER_SIZE) {
                const centroid = calculateVectorMean(gazeBuffer);
                const distances = gazeBuffer.map(pt => getDistance(pt, centroid));
                const meanDeviation = calculateMean(distances);
                lastMetrics.gazeStabilityScore = Math.max(0, 100 - (meanDeviation * 2000));
            }
        }
        canvasCtx.restore();
    }

    // --- MediaPipe Initialization ---
    const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    faceMesh.onResults(onResults);

    // --- Camera & Main Loop ---
    const camera = new Camera(videoElement, {
        onFrame: async () => { await faceMesh.send({ image: videoElement }); },
        width: 1280, height: 720
    });
    camera.start();

    // --- Integrated Data Submission Interval ---
    setInterval(async () => {
        try {
            // 1. Get user identity from the auth module.
            const userId = await auth.getUserId();
            const jwt = await auth.getJwtToken();

            if (!userId || !jwt) {
                console.warn("User not authenticated. Halting data submission.");
                return;
            }

            // 2. Construct the payload with real and mock data.
            const payload = {
                userId: userId,
                rmssd: Math.random() * 25 + 20, // Mock rPPG-derived HRV
                pupilDiameterPV: lastMetrics.pupilDiameterPV,
                gazeStabilityScore: lastMetrics.gazeStabilityScore,
                timestamp: new Date().toISOString()
            };

            // 3. Use the API module to send the data.
            console.log("Submitting metrics:", payload);
            const response = await api.postPacerData(payload, jwt);
            console.log("API Response:", response);

        } catch (error) {
            console.error("Failed during data submission interval:", error);
        }
    }, 5000); // Submit data every 5 seconds
});
