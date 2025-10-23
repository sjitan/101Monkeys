// Dojo Protocol Library: Defines tailored Pacer and CEP protocols for each Autonomic Archetype.

console.log("Dojo Protocol Library Loaded.");

export const ProtocolLibrary = {
    /**
     * Retrieves the appropriate protocol for a given archetype.
     * @param {string} archetype - The user's archetype (e.g., 'Insulated', 'Amplifier').
     * @returns {object} - An object containing the 'pacer' and 'cep' protocols.
     */
    getProtocol(archetype) {
        switch (archetype) {
            case 'Insulated':
                return this.InsulatedProtocol;
            case 'Amplifier':
                return this.AmplifierProtocol;
            case 'Operator':
                return this.OperatorProtocol;
            case 'Stabilizer':
            default:
                // Stabilizers can use a default or a more generalized protocol.
                return this.DefaultProtocol;
        }
    },

    // --- Protocol Definitions ---

    /**
     * Insulated Protocol: Focuses on "Activation" to gently increase autonomic flexibility.
     * These users may have a blunted response, so the goal is to create measurable signals.
     */
    InsulatedProtocol: {
        id: "insulated_v1",
        pacer: {
            name: "Stress-and-Recover",
            description: "A gentle loop of mild cognitive stress followed by guided relaxation to encourage autonomic response.",
            stages: [
                { type: 'breathwork', duration: 120, target: 'resonant_frequency' },
                { type: 'cognitive_task', duration: 60, difficulty: 'easy' },
                { type: 'recovery_breath', duration: 120, target: 'exhale_focus' }
            ]
        },
        cep: {
            name: "Sensory Activation CEP",
            description: "Uses mild, calibrated sensory stimuli to test for autonomic reactivity.",
            intervention: { type: 'audio_visual', stimulus: 'calibrated_white_noise' }
        }
    },

    /**
     * Amplifier Protocol: Focuses on "Gating" to help users manage their high sensitivity.
     * The goal is to reward stillness and reduce unnecessary autonomic reactions.
     */
    AmplifierProtocol: {
        id: "amplifier_v1",
        pacer: {
            name: "Stillness and Awareness",
            description: "Longer periods of quiet observation and stillness to calm the system and reduce noise.",
            stages: [
                { type: 'body_scan', duration: 300 },
                { type: 'stillness', duration: 300, feedback: 'reward_on_low_seda' }
            ]
        },
        cep: {
            name: "Gating Practice CEP",
            description: "A CEP that rewards the user for maintaining a stable baseline (low RF_Bracing, low sEDA) during the intervention window.",
            intervention: { type: 'non_local_signal' },
            reward_condition: { metric: 'RF_Bracing', direction: 'minimize' }
        }
    },

    /**
     * Operator Protocol: Focuses on "Fidelity" to maximize the clarity of their signal.
     * These users are effective "Senders," so the goal is to refine their ability to generate coherent states.
     */
    OperatorProtocol: {
        id: "operator_v1",
        pacer: {
            name: "Coherence Maximization",
            description: "Advanced breathwork and focus techniques to achieve and sustain high-coherence states.",
            stages: [
                { type: 'advanced_breathwork', duration: 600, technique: 'heart_lock_focus' }
            ]
        },
        cep: {
            name: "Sender Fidelity CEP",
            description: "A CEP designed to help the user practice generating a clean, strong signal during the intervention window.",
            intervention: { type: 'non_local_signal' },
            feedback_metric: 'composite_ft_clarity_score'
        }
    },

    /**
     * Default/Stabilizer Protocol: A balanced protocol for general use.
     */
    DefaultProtocol: {
        id: "default_v1",
        pacer: {
            name: "Standard Pacing",
            description: "A balanced session of resonant frequency breathing and gentle movement.",
            stages: [
                { type: 'resonant_frequency_breathing', duration: 600 }
            ]
        },
        cep: {
            name: "Standard CEP",
            description: "The standard Controlled Event Protocol.",
            intervention: { type: 'non_local_signal' }
        }
    }
};
