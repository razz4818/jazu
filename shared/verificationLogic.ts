import {
  DetectionResult,
  EquipmentRequirement,
  VerificationAttemptItemSnapshot,
  VerificationResult
} from './types';

export interface VerificationEvaluationOutcome {
  result: VerificationResult;
  passed: boolean;
  statusTitle: string;
  message: string;
  items: Record<string, VerificationAttemptItemSnapshot>;
  missingRequired: string[];
  missingOptional: string[];
  detectedItems: string[];
  overallConfidence: number;
}

/**
 * Pure business logic for SafeKitchen AI verification evaluation.
 * Evaluates camera AI detection output against configured restaurant equipment requirements.
 */
export function evaluatePpeVerification(
  detection: DetectionResult,
  requirements: EquipmentRequirement[]
): VerificationEvaluationOutcome {
  const itemsSnapshot: Record<string, VerificationAttemptItemSnapshot> = {};
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const detectedItems: string[] = [];

  // 1. Check person presence and positioning constraints
  if (!detection.personDetected) {
    return {
      result: 'NEEDS_RETRY',
      passed: false,
      statusTitle: 'NO PERSON DETECTED',
      message: '⚠ No person detected in the camera frame. Please step directly into the marked area.',
      items: {},
      missingRequired: [],
      missingOptional: [],
      detectedItems: [],
      overallConfidence: 0
    };
  }

  if (detection.multiplePeople) {
    return {
      result: 'NEEDS_RETRY',
      passed: false,
      statusTitle: 'MULTIPLE PEOPLE DETECTED',
      message: '⚠ Please ensure only one worker is in the camera area for verification.',
      items: {},
      missingRequired: [],
      missingOptional: [],
      detectedItems: [],
      overallConfidence: 0
    };
  }

  if (detection.personPosition === 'too_far') {
    return {
      result: 'NEEDS_RETRY',
      passed: false,
      statusTitle: 'POSITIONING ERROR',
      message: 'Please move closer to the camera so safety equipment can be scanned.',
      items: {},
      missingRequired: [],
      missingOptional: [],
      detectedItems: [],
      overallConfidence: 0
    };
  }

  if (detection.personPosition === 'partial_out') {
    return {
      result: 'NEEDS_RETRY',
      passed: false,
      statusTitle: 'POSITIONING ERROR',
      message: 'Please move fully inside the camera area with hands and upper body visible.',
      items: {},
      missingRequired: [],
      missingOptional: [],
      detectedItems: [],
      overallConfidence: 0
    };
  }

  // Filter only enabled equipment rules
  const activeRequirements = requirements.filter(r => r.isEnabled);

  let allRequiredPassed = true;
  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const req of activeRequirements) {
    // Check if detected by code or alias
    const detectedItem = detection.items[req.code] || detection.items[req.code.toLowerCase().replace(/[\s-]/g, '_')];
    const isDetected = detectedItem ? Boolean(detectedItem.detected) : false;
    const confidence = detectedItem && typeof detectedItem.confidence === 'number' ? detectedItem.confidence : 0;
    const meetsThreshold = isDetected && confidence >= req.minConfidence;

    const itemPassed = req.isRequired ? meetsThreshold : true;

    itemsSnapshot[req.code] = {
      code: req.code,
      name: req.name,
      required: req.isRequired,
      detected: isDetected,
      confidence: Math.round(confidence * 100) / 100,
      threshold: req.minConfidence,
      passed: meetsThreshold
    };

    if (isDetected) {
      detectedItems.push(req.name);
      totalConfidence += confidence;
      confidenceCount++;
    }

    if (req.isRequired) {
      if (!meetsThreshold) {
        allRequiredPassed = false;
        missingRequired.push(req.name);
      }
    } else {
      if (!isDetected || confidence < req.minConfidence) {
        missingOptional.push(req.name);
      }
    }
  }

  const overallConfidence = confidenceCount > 0
    ? Math.round((totalConfidence / confidenceCount) * 100) / 100
    : 0;

  if (allRequiredPassed) {
    return {
      result: 'PASS',
      passed: true,
      statusTitle: 'REGISTRATION SUCCESSFUL',
      message: 'All required safety equipment has been detected. You are cleared for shift check-in.',
      items: itemsSnapshot,
      missingRequired: [],
      missingOptional,
      detectedItems,
      overallConfidence
    };
  } else {
    return {
      result: 'FAIL',
      passed: false,
      statusTitle: 'REGISTRATION FAILED',
      message: 'Required safety equipment is missing or below required detection confidence. Please wear all required equipment and try again.',
      items: itemsSnapshot,
      missingRequired,
      missingOptional,
      detectedItems,
      overallConfidence
    };
  }
}
