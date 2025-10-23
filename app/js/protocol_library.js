// Dojo Protocol Library: Defines tailored Pacer protocols ("Dojos") for each Autonomic Archetype.

console.log("Dojo Protocol Library Loaded.");

export const ProtocolLibrary = {
    getProtocol(archetype) {
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

    /**
     * "Activation Dojo" for the Insulated Archetype.
     * Goal: Train "Stress-and-Recover" loops to build autonomic flexibility.
     */
    ActivationDojo: {
        id: "insulated_activation_v1",
        name: "Activation Dojo: Stress & Recover",
        description: "A protocol using mild, controlled stressors to encourage autonomic response and build flexibility.",
        stages: [
            { type: 'baseline', duration: 120 },
            { type: 'cognitive_task', difficulty: 'medium', duration: 60 },
            { type: 'guided_recovery_breath', duration: 180, target: 'exhale_focus' }
        ]
    },

    /**
     * "Gating Dojo" for the Amplifier Archetype.
     * Goal: Reward autonomic stillness and "gating" the flinch response.
     */
    GatingDojo: {
        id: "amplifier_gating_v1",
        name: "Gating Dojo: Rewarding Stillness",
        description: "A protocol that trains the user to maintain a calm baseline by rewarding autonomic quiet.",
        stages: [
            { type: 'baseline', duration: 120 },
            { type: 'stillness_practice', duration: 300, feedback_on: ['RF_Bracing', 'sEDA'], reward_condition: 'minimize' },
            { type: 'recovery', duration: 120 }
        ]
    },

    /**
     * "Operator Dojo" for the Operator Archetype.
     * Goal: Provide the feedback loop for them to "train themselves" into greater coherence.
     */
    OperatorDojo: {
        id: "operator_coherence_v1",
        name: "Operator Dojo: Sender/Receiver Practice",
        description: "Utilizes the Sender/Receiver CEP to provide a direct feedback loop for training coherence.",
        stages: [
            { type: 'baseline', duration: 120 },
            { type: 'cep_sender_receiver', duration: 300 },
            { type: 'recovery_and_review', duration: 180 }
        ]
    },

    /**
     * Default/Stabilizer Protocol: A balanced protocol for general use and for Stabilizers.
     */
    DefaultProtocol: {
        id: "stabilizer_default_v1",
        name: "Standard Pacing Protocol",
        description: "A balanced session of resonant frequency breathing and gentle focus.",
        stages: [
            { type: 'resonant_frequency_breathing', duration: 600 }
        ]
    }
};
