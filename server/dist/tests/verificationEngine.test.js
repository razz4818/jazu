"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const verificationLogic_1 = require("../../../shared/verificationLogic");
(0, vitest_1.describe)('SafeKitchen AI - Verification Logic Unit Tests', () => {
    const sampleRequirements = [
        {
            id: 'eq_1',
            restaurantId: 'rest_01',
            name: 'Gloves',
            code: 'gloves',
            icon: 'Hand',
            description: 'Hand protection',
            isRequired: true,
            isEnabled: true,
            minConfidence: 0.85,
            createdAt: '2026-09-17'
        },
        {
            id: 'eq_2',
            restaurantId: 'rest_01',
            name: 'Hair Cover',
            code: 'hair_cover',
            icon: 'UserCheck',
            description: 'Hair protection',
            isRequired: true,
            isEnabled: true,
            minConfidence: 0.85,
            createdAt: '2026-09-17'
        },
        {
            id: 'eq_3',
            restaurantId: 'rest_01',
            name: 'Apron',
            code: 'apron',
            icon: 'Shield',
            description: 'Body protection',
            isRequired: true,
            isEnabled: true,
            minConfidence: 0.85,
            createdAt: '2026-09-17'
        },
        {
            id: 'eq_4',
            restaurantId: 'rest_01',
            name: 'Face Mask',
            code: 'face_mask',
            icon: 'Smile',
            description: 'Optional mask',
            isRequired: false,
            isEnabled: true,
            minConfidence: 0.80,
            createdAt: '2026-09-17'
        },
        {
            id: 'eq_5',
            restaurantId: 'rest_01',
            name: 'Safety Shoes',
            code: 'safety_shoes',
            icon: 'Footprints',
            description: 'Disabled rule',
            isRequired: true,
            isEnabled: false, // Disabled
            minConfidence: 0.80,
            createdAt: '2026-09-17'
        }
    ];
    (0, vitest_1.it)('1. All required PPE detected with confidence >= threshold → PASS', () => {
        const detection = {
            personDetected: true,
            multiplePeople: false,
            personPosition: 'good',
            items: {
                gloves: { detected: true, confidence: 0.95 },
                hair_cover: { detected: true, confidence: 0.92 },
                apron: { detected: true, confidence: 0.89 },
                face_mask: { detected: true, confidence: 0.91 }
            },
            timestamp: Date.now(),
            inferenceTimeMs: 45
        };
        const outcome = (0, verificationLogic_1.evaluatePpeVerification)(detection, sampleRequirements);
        (0, vitest_1.expect)(outcome.result).toBe('PASS');
        (0, vitest_1.expect)(outcome.passed).toBe(true);
        (0, vitest_1.expect)(outcome.missingRequired).toHaveLength(0);
        (0, vitest_1.expect)(outcome.statusTitle).toBe('REGISTRATION SUCCESSFUL');
    });
    (0, vitest_1.it)('2. Required gloves missing → FAIL', () => {
        const detection = {
            personDetected: true,
            multiplePeople: false,
            personPosition: 'good',
            items: {
                gloves: { detected: false, confidence: 0.0 },
                hair_cover: { detected: true, confidence: 0.92 },
                apron: { detected: true, confidence: 0.89 }
            },
            timestamp: Date.now(),
            inferenceTimeMs: 45
        };
        const outcome = (0, verificationLogic_1.evaluatePpeVerification)(detection, sampleRequirements);
        (0, vitest_1.expect)(outcome.result).toBe('FAIL');
        (0, vitest_1.expect)(outcome.passed).toBe(false);
        (0, vitest_1.expect)(outcome.missingRequired).toContain('Gloves');
        (0, vitest_1.expect)(outcome.statusTitle).toBe('REGISTRATION FAILED');
    });
    (0, vitest_1.it)('3. Required hair cover missing → FAIL', () => {
        const detection = {
            personDetected: true,
            multiplePeople: false,
            personPosition: 'good',
            items: {
                gloves: { detected: true, confidence: 0.94 },
                hair_cover: { detected: false, confidence: 0.0 },
                apron: { detected: true, confidence: 0.89 }
            },
            timestamp: Date.now(),
            inferenceTimeMs: 45
        };
        const outcome = (0, verificationLogic_1.evaluatePpeVerification)(detection, sampleRequirements);
        (0, vitest_1.expect)(outcome.result).toBe('FAIL');
        (0, vitest_1.expect)(outcome.passed).toBe(false);
        (0, vitest_1.expect)(outcome.missingRequired).toContain('Hair Cover');
    });
    (0, vitest_1.it)('4. Optional mask missing → PASS', () => {
        const detection = {
            personDetected: true,
            multiplePeople: false,
            personPosition: 'good',
            items: {
                gloves: { detected: true, confidence: 0.94 },
                hair_cover: { detected: true, confidence: 0.92 },
                apron: { detected: true, confidence: 0.89 },
                face_mask: { detected: false, confidence: 0.0 } // Optional missing
            },
            timestamp: Date.now(),
            inferenceTimeMs: 45
        };
        const outcome = (0, verificationLogic_1.evaluatePpeVerification)(detection, sampleRequirements);
        (0, vitest_1.expect)(outcome.result).toBe('PASS');
        (0, vitest_1.expect)(outcome.passed).toBe(true);
        (0, vitest_1.expect)(outcome.missingRequired).toHaveLength(0);
        (0, vitest_1.expect)(outcome.missingOptional).toContain('Face Mask');
    });
    (0, vitest_1.it)('5. Low confidence (< configured threshold) on required item → FAIL', () => {
        const detection = {
            personDetected: true,
            multiplePeople: false,
            personPosition: 'good',
            items: {
                gloves: { detected: true, confidence: 0.72 }, // Required is 0.85!
                hair_cover: { detected: true, confidence: 0.92 },
                apron: { detected: true, confidence: 0.89 }
            },
            timestamp: Date.now(),
            inferenceTimeMs: 45
        };
        const outcome = (0, verificationLogic_1.evaluatePpeVerification)(detection, sampleRequirements);
        (0, vitest_1.expect)(outcome.result).toBe('FAIL');
        (0, vitest_1.expect)(outcome.passed).toBe(false);
        (0, vitest_1.expect)(outcome.missingRequired).toContain('Gloves');
    });
    (0, vitest_1.it)('6. No person detected → NEEDS_RETRY', () => {
        const detection = {
            personDetected: false,
            multiplePeople: false,
            items: {},
            timestamp: Date.now(),
            inferenceTimeMs: 20
        };
        const outcome = (0, verificationLogic_1.evaluatePpeVerification)(detection, sampleRequirements);
        (0, vitest_1.expect)(outcome.result).toBe('NEEDS_RETRY');
        (0, vitest_1.expect)(outcome.passed).toBe(false);
        (0, vitest_1.expect)(outcome.statusTitle).toBe('NO PERSON DETECTED');
        (0, vitest_1.expect)(outcome.message).toContain('No person detected');
    });
    (0, vitest_1.it)('7. Multiple people detected in frame → NEEDS_RETRY', () => {
        const detection = {
            personDetected: true,
            multiplePeople: true,
            items: {},
            timestamp: Date.now(),
            inferenceTimeMs: 25
        };
        const outcome = (0, verificationLogic_1.evaluatePpeVerification)(detection, sampleRequirements);
        (0, vitest_1.expect)(outcome.result).toBe('NEEDS_RETRY');
        (0, vitest_1.expect)(outcome.passed).toBe(false);
        (0, vitest_1.expect)(outcome.statusTitle).toBe('MULTIPLE PEOPLE DETECTED');
    });
    (0, vitest_1.it)('8. Disabled PPE requirement is ignored during check-in evaluation', () => {
        // Safety Shoes is disabled in sampleRequirements (isEnabled: false)
        const detection = {
            personDetected: true,
            multiplePeople: false,
            personPosition: 'good',
            items: {
                gloves: { detected: true, confidence: 0.94 },
                hair_cover: { detected: true, confidence: 0.92 },
                apron: { detected: true, confidence: 0.89 },
                safety_shoes: { detected: false, confidence: 0.0 }
            },
            timestamp: Date.now(),
            inferenceTimeMs: 45
        };
        const outcome = (0, verificationLogic_1.evaluatePpeVerification)(detection, sampleRequirements);
        (0, vitest_1.expect)(outcome.result).toBe('PASS');
        (0, vitest_1.expect)(outcome.missingRequired).not.toContain('Safety Shoes');
    });
});
