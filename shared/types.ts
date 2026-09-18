// SafeKitchen AI - Shared Types & Interfaces

export type VerificationResult = 'PASS' | 'FAIL' | 'NEEDS_RETRY';

export type UserRole = 'admin' | 'manager';

export type AIMode = 'demo' | 'real';

export type CameraStatus = 'online' | 'offline' | 'warning';

export type PositionStatus = 'good' | 'no_person' | 'multiple_people' | 'too_far' | 'too_close' | 'partial_out';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  address?: string;
  createdAt: string;
}

export interface User {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Worker {
  id: string;
  restaurantId: string;
  workerCode: string; // e.g. "WK-1024"
  firstName: string;
  lastName: string;
  department: string; // e.g. "Prep Kitchen", "Grill Line", "Pastry", "Dishwashing"
  status: 'active' | 'inactive';
  avatarColor?: string;
  lastVerification?: {
    result: VerificationResult;
    timestamp: string;
  };
  registrationCount?: number;
  createdAt: string;
}

export interface EquipmentRequirement {
  id: string;
  restaurantId: string;
  name: string; // e.g. "Gloves", "Hair Cover", "Apron", "Face Mask", "Safety Shoes"
  code: string; // e.g. "gloves", "hair_cover", "apron", "face_mask", "safety_shoes"
  icon: string; // e.g. "hand", "user-check", "shield", "smile", "footprints", etc.
  description: string;
  isRequired: boolean;
  isEnabled: boolean;
  minConfidence: number; // 0.0 - 1.0, e.g. 0.85
  isCustom?: boolean;
  createdAt: string;
}

export interface Camera {
  id: string;
  restaurantId: string;
  cameraCode: string; // e.g. "CAM-001"
  name: string; // e.g. "Kitchen Entrance Main"
  location: string; // e.g. "Prep Station Zone A"
  status: CameraStatus;
  resolution?: string;
  ipAddress?: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface DetectionItemResult {
  detected: boolean;
  confidence: number;
  bbox?: [number, number, number, number]; // [x, y, width, height] normalized (0..1)
  label?: string;
  statusMessage?: string;
}

export interface DetectionResult {
  personDetected: boolean;
  multiplePeople: boolean;
  personPosition?: PositionStatus;
  handsVisible?: boolean;
  headVisible?: boolean;
  items: Record<string, DetectionItemResult>;
  timestamp: number;
  inferenceTimeMs: number;
  rawLabels?: string[];
}

export interface VerificationAttemptItemSnapshot {
  code: string;
  name: string;
  required: boolean;
  detected: boolean;
  confidence: number;
  threshold: number;
  passed: boolean;
}

export interface VerificationAttempt {
  id: string;
  restaurantId: string;
  workerId: string;
  workerCode: string;
  workerName: string;
  department: string;
  cameraId: string;
  cameraName: string;
  result: VerificationResult;
  items: Record<string, VerificationAttemptItemSnapshot>;
  missingRequired: string[]; // List of names or codes of required items that failed
  missingOptional: string[];
  detectedItems: string[];
  confidenceOverall: number;
  durationMs: number;
  notes?: string;
  timestamp: string;
  createdAt: string;
}

export interface RestaurantSettings {
  id: string;
  restaurantId: string;
  restaurantName: string;
  logoUrl?: string;
  timezone: string;
  defaultMinConfidence: number;
  maxFailedAttemptsWarning: number;
  verificationTimeoutSec: number;
  requireHandsVisible: boolean;
  requireHeadVisible: boolean;
  allowSnapshotStorage: boolean;
  aiMode: AIMode;
  realModelEndpoint?: string;
  realModelApiKey?: string;
  createdAt: string;
}

export interface VerificationEvaluationRequest {
  workerId: string;
  cameraId?: string;
  detection: DetectionResult;
}

export interface VerificationEvaluationResponse {
  result: VerificationResult;
  passed: boolean;
  statusTitle: string;
  message: string;
  worker: Worker;
  items: Record<string, VerificationAttemptItemSnapshot>;
  missingItems: string[];
  detectedItems: string[];
  timestamp: string;
  attemptId: string;
}

export interface DashboardStats {
  todayRegistrations: number;
  successfulRegistrations: number;
  failedRegistrations: number;
  compliancePercentage: number;
  activeWorkersCount: number;
  totalWorkersCount: number;
  camerasOnlineCount: number;
  totalCamerasCount: number;
  recentRegistrations: VerificationAttempt[];
}

export interface ReportsData {
  timeframe: 'today' | '7d' | '30d' | 'custom';
  startDate: string;
  endDate: string;
  totalRegistrations: number;
  passedCount: number;
  failedCount: number;
  complianceRate: number;
  dailyTrend: {
    date: string;
    total: number;
    passed: number;
    failed: number;
    complianceRate: number;
  }[];
  missingPpeFrequency: {
    code: string;
    name: string;
    count: number;
    percentage: number;
  }[];
  departmentBreakdown: {
    department: string;
    total: number;
    passed: number;
    failed: number;
    complianceRate: number;
  }[];
}

// AI Detector Contract Interface
export interface IPPEDetector {
  readonly id: string;
  readonly name: string;
  readonly mode: AIMode;
  initialize(): Promise<void>;
  detect(frameSource: HTMLCanvasElement | HTMLVideoElement | ImageData | string): Promise<DetectionResult>;
  dispose(): Promise<void>;
}

export type DemoSimulationPreset =
  | 'ALL_COMPLIANT'
  | 'MISSING_GLOVES'
  | 'MISSING_HAIR_COVER'
  | 'MISSING_APRON'
  | 'MULTIPLE_MISSING'
  | 'LOW_CONFIDENCE'
  | 'NO_PERSON'
  | 'MULTIPLE_PEOPLE'
  | 'TOO_FAR'
  | 'PARTIAL_OUT'
  | 'CUSTOM';
