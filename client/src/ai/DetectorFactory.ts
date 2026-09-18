import { IPPEDetector, AIMode } from '@shared/types';
import { DemoPPEDetector } from './DemoPPEDetector';
import { RealPPEDetector } from './RealPPEDetector';

class DetectorFactory {
  private demoDetector: DemoPPEDetector | null = null;
  private realDetector: RealPPEDetector | null = null;

  getDemoDetector(): DemoPPEDetector {
    if (!this.demoDetector) {
      this.demoDetector = new DemoPPEDetector();
      this.demoDetector.initialize();
    }
    return this.demoDetector;
  }

  getRealDetector(): RealPPEDetector {
    if (!this.realDetector) {
      this.realDetector = new RealPPEDetector();
      this.realDetector.initialize();
    }
    return this.realDetector;
  }

  getDetector(mode: AIMode = 'demo'): IPPEDetector {
    return mode === 'real' ? this.getRealDetector() : this.getDemoDetector();
  }
}

export const detectorFactory = new DetectorFactory();
