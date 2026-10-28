# TravelWise AI+ 2.0 — Adaptive AI Travel Planner & Budget Guardian

[![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1-black.svg)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.3-teal.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-12%2F12%20Passing-emerald.svg)]()
[![License](https://img.shields.io/badge/License-Academic_Capstone_2.0-teal.svg)]()

> An enterprise-grade, responsive full-stack platform featuring **Adaptive Travel Intelligence 2.0**, **Smart Budget Guardian 2.0 (Three-Tier Modeling)**, **Live Satellite Weather Forecasting (Open-Meteo)**, **Contextual AI Travel Buddy 2.0**, **Minimum Cash Flow Group Debt Optimizer**, and **Full Itinerary Rollback / Undo Auditability**.

---

## 1. Defining Differentiator: Adaptive Travel Intelligence 2.0

Ordinary travel planning platforms generate a static itinerary and compute basic addition for expenses. **TravelWise AI+ 2.0** introduces **Adaptive Travel Intelligence**: a real-time, multi-constraint evaluation engine that re-optimizes your schedule when live circumstances change.

### Multi-Constraint Optimization Matrix
$$\text{Activity Score} = 0.40 \times \text{Interests} + 0.30 \times \text{Budget} + 0.20 \times \text{WeatherViability} + 0.10 \times \text{TransitEfficiency}$$

1. **Autonomous Budget Overrun Detection**: When day 1 or intermediate spending exceeds daily targets, the engine identifies high-cost entries and calculates cheaper alternatives with transparent trade-offs.
2. **Live Open-Meteo Satellite Integration**: Integrates real-time weather forecasts (temperature, humidity, precipitation probability, and wind speed) with a 1-hour in-memory cache and offline historical benchmarks. When rain is detected, outdoor activities are seamlessly matched with certified indoor cultural or sheltered venues.
3. **Audit History & Single-Click Rollback (Undo)**: Every adaptation takes an immutable JSON snapshot of all activities before applying changes. If users wish to revert an adaptation, a single click restores the exact previous itinerary snapshot.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Client Frontend (React 19 + TypeScript + Vite)             │
│   • Dark / Light Theme System with persistent local storage preference        │
│   • Live Satellite Weather Chips & Pre-trip Precipitation Advisories         │
│   • Recharts Financial Visualizations & Drag-and-Drop Receipt Dropzone        │
│   • Adaptive Modal with Side-by-Side Trade-off Matrices & Undo Feed           │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ JSON API Requests (JWT Auth)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Application Backend (Python Flask 3.1)                   │
│   • auth.py: scrypt password hashing, PyJWT claims, rate-limited resets       │
│   • trips.py: Multi-day itineraries with live Open-Meteo weather integration  │
│   • destination_data.py: Multi-factor scoring formula & Open-Meteo client     │
│   • adaptive.py: Constraint audit, alternative ranking, snapshot & undo       │
│   • expenses.py: Three-Tier Model (Actuals vs Benchmark vs Commitments)       │
│   • group_expenses.py: Minimum Cash Flow debt solver with zero-sum invariant  │
│   • chatbot.py: Dual-mode (Google GenAI Gemini 2.5 + Deterministic Math)      │
│   • travel_helper.py: Regional emergency numbers, phrasebooks & SQLite logs   │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ SQLite Engine
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                  Persistent Database (travelwise.db / SQLite)                │
│   Users • Password Resets • Trips • Itinerary Days • Activities              │
│   Itinerary Revisions (Audit & Snapshots) • Expenses • Receipts              │
│   Group Members • Group Splits • Support Requests • Chat Logs                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Next-Generation 2.0 Upgrades Summary

| Component | Baseline 1.0 State | Upgraded 2.0 Production State |
|---|---|---|
| **Theme System** | Dark-only theme | **Light & Dark Theme System** with persistent toggle in Navbar |
| **Live Weather** | Simulated static text | **Live Open-Meteo Satellite API** (temperature, conditions, precipitation warning, offline caching) |
| **Adaptive Intelligence** | 1-way overwrite | **Multi-factor preference scoring (4 components), Side-by-side trade-offs, and Single-Click Snapshot Rollback (Undo)** |
| **Budget Guardian** | Simple actuals sum | **Three-Tier Financial Modeling**: Logged Actuals + Benchmark Target + Future Scheduled Commitments = Projected Final Spend |
| **Forecast Confidence** | None | **Statistical Confidence Metric** (Preliminary 30%, Early 60%, High Confidence 88%) with explicit methodology |
| **Receipt Scanner** | Text manual entry only | **Drag-and-Drop Receipt Upload Modal** with client & server validation (5MB max, PNG/JPG/WEBP/PDF) |
| **Group Debt Splitter** | Basic transfers | **Minimum Cash Flow Algorithm** with **Zero-Sum Mathematical Invariant Verification** ($\sum \text{balances} == 0.00$) |
| **AI Travel Buddy** | Basic prompt replies | **Deterministic Math Engine** (exact arithmetic calculated in Python, structured action chips) |
| **Testing Suite** | 8 baseline tests | **12 Comprehensive Integration Tests** covering undo, weather, receipt validation, and invariant checks |

---

## 3. Quick Start & Execution

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (tested with Vite 8.3)

### 1. Launch the Application
From the repository root directory, run:

```powershell
py run_app.py
```

The application will start on:
- **Full-Stack Application**: [http://localhost:5000](http://localhost:5000)
- **API Health Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Default Database**: `backend/travelwise.db` (SQLite)

### 2. Pre-Seeded Academic Demo Account
For evaluation and testing convenience, the database automatically initializes with a pre-seeded trip:
- **Email**: `demo@travelwise.ai`
- **Password**: `Password123!`
- **Destination**: *3-Day Ooty Misty Mountain Getaway* (Starting City: Bangalore)
- **Pre-recorded Expenses**: Express Bus (₹1,400), Cottage Advance (₹2,200), Breakfast (₹350)
- **Travelers**: Alex Chen & Rohan Sharma

*(You can also create independent accounts anytime via the Sign Up page).*

### 3. Run Automated Integration Tests
To execute all 12 backend integration tests:

```powershell
$env:PYTHONPATH = "backend"
py backend/tests_integration.py
```
Expected output:
```
............
----------------------------------------------------------------------
Ran 12 tests in 4.416s

OK
```

### 4. Rebuild Frontend Client (Optional)
To re-compile the React 19 frontend into production distribution assets:

```powershell
cd client
npm run build
```
Builds in under 1 second with 0 TypeScript and bundling errors.

---

## 4. Key Pages & Workflows

### A. Personal Dashboard 2.0 (`/dashboard`)
- Status tabs: **All Trips**, **Active / Ongoing**, **Upcoming**, and **Past**.
- Live destination weather badges (e.g. ⛅ 22°C Partly Cloudy, or 🌧️ Rain Warning).
- Quick launch buttons: **Itinerary**, **Budget Guardian**, **Group Splitter**, and **Adapt Schedule**.
- **Revision History Feed**: Displays recent autonomous adaptations with a 1-click **Undo** button.

### B. Interactive Itinerary View (`/itinerary`)
- Sequential timeline with duration, time slots, and Google Maps direct directions.
- Activity metadata tags: **Opening Hours**, **Transit Time**, **Weather Suitability**, and **Preference Match Score**.
- Contextual weather alert banner when precipitation risk is detected at destination.
- Instant swap buttons: **Cheaper Spot** and **Indoor Alternative**.

### C. Smart Budget Guardian & Expense Detective 2.0 (`/budget`)
- **Three-Tier Financial Forecast**:
  - **Tier 1 (Logged Actuals)**: Verified expenditure recorded by user.
  - **Tier 2 (Target Benchmark)**: Maximum total budget ceiling.
  - **Tier 3 (Future Commitments)**: Unvisited scheduled activities + living expense baseline buffer.
  - **Projected Final Spend & Variance**: Proactively flags surplus reserves or potential budget overruns.
- **Forecast Confidence Badge**: Explains statistical confidence level and trend reliability.
- **Receipt Mock Upload**: Drag-and-drop receipt or invoice with client and backend file validation.
- **Expense Detective Anomaly Scanner**: Detects individual transactions $\ge 3\times$ average transaction value.

### D. Group Debt Optimizer 2.0 (`/group-splitter`)
- Individual traveler breakdown (Total Paid, Fair Share, Net Balance).
- **Minimum Cash Flow Solver**: Reduces multi-party debt cycles into minimal direct settlement transfers.
- **Zero-Sum Mathematical Invariant Badge**: Confirms $\sum \text{net balances} == 0.00$.
- One-click **Copy Settlement Summary** for easy messaging app export.

### E. AI Travel Buddy 2.0 (Drawer)
- Accessible from any page via the floating avatar.
- Grounded in active trip context with zero hallucinated calculations.
- Dispatches action cards into the chat to launch adaptive recalculation or category drill-downs.
- Connects to Google Gemini 2.5 Flash when `GEMINI_API_KEY` is configured, or runs the local deterministic heuristic engine.

### F. Travel Helper & Safety Hub 2.0 (`/helper`)
- Jurisdiction-tagged emergency hotlines (India 🇮🇳, EU 🇪🇺, USA 🇺🇸, UK 🇬🇧).
- Official government tourism portals and phonetic local language phrasebooks.
- Persistent support ticket submission logged safely into SQLite for grading demonstration.

---

## 5. Security & Verification Architecture

- **Password Storage**: `scrypt` hashing via Werkzeug Security (zero plaintext passwords).
- **Session Tokens**: PyJWT (HS256) with 24-hour expiration and strict `sub` type safety.
- **Rate Limiting**: Brute-force protection on authentication and password reset endpoints.
- **Development Safeguards**: Development reset token helper is strictly restricted to `DEBUG=True`.
- **User Data Isolation**: Database queries enforce `user_id = request.user_id` to prevent unauthorized cross-tenant data access.
- **File Validation**: Receipt uploads enforce 5MB file size limits and MIME whitelisting (`png`, `jpg`, `jpeg`, `webp`, `pdf`).

---

## 6. University Demonstration Checklist

| # | Evaluation Scenario | Action in Web App | Expected Verified Result |
|---|---|---|---|
| 1 | **Theme Toggle** | Click the Moon/Sun icon in the Navbar | App toggles smoothly between Dark Navy and Clean Light mode; preference persists across reload. |
| 2 | **Inspect Live Weather** | View the destination weather badge on Dashboard or Itinerary header | Displays live satellite temperature and conditions retrieved from Open-Meteo. |
| 3 | **Three-Tier Financial Model** | Navigate to `/budget` | Displays Tier 1 Actuals, Tier 2 Target, Tier 3 Future Commitments, and Projected Final Spending. |
| 4 | **Receipt Upload Validation** | On Budget page, click "Upload Receipt" → Upload a file | Validates size ($\le 5\text{MB}$) and type, parses metadata, and pre-fills the expense form. |
| 5 | **Adaptive Recalibration** | On Itinerary page, click "Budget Cut" or "Rain Adapt" | Evaluates constraints, calculates 4-part preference match score, and shows side-by-side trade-offs. |
| 6 | **Apply & Undo Adaptation** | Click "Confirm & Apply" → View Dashboard / Itinerary → Click "Undo Adaptation" | Snapshot is saved in `itinerary_revisions`; clicking Undo immediately restores previous activities. |
| 7 | **Zero-Sum Group Reconciliation** | Navigate to `/group-splitter` | Displays "Strict Zero-Sum Reconciled (Sum = 0.00)" and minimal cash flow settlement transfers. |
| 8 | **Deterministic AI Buddy** | Open AI Buddy chat → Ask "How much did I spend on food?" | AI Buddy replies with exact ledger arithmetic and provides action chips. |
| 9 | **Automated Test Suite** | Run `py backend/tests_integration.py` in terminal | All 12 integration tests pass with `OK`. |
| 10 | **Production Client Build** | Run `npm run build` in `client` | Compiles Vite production bundle in under 1 second with 0 errors. |
