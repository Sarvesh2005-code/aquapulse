# Comprehensive Frontend Architecture & UI Survey

**Date**: 2026-09-07  
**Agent**: `explorer_survey_3`  
**Working Directory**: `C:\Dev\Projects\Web-Projects\aquapulse\.agents\explorer_survey_3`  
**Target Repository**: `C:\Dev\Projects\Web-Projects\aquapulse\frontend`  

---

## 1. Executive Summary

This survey provides a comprehensive analysis of the AquaPulse frontend web application (`frontend/`). The application is a single-page monitoring dashboard built with **React 18**, **TypeScript 5**, **Vite 4**, **Tailwind CSS 3**, **Lucide React**, and **Chart.js**.

Key findings:
1. **Application Structure**: `frontend/src/App.tsx` contains the entire dashboard layout, state management, API polling, and presentation logic in a single well-structured component file (272 lines).
2. **API Integration & State**: Polls `/api/latest-data` and `/api/analysis` every 5 seconds via `fetch` inside a `useEffect` hook. Analysis state includes `health_score`, `quality_class`, `risk_level`, `plant_suitability`, `appliance_impact`, `skin_risk`, and `potability`.
3. **ML Integration State**: An uncommitted change in `App.tsx` already incorporates a dedicated `"Health Impact & Remedies"` card, `skin_risk` state, `potability` state, and a remedy mapping function `getRemedies()`.
4. **ML Class Mapping Alignment**: The backend model (`ml model/skin_risk_model.pkl`, confirmed via `RandomForestClassifier.classes_`) outputs 6 distinct classes:
   - `'Acidic Irritant Contact Dermatitis'`
   - `'Bacterial / Fungal Infection Risk'`
   - `'Eczema / Skin Barrier Damage'`
   - `'Pseudomonas Folliculitis (Hot Tub Rash)'`
   - `'Safe (No Skin Risk)'`
   - `'Severe Xerosis (Dry Skin Risk)'`
   Currently, two classes (`'Pseudomonas Folliculitis (Hot Tub Rash)'` and `'Severe Xerosis (Dry Skin Risk)'`) fall into the generic `default` fallback of `getRemedies()`, representing an enhancement opportunity for clinical precision.
5. **Build & Type Health**: Clean build verified (`npm run build` -> `tsc && vite build` succeeded with 0 errors in 19.6s, producing `dist/`).

---

## 2. Component Architecture & UI Layout (`frontend/src/App.tsx`)

### 2.1 File Organization & Dependencies
`frontend/src` consists of 4 files:
- `main.tsx`: Standard React 18 root mounting with `React.StrictMode` into `#root`.
- `index.css`: Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`) and global font definitions (`Inter`, system-ui).
- `vite-env.d.ts`: Vite client type reference.
- `App.tsx`: Main dashboard component (272 lines).

External Dependencies (`package.json`):
- `react` / `react-dom`: `^18.2.0`
- `lucide-react`: `^0.279.0` (Icons: `Activity`, `Droplets`, `Thermometer`, `AlertTriangle`, `CheckCircle`)
- `chart.js`: `^4.4.0` / `react-chartjs-2`: `^5.2.0` (Line chart for real-time pH trends)

### 2.2 Visual Hierarchy & Layout Tree
```
App (min-h-screen bg-gray-50)
├── Header (bg-white shadow-sm border-b border-gray-200)
│   ├── Logo & Brand (Droplets icon in aqua-500, "AquaPulse" text-2xl font-bold)
│   └── System Status (Pulsing green dot / red dot + "System Online" / "System Offline")
└── Main (max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8)
    ├── Overview Metric Cards Grid (grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6)
    │   ├── MetricCard: pH Level (Activity icon, purple-500)
    │   ├── MetricCard: TDS (Droplets icon, blue-500, unit: ppm)
    │   ├── MetricCard: Turbidity (AlertTriangle icon, yellow-500, unit: NTU)
    │   └── MetricCard: Temperature (Thermometer icon, red-500, unit: °C)
    ├── Trends & Analysis Grid (grid grid-cols-1 lg:grid-cols-3 gap-8)
    │   ├── Line Chart: Real-time Trends (lg:col-span-2, pH trend over last 7 points)
    │   └── AI Health Analysis Card (lg:col-span-1)
    │       ├── Health Score (3xl font-bold text-aqua-500)
    │       ├── Quality Class (CheckCircle icon + green text)
    │       ├── Suitable For (Plant badges: green-50 pill badges)
    │       └── Appliance Impact (Bulleted impact list)
    └── Health Impact & Remedies Card (bg-white rounded-2xl shadow-sm border border-gray-100 p-6)
        ├── Water Potability (CheckCircle for Safe / AlertTriangle for Not Safe)
        ├── Skin/Hair Disease Risk (Color-coded risk status)
        └── Recommended Remedies (Checklist with green checkmark markers)
```

### 2.3 MetricCard Subcomponent
Located at `frontend/src/App.tsx:256-269`:
```tsx
function MetricCard({ title, value, unit, icon }: { title: string, value: string, unit: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4 flex items-baseline">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {unit && <p className="ml-1 text-sm font-medium text-gray-500">{unit}</p>}
      </div>
    </div>
  )
}
```

---

## 3. API Integration & State Management

### 3.1 Endpoint Configuration
- Base URL determined dynamically via Vite environment variable (`App.tsx:26`):
  ```typescript
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  ```

### 3.2 State Structure
`App.tsx:29-44`:
```typescript
const [data, setData] = useState({
  ph: 0,
  tds: 0,
  turbidity: 0,
  temperature: 0
});

const [analysis, setAnalysis] = useState({
  health_score: 0,
  quality_class: "Loading...",
  risk_level: "Loading...",
  plant_suitability: [],
  appliance_impact: [],
  skin_risk: "Loading...",
  potability: "Loading..."
});
```

### 3.3 Polling Mechanism
`App.tsx:73-116`:
```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      const dataRes = await fetch(`${API_BASE_URL}/api/latest-data`);
      if (dataRes.ok) {
        const latestData = await dataRes.json();
        setData(latestData);
        setIsOnline(true);
        // Update rolling chart history (last 7 points)
        setHistory(prev => { ... });
        setLabels(prev => { ... });
      }

      const analysisRes = await fetch(`${API_BASE_URL}/api/analysis`);
      if (analysisRes.ok) {
        const latestAnalysis = await analysisRes.json();
        setAnalysis(latestAnalysis);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsOnline(false);
    }
  };

  fetchData();
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, []);
```

---

## 4. Health Analysis & Remedies Card Analysis

### 4.1 Existing AI Health Analysis Card
Located at `App.tsx:173-210`:
- Features:
  - **Health Score**: Large numeric display (`0` to `100`).
  - **Quality Class**: Classification string (`"Excellent"`, `"Moderate"`, `"Poor"`, `"Unsafe"`) with `<CheckCircle />`.
  - **Suitable For**: Array of compatible plants (e.g. `["Tulsi", "Tomato"]`).
  - **Appliance Impact**: Array of household impact assessments (e.g. `["Safe for RO", "Safe for Geyser"]` or `["May scale RO filters"]`).

### 4.2 Health Impact & Remedies Card
Located at `App.tsx:214-249`:
```tsx
{/* Health Impact & Remedies */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
  <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">Health Impact & Remedies</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div>
      <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Water Potability</span>
      <div className="mt-2 text-lg font-medium text-gray-800 flex items-center space-x-2">
        {analysis.potability === 'Safe for Drinking' ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : analysis.potability === 'Not Safe for Drinking' ? (
          <AlertTriangle className="h-5 w-5 text-red-500" />
        ) : (
          <Activity className="h-5 w-5 text-gray-400" />
        )}
        <span className={analysis.potability === 'Safe for Drinking' ? "text-green-600" : analysis.potability === 'Not Safe for Drinking' ? "text-red-600" : "text-gray-500"}>
          {analysis.potability}
        </span>
      </div>
    </div>
    <div>
      <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Skin/Hair Disease Risk</span>
      <div className={`mt-2 text-lg font-medium ${getSkinRiskColor(analysis.skin_risk)}`}>
        {analysis.skin_risk}
      </div>
    </div>
  </div>
  <div className="pt-4 border-t border-gray-100">
     <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Recommended Remedies</span>
     <ul className="mt-4 space-y-2">
       {getRemedies(analysis.skin_risk).map(remedy => (
         <li key={remedy} className="text-gray-700 flex items-center before:content-['✓'] before:mr-2 before:text-green-500 before:font-bold">
           {remedy}
         </li>
       ))}
     </ul>
  </div>
</div>
```

---

## 5. ML Model Classes vs Frontend Mapping Logic

### 5.1 Trained Model Classes Verification
Verification command executed on `ml model/skin_risk_model.pkl`:
`RandomForestClassifier` trained with `classes_`:
1. `'Acidic Irritant Contact Dermatitis'`
2. `'Bacterial / Fungal Infection Risk'`
3. `'Eczema / Skin Barrier Damage'`
4. `'Pseudomonas Folliculitis (Hot Tub Rash)'`
5. `'Safe (No Skin Risk)'`
6. `'Severe Xerosis (Dry Skin Risk)'`

### 5.2 Current Remedy Mapping Function (`App.tsx:46-60`)
```typescript
const getRemedies = (risk: string) => {
  if (risk === "Loading..." || risk === "Unknown") return ["Awaiting water quality data..."];
  switch(risk) {
    case 'Bacterial / Fungal Infection Risk':
      return ["Use antibacterial/antifungal soap", "Install a UV filter", "Boil water before use"];
    case 'Eczema / Skin Barrier Damage':
      return ["Use a heavy moisturizer", "Avoid hot showers", "Install a water softener"];
    case 'Acidic Irritant Contact Dermatitis':
      return ["Use gentle, pH-balanced cleansers", "Avoid long showers", "Install a neutralizing filter"];
    case 'Safe (No Skin Risk)':
      return ["No specific remedies needed, water is safe!"];
    default:
      return ["Consult a dermatologist if you experience skin issues."];
  }
};
```

### 5.3 Gap Analysis & Proposed Enhancement
Two model classes currently fall through to `default`:
- `'Pseudomonas Folliculitis (Hot Tub Rash)'`: High-temperature water with bacterial contamination (often hot tubs or geysers).
  - Recommended actions:
    1. Disinfect water storage tank and verify chlorination / UV sterilization
    2. Avoid bathing in contaminated hot water; use cool or filtered water
    3. Apply warm compress and consult a dermatologist for topical/oral antibiotic treatment
- `'Severe Xerosis (Dry Skin Risk)'`: High TDS / mineral harshness or excessive water hardness causing severe drying.
  - Recommended actions:
    1. Apply lipid/ceramide-rich emollient or barrier cream immediately after washing
    2. Avoid harsh soaps and switch to syndicated, soap-free hydrating cleansers
    3. Limit bathing time and use lukewarm water; install an ion-exchange water softener

### 5.4 Risk Color Coding (`App.tsx:62-66`)
```typescript
const getSkinRiskColor = (risk: string) => {
  if (risk === 'Safe (No Skin Risk)') return 'text-green-500';
  if (risk === 'Loading...' || risk === 'Unknown') return 'text-gray-500';
  return 'text-orange-500';
};
```
Recommended refinement:
- High severity/infection (`'Bacterial / Fungal Infection Risk'`, `'Pseudomonas Folliculitis (Hot Tub Rash)'`): `text-red-500`
- Moderate irritation/dryness (`'Eczema / Skin Barrier Damage'`, `'Acidic Irritant Contact Dermatitis'`, `'Severe Xerosis (Dry Skin Risk)'`): `text-orange-500`
- Safe: `text-green-500`
- Loading/Unknown: `text-gray-500`

---

## 6. Styling System & Tailwind Configuration

### 6.1 Theme & Custom Tokens (`frontend/tailwind.config.js`)
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aqua: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6', // Primary Teal
          700: '#0f766e',
          900: '#134e4a',
        }
      }
    },
  },
  plugins: [],
}
```

### 6.2 Established UI Styling Conventions
| Element Type | Established Tailwind Classes | Purpose |
| :--- | :--- | :--- |
| **Page Canvas** | `min-h-screen bg-gray-50` | Soft off-white backdrop |
| **Top Navigation** | `bg-white shadow-sm border-b border-gray-200` | Clean fixed/sticky header |
| **Card Container** | `bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6` | Uniform card styling |
| **Card Interactive** | `hover:shadow-md transition-shadow` | Card hover elevation |
| **Card Section Header** | `text-lg font-semibold text-gray-800 border-b pb-2` | Card title with underline |
| **Field Category Label** | `text-sm text-gray-500 uppercase tracking-wider font-semibold` | Small uppercase label |
| **Divider** | `pt-4 border-t border-gray-100` | Section break within card |
| **Pill Badge** | `px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium` | Tag/badge container |
| **Icon Wrapper** | `p-2 bg-gray-50 rounded-lg` | Icon container in metric cards |
| **List Item with Pseudo**| `before:content-['✓'] before:mr-2 before:text-green-500 before:font-bold` | Custom bullet icon |

---

## 7. Frontend Build & Tooling Setup

### 7.1 Build Commands & Scripts
- Development: `npm run dev` (`vite`)
- Production Build: `npm run build` (`tsc && vite build`)
- Preview: `npm run preview` (`vite preview`)

### 7.2 Verification Result
- Executed `npm run build` in `frontend/`.
- TypeScript (`tsc`) compile: **PASSED** (0 errors).
- Vite bundle output:
  - `dist/index.html`: `0.43 kB`
  - `dist/assets/index-a29b8be5.css`: `11.74 kB` (gzip: `3.04 kB`)
  - `dist/assets/index-59f76caa.js`: `321.20 kB` (gzip: `107.57 kB`)
- Exit code: **0**.

---

## 8. Recommendations for Orchestrator & Implementer

1. **Complete Model Class Coverage in `getRemedies()`**:
   Add explicit cases for `'Pseudomonas Folliculitis (Hot Tub Rash)'` and `'Severe Xerosis (Dry Skin Risk)'` in `frontend/src/App.tsx:46-60` to ensure no predicted classes fallback to the generic message.
2. **Refine Risk Severity Color Indicator**:
   Adjust `getSkinRiskColor()` to render bacterial/infectious conditions in red (`text-red-500`) and dermatological irritation in amber/orange (`text-orange-500`).
3. **Verify CORS & Network Ports**:
   Ensure Vite development server connects to FastAPI backend on `http://localhost:8000` via `API_BASE_URL`.
4. **Current Status**:
   The existing code in `frontend/src/App.tsx` already fulfills the core acceptance criteria of the original request and compiles cleanly.
