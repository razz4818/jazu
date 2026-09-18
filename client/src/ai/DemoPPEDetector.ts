import {
  IPPEDetector,
  DetectionResult,
  DemoSimulationPreset,
  PositionStatus
} from '@shared/types';

export interface CustomSimulationOptions {
  personDetected: boolean;
  multiplePeople: boolean;
  position: PositionStatus;
  items: {
    gloves: { detected: boolean; confidence: number };
    hair_cover: { detected: boolean; confidence: number };
    apron: { detected: boolean; confidence: number };
    face_mask: { detected: boolean; confidence: number };
    safety_shoes: { detected: boolean; confidence: number };
    [key: string]: { detected: boolean; confidence: number };
  };
}

export class DemoPPEDetector implements IPPEDetector {
  readonly id = 'demo_ppe_detector_v1';
  readonly name = 'SafeKitchen Demo Vision Engine';
  readonly mode = 'demo' as const;

  private currentPreset: DemoSimulationPreset = 'ALL_COMPLIANT';
  private customOptions: CustomSimulationOptions = {
    personDetected: true,
    multiplePeople: false,
    position: 'good',
    items: {
      gloves: { detected: true, confidence: 0.96 },
      hair_cover: { detected: true, confidence: 0.94 },
      apron: { detected: true, confidence: 0.92 },
      face_mask: { detected: true, confidence: 0.88 },
      safety_shoes: { detected: true, confidence: 0.85 }
    }
  };

  private frameCount = 0;

  async initialize(): Promise<void> {
    // Demo detector initialization simulation
    return Promise.resolve();
  }

  setPreset(preset: DemoSimulationPreset): void {
    this.currentPreset = preset;
  }

  getPreset(): DemoSimulationPreset {
    return this.currentPreset;
  }

  setCustomOptions(options: Partial<CustomSimulationOptions>): void {
    this.customOptions = {
      ...this.customOptions,
      ...options,
      items: {
        ...this.customOptions.items,
        ...(options.items || {})
      }
    };
    this.currentPreset = 'CUSTOM';
  }

  getCustomOptions(): CustomSimulationOptions {
    return this.customOptions;
  }

  async detect(
    _frameSource: HTMLCanvasElement | HTMLVideoElement | ImageData | string
  ): Promise<DetectionResult> {
    const startTime = performance.now();
    this.frameCount++;

    // Subtle sinusoidal jitter for realistic bounding box & tracking confidence rendering
    const jitter = Math.sin(this.frameCount * 0.15) * 0.015;
    const bboxJitter = Math.cos(this.frameCount * 0.1) * 0.006;

    let result: DetectionResult;

    switch (this.currentPreset) {
      case 'ALL_COMPLIANT':
        result = {
          personDetected: true,
          multiplePeople: false,
          personPosition: 'good',
          handsVisible: true,
          headVisible: true,
          items: {
            gloves: {
              detected: true,
              confidence: Math.min(0.98, Math.max(0.92, 0.96 + jitter)),
              bbox: [0.28 + bboxJitter, 0.58 + bboxJitter, 0.44, 0.22],
              label: 'Gloves'
            },
            hair_cover: {
              detected: true,
              confidence: Math.min(0.97, Math.max(0.90, 0.94 + jitter)),
              bbox: [0.38 + bboxJitter, 0.08 + bboxJitter, 0.24, 0.16],
              label: 'Hair Cover'
            },
            apron: {
              detected: true,
              confidence: Math.min(0.96, Math.max(0.88, 0.92 + jitter)),
              bbox: [0.32 + bboxJitter, 0.30 + bboxJitter, 0.36, 0.45],
              label: 'Apron'
            },
            face_mask: {
              detected: true,
              confidence: Math.min(0.95, Math.max(0.85, 0.90 + jitter)),
              bbox: [0.42 + bboxJitter, 0.20 + bboxJitter, 0.16, 0.10],
              label: 'Face Mask'
            },
            safety_shoes: {
              detected: true,
              confidence: Math.min(0.94, Math.max(0.82, 0.88 + jitter)),
              bbox: [0.34 + bboxJitter, 0.86 + bboxJitter, 0.32, 0.12],
              label: 'Safety Shoes'
            }
          },
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime),
          rawLabels: ['person', 'gloves', 'hair_cover', 'apron', 'face_mask', 'safety_shoes']
        };
        break;

      case 'MISSING_GLOVES':
        result = {
          personDetected: true,
          multiplePeople: false,
          personPosition: 'good',
          handsVisible: true,
          headVisible: true,
          items: {
            gloves: {
              detected: false,
              confidence: 0.05,
              label: 'Gloves Missing'
            },
            hair_cover: {
              detected: true,
              confidence: 0.94 + jitter,
              bbox: [0.38 + bboxJitter, 0.08 + bboxJitter, 0.24, 0.16],
              label: 'Hair Cover'
            },
            apron: {
              detected: true,
              confidence: 0.92 + jitter,
              bbox: [0.32 + bboxJitter, 0.30 + bboxJitter, 0.36, 0.45],
              label: 'Apron'
            },
            face_mask: {
              detected: true,
              confidence: 0.89 + jitter,
              bbox: [0.42 + bboxJitter, 0.20 + bboxJitter, 0.16, 0.10],
              label: 'Face Mask'
            }
          },
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;

      case 'MISSING_HAIR_COVER':
        result = {
          personDetected: true,
          multiplePeople: false,
          personPosition: 'good',
          handsVisible: true,
          headVisible: true,
          items: {
            gloves: {
              detected: true,
              confidence: 0.96 + jitter,
              bbox: [0.28 + bboxJitter, 0.58 + bboxJitter, 0.44, 0.22],
              label: 'Gloves'
            },
            hair_cover: {
              detected: false,
              confidence: 0.08,
              label: 'Hair Cover Missing'
            },
            apron: {
              detected: true,
              confidence: 0.91 + jitter,
              bbox: [0.32 + bboxJitter, 0.30 + bboxJitter, 0.36, 0.45],
              label: 'Apron'
            }
          },
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;

      case 'MISSING_APRON':
        result = {
          personDetected: true,
          multiplePeople: false,
          personPosition: 'good',
          handsVisible: true,
          headVisible: true,
          items: {
            gloves: {
              detected: true,
              confidence: 0.95 + jitter,
              bbox: [0.28 + bboxJitter, 0.58 + bboxJitter, 0.44, 0.22],
              label: 'Gloves'
            },
            hair_cover: {
              detected: true,
              confidence: 0.93 + jitter,
              bbox: [0.38 + bboxJitter, 0.08 + bboxJitter, 0.24, 0.16],
              label: 'Hair Cover'
            },
            apron: {
              detected: false,
              confidence: 0.03,
              label: 'Apron Missing'
            }
          },
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;

      case 'MULTIPLE_MISSING':
        result = {
          personDetected: true,
          multiplePeople: false,
          personPosition: 'good',
          handsVisible: true,
          headVisible: true,
          items: {
            gloves: {
              detected: false,
              confidence: 0.02,
              label: 'Gloves Missing'
            },
            hair_cover: {
              detected: true,
              confidence: 0.92 + jitter,
              bbox: [0.38 + bboxJitter, 0.08 + bboxJitter, 0.24, 0.16],
              label: 'Hair Cover'
            },
            apron: {
              detected: false,
              confidence: 0.05,
              label: 'Apron Missing'
            }
          },
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;

      case 'LOW_CONFIDENCE':
        result = {
          personDetected: true,
          multiplePeople: false,
          personPosition: 'good',
          handsVisible: true,
          headVisible: true,
          items: {
            gloves: {
              detected: true,
              confidence: 0.68 + jitter, // Below 0.85
              bbox: [0.28 + bboxJitter, 0.58 + bboxJitter, 0.44, 0.22],
              label: 'Gloves (Low Confidence)'
            },
            hair_cover: {
              detected: true,
              confidence: 0.92 + jitter,
              bbox: [0.38 + bboxJitter, 0.08 + bboxJitter, 0.24, 0.16],
              label: 'Hair Cover'
            },
            apron: {
              detected: true,
              confidence: 0.90 + jitter,
              bbox: [0.32 + bboxJitter, 0.30 + bboxJitter, 0.36, 0.45],
              label: 'Apron'
            }
          },
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;

      case 'NO_PERSON':
        result = {
          personDetected: false,
          multiplePeople: false,
          personPosition: 'no_person',
          handsVisible: false,
          headVisible: false,
          items: {},
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;

      case 'MULTIPLE_PEOPLE':
        result = {
          personDetected: true,
          multiplePeople: true,
          personPosition: 'multiple_people',
          handsVisible: true,
          headVisible: true,
          items: {},
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;

      case 'TOO_FAR':
        result = {
          personDetected: true,
          multiplePeople: false,
          personPosition: 'too_far',
          handsVisible: false,
          headVisible: true,
          items: {
            gloves: { detected: false, confidence: 0.3 },
            hair_cover: { detected: true, confidence: 0.75 },
            apron: { detected: true, confidence: 0.70 }
          },
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;

      case 'PARTIAL_OUT':
        result = {
          personDetected: true,
          multiplePeople: false,
          personPosition: 'partial_out',
          handsVisible: false,
          headVisible: true,
          items: {
            gloves: { detected: false, confidence: 0.2 },
            hair_cover: { detected: true, confidence: 0.88 },
            apron: { detected: true, confidence: 0.85 }
          },
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;

      case 'CUSTOM':
      default:
        const customItems: Record<string, any> = {};
        for (const [key, item] of Object.entries(this.customOptions.items)) {
          customItems[key] = {
            detected: item.detected,
            confidence: item.confidence + (item.detected ? jitter : 0),
            bbox: item.detected ? [0.35 + bboxJitter, 0.35 + bboxJitter, 0.3, 0.3] : undefined,
            label: key
          };
        }

        result = {
          personDetected: this.customOptions.personDetected,
          multiplePeople: this.customOptions.multiplePeople,
          personPosition: this.customOptions.position,
          handsVisible: this.customOptions.personDetected,
          headVisible: this.customOptions.personDetected,
          items: customItems,
          timestamp: Date.now(),
          inferenceTimeMs: Math.round(performance.now() - startTime)
        };
        break;
    }

    return result;
  }

  async dispose(): Promise<void> {
    return Promise.resolve();
  }
}
