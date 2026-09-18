# 🛡️ SafeKitchen AI — Production-Ready Food Safety PPE Verification System

SafeKitchen AI is an enterprise-grade, computer-vision-powered Personal Protective Equipment (PPE) verification and shift registration platform for commercial restaurant kitchens.

The application ensures that all food handlers and kitchen workers are properly wearing configured sanitary food-safety gear (e.g., sanitary gloves, hairnets/head covers, chef aprons, face masks, non-slip footwear) before allowing them to register and check in for their shift.

---

## 🌟 Key Features

- **Live AI PPE Detection & HUD**: Real-time bounding box annotations, confidence metrics, and dynamic positioning silhouette overlay.
- **Strict Privacy by Design**: Zero facial recognition, zero biometric tracking, and zero inference of demographic or sensitive characteristics. Identification is handled strictly via Worker ID badges/codes.
- **Dynamic Equipment Rules Engine**: Full customization per restaurant. Configure mandatory vs. optional items, confidence thresholds (e.g., 85%), and add custom equipment (e.g., Beard Nets, Cut-Resistant Gloves).
- **Interactive Demo AI Simulator**: Seamless built-in testing presets (`ALL_COMPLIANT`, `MISSING_GLOVES`, `MISSING_HAIR_COVER`, `MISSING_APRON`, `MULTIPLE_MISSING`, `LOW_CONFIDENCE`, `NO_PERSON`, `MULTIPLE_PEOPLE`, `TOO_FAR`, `PARTIAL_OUT`) enabling complete validation without requiring physical cameras or external GPUs.
- **Plug-and-Play Real Vision Model Integration**: Dedicated `IPPEDetector` abstraction ready to connect to on-premise YOLO (v8/v9/v11), Roboflow, AWS Rekognition, or Google Cloud Vision models.
- **Multi-Tenant Architecture**: Complete tenant isolation where every restaurant manages its own workers, equipment requirements, checkpoints, and compliance audit logs.
- **Comprehensive Admin Portal**:
  - **Executive Dashboard**: Real-time KPI cards, compliance percentage gauges, and live check-in logs.
  - **Equipment Requirements**: Fine-tune thresholds with intuitive sliders, toggle required/optional, enable/disable rules, and add custom items.
  - **Staff Directory**: Add/edit workers, toggle active status, and view individual verification audit histories.
  - **Camera Management**: Monitor checkpoint statuses (online/offline), IP addresses, and trigger heartbeat pings.
  - **Registration Audit Log**: Searchable, filterable log with full snapshot drawers showing equipment confidence scores and timestamps.
  - **Analytics & Reports**: Visual daily trend charts, Pass vs. Fail breakdowns, and most frequently missing PPE distributions over 7d/30d/custom date ranges.
  - **Restaurant Settings**: Profile, timezone, failed attempt warnings, and AI mode configuration.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, HTML5 Canvas Overlay, Web Audio API |
| **Backend** | Node.js, Express, TypeScript, RESTful API, Zod, JWT Authentication, Bcrypt |
| **Database** | SQLite with WebAssembly zero-compilation persistence (`sql.js`), relational schema with indexes & foreign keys |
| **Testing** | Vitest, Supertest (14 automated unit & integration tests) |
| **AI Vision Layer** | `IPPEDetector` Interface with `DemoPPEDetector` & `RealPPEDetector` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node 20 / 22 / 24 fully supported)
- npm or pnpm

### 1. Installation
Clone the repository and install dependencies:
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 2. Seed Database
Initialize the SQLite database with the demo restaurant, default PPE requirements, workers, cameras, and sample check-in history:
```bash
npm run seed
```

### 3. Run Development Servers
Start both backend API (`http://localhost:5000`) and frontend Vite dev server (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

Or run them individually:
```bash
# Terminal 1: Backend API (port 5000)
npm run dev:server

# Terminal 2: Frontend Client (port 5173)
npm run dev:client
```

---

## 🔑 Demo Access Credentials

The demo database comes preloaded with administrative credentials:

- **Admin Email**: `admin@demokitchen.test`
- **Admin Password**: `Admin123!`
- **Demo Restaurant**: `Demo Kitchen`
- **Preloaded Workers**:
  - `WK-1024` — Chef Elena Gomez (Prep Kitchen)
  - `WK-1025` — Marcus Vance (Grill Line)
  - `WK-1026` — Aisha Patel (Pastry & Bakery)
  - `WK-1027` — Lucas Rivera (Sous Chef / Expo)
  - `WK-1028` — David Kim (Line Cook)
  - `WK-1029` — Sarah Jenkins (Sanitation & Stewarding)

*(A convenient one-click "Fill" button is also provided directly on the Admin login page)*.

---

## 🧪 Running Automated Tests

SafeKitchen AI includes comprehensive unit and integration tests covering verification logic, edge cases, tenant isolation, and API routes:

```bash
npm run test
```

### Test Coverage:
1. All required PPE detected with confidence >= threshold → `PASS`
2. Required gloves missing → `FAIL`
3. Required hair cover missing → `FAIL`
4. Optional mask missing → `PASS`
5. Low confidence (< threshold) → `FAIL`
6. No person detected → `NEEDS_RETRY`
7. Multiple people in camera frame → `NEEDS_RETRY`
8. Disabled PPE rules are ignored during check-in
9. Optional PPE does not affect PASS/FAIL calculation
10. Multi-tenant isolation (Restaurant A cannot access Restaurant B data)
11. Authentication & login security
12. Worker, Equipment, and Verification API endpoints

---

## 🎮 How to Use Demo AI Mode

When physical cameras or GPU inference servers are not present, SafeKitchen AI features a floating **Demo AI Simulator** toolbar:

1. Open the Worker Kiosk at `http://localhost:5173/kiosk`.
2. Click the **Demo AI Simulator** pill in the bottom right corner.
3. Select any simulation preset:
   - **All PPE Detected (PASS)**: Simulates 96% Gloves, 94% Hairnet, 92% Apron.
   - **Gloves Missing (FAIL)**: Simulates worker without sanitary gloves.
   - **Hair Cover Missing (FAIL)**: Simulates missing head cover.
   - **Apron Missing (FAIL)**: Simulates missing apron.
   - **Multiple PPE Missing (FAIL)**: Simulates multiple missing items.
   - **Low Confidence (FAIL)**: Simulates detection below the configured 85% threshold.
   - **No Person Detected (RETRY)**: Simulates empty camera field of view.
   - **Multiple People in Area (RETRY)**: Simulates 2+ people in the checkpoint zone.
4. Select a worker ID and click **VERIFY & CHECK IN** to observe the instant visual feedback, bounding boxes, and audio chimes.

---

## 🔌 Connecting a Real AI Computer Vision Model

SafeKitchen AI is architected with a decoupled vision pipeline. To integrate a custom YOLO model or cloud vision service:

1. **Implement the IPPEDetector Interface** (`client/src/ai/RealPPEDetector.ts` or `server/src/routes/ai.ts`):
   ```typescript
   export interface IPPEDetector {
     initialize(): Promise<void>;
     detect(frame: HTMLCanvasElement | HTMLVideoElement | ImageData | string): Promise<DetectionResult>;
     dispose(): Promise<void>;
   }
   ```
2. **Configure External Model URL in Admin Settings**:
   - Navigate to `/admin/settings`
   - Switch AI Mode to **Real AI Vision Model**
   - Provide your model server endpoint (e.g., `https://vision.mykitchen.internal/v1/detect` or Roboflow Inference API) and API Key.
3. **Detection Output Format Expected**:
   ```json
   {
     "personDetected": true,
     "multiplePeople": false,
     "personPosition": "good",
     "items": {
       "gloves": { "detected": true, "confidence": 0.96, "bbox": [0.28, 0.58, 0.44, 0.22] },
       "hair_cover": { "detected": true, "confidence": 0.94, "bbox": [0.38, 0.08, 0.24, 0.16] },
       "apron": { "detected": true, "confidence": 0.92, "bbox": [0.32, 0.30, 0.36, 0.45] }
     }
   }
   ```

---

## 🔒 Security & Privacy Highlights

- **No Facial Recognition**: Worker identity is strictly determined via Worker ID / Badges. Face embeddings are never extracted or stored.
- **Ephemeral Frame Processing**: Camera frames are processed in memory and discarded immediately after inference.
- **Multi-Tenant Scoping**: All database queries enforce strict `restaurant_id` partitioning.
- **Encrypted Credentials**: Passwords hashed using bcrypt with salt rounds.

---

## 📦 Production Deployment

To build for production:

```bash
npm run build
```

This compiles both the TypeScript server into `server/dist/` and bundles optimized client assets into `client/dist/`.

To launch in production:
```bash
NODE_ENV=production PORT=5000 npm --prefix server start
```
