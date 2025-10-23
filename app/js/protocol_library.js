// Dojo Protocol Library: Defines tailored Pacer protocols ("Dojos") for each Autonomic Archetype.
// This version is enhanced to include target pose data for the AR feature.
console.log("Dojo Protocol Library (with AR Pose Data) Loaded.");

// --- Target Pose Definitions ---
// These are the "ghost" poses the user will try to match.
const seatedTadasana = {
    'left_shoulder':  { x: 0.65, y: 0.25, confidence: 1.0 }, 'right_shoulder': { x: 0.35, y: 0.25, confidence: 1.0 },
    'left_elbow':     { x: 0.70, y: 0.40, confidence: 1.0 }, 'right_elbow':    { x: 0.30, y: 0.40, confidence: 1.0 },
    'left_wrist':     { x: 0.75, y: 0.55, confidence: 1.0 }, 'right_wrist':    { x: 0.25, y: 0.55, confidence: 1.0 },
    'left_hip':       { x: 0.60, y: 0.50, confidence: 1.0 }, 'right_hip':      { x: 0.40, y: 0.50, confidence: 1.0 },
    'left_knee':      { x: 0.60, y: 0.70, confidence: 1.0 }, 'right_knee':     { x: 0.40, y: 0.70, confidence: 1.0 },
    'left_ankle':     { x: 0.60, y: 0.90, confidence: 1.0 }, 'right_ankle':    { x: 0.40, y: 0.90, confidence: 1.0 },
};

const seatedForwardFold = {
    'left_shoulder':  { x: 0.65, y: 0.35, confidence: 1.0 }, 'right_shoulder': { x: 0.35, y: 0.35, confidence: 1.0 },
    'left_elbow':     { x: 0.70, y: 0.50, confidence: 1.0 }, 'right_elbow':    { x: 0.30, y: 0.50, confidence: 1.0 },
    'left_wrist':     { x: 0.75, y: 0.65, confidence: 1.0 }, 'right_wrist':    { x: 0.25, y: 0.65, confidence: 1.0 },
    'left_hip':       { x: 0.60, y: 0.50, confidence: 1.0 }, 'right_hip':      { x: 0.40, y: 0.50, confidence: 1.0 },
    'left_knee':      { x: 0.60, y: 0.70, confidence: 1.0 }, 'right_knee':     { x: 0.40, y: 0.70, confidence: 1.0 },
    'left_ankle':     { x: 0.60, y: 0.90, confidence: 1.0 }, 'right_ankle':    { x: 0.40, y: 0.90, confidence: 1.0 },
};


export const ProtocolLibrary = {
    getProtocol(archetype) {
        // For the MVP, we will enhance the DefaultProtocol with AR data.
        // The other protocols will remain unchanged for now.
        switch (archetype) {
            case 'Insulated':
                return this.ActivationDojo;
            case 'Amplifier':
                return this.GatingDojo;
            case 'Operator':
                return this.OperatorDojo;
            case 'Stabilizer':
            default:
                return this.DefaultProtocol;
        }
    },

    ActivationDojo: { /* ... (unchanged) ... */ },
    GatingDojo: { /* ... (unchanged) ... */ },
    OperatorDojo: { /* ... (unchanged) ... */ },

    /**
     * Default/Stabilizer Protocol: Enhanced with AR pose data.
     */
    DefaultProtocol: {
        id: "stabilizer_default_v2_ar",
        name: "Standard Pacing Protocol with AR Guidance",
        description: "A balanced session of resonant frequency breathing and gentle, guided chair yoga.",
        // The 'poses' array provides the data for the AR renderer.
        // Each entry has a timestamp (in ms) for when the pose should become active.
        poses: [
            { timestamp: 0,    name: "Seated Tadasana",  pose: seatedTadasana },
            { timestamp: 5000, name: "Seated Forward Fold", pose: seatedForwardFold },
            { timestamp: 12000, name: "Seated Tadasana",  pose: seatedTadasana }, // Return to neutral
        ],
        stages: [
            { type: 'guided_ar_yoga', duration: 15000 } // Total duration of the AR session
        ]
    }
};