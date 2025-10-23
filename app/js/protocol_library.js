/**
 * @fileoverview Defines tailored Pacer protocols ("Dojos") for each Autonomic Archetype.
 * Protocols are defined as sequences of pose_ids, which correspond to audio cues
 * and target skeletons for the AR engine.
 */

import { targetPoses } from './target_poses.js';

console.log("Dojo Protocol Library (Adaptive Sequencer) Loaded.");

export const ProtocolLibrary = {
    getProtocol(archetype) {
        switch (archetype) {
            case 'Insulated': return this.ActivationDojo;
            case 'Amplifier': return this.GatingDojo;
            case 'Operator': return this.OperatorDojo;
            case 'Stabilizer':
            default: return this.DefaultProtocol;
        }
    },

    // Each protocol is now a sequence of steps. The `decision_engine` will
    // use this as the initial plan, but can adapt it in real-time.
    DefaultProtocol: {
        id: "stabilizer_default_v3_adaptive",
        name: "Adaptive Chair Yoga Flow",
        sequence: [
            { pose_id: 'pose_grounding_01', duration: 15000 },      // Seated Tadasana
            { pose_id: 'pose_mobilizing_01_cow', duration: 10000 }, // Seated Cow
            { pose_id: 'pose_mobilizing_01_cat', duration: 10000 }, // Seated Cat
            { pose_id: 'pose_restorative_01', duration: 15000 },    // Forward Fold
            { pose_id: 'pose_grounding_01', duration: 10000 },      // Return to Tadasana
        ]
    },

    // Example of a safety/restorative protocol the engine can switch to.
    SafetyProtocol: {
        id: "safety_restorative_v1",
        name: "Safety Restorative Protocol",
        sequence: [
            { pose_id: 'pose_grounding_01', duration: 30000 }, // Hold a simple grounding pose
        ]
    },

    // Stubs for other archetype-specific protocols
    ActivationDojo: {
        id: "insulated_activation_v2_adaptive",
        name: "Activation Dojo",
        sequence: [
             { pose_id: 'pose_grounding_01', duration: 20000 },
             { pose_id: 'pose_mobilizing_06', duration: 15000 }, // Seated Eagle Arms (not in target_poses yet)
        ]
    },
    GatingDojo: {
        id: "amplifier_gating_v2_adaptive",
        name: "Gating Dojo",
        sequence: [
            { pose_id: 'pose_grounding_01', duration: 60000 },
        ]
    },
    OperatorDojo: {
        id: "operator_coherence_v2_adaptive",
        name: "Operator Dojo",
        sequence: [
            { pose_id: 'pose_grounding_01', duration: 60000 },
        ]
    }
};
