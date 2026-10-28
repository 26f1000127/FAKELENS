# FAKELENS — Veryfi AI Brand Governance Platform Frontend

An enterprise AI Brand Governance frontend integrated into `FAKELENS` (`https://github.com/sahejpreet-glitch/FAKELENS`). Veryfi AI empowers marketing, design, and compliance teams to verify, align, and approve creative assets, ad campaigns, and brand guidelines with instantaneous AI feedback.

---

## 🎨 Screens & Features

The application incorporates all seven core Veryfi AI modules faithfully structured from the UI reference blueprints located in `resources/`:

1. **Dashboard (`#/dashboard`)**
   - Brand Governance Hero banner with animated badge highlights (`Brand Match`, `Fact Check`, `Design Check`, `AI Approved`).
   - Drag & Drop content upload trigger supporting ad designs, imagery, marketing copy, PDFs, and videos.
   - Core feature pillars: *Brand Consistency*, *Fact Checking*, *AI Auto-Fix*, and *Instant Decision*.
   - Honest Brand Health compliance gauge (`Awaiting First Audit`) and honest Recent Audits empty state.

2. **New Audit & Audit Results (`#/new-audit`)**
   - Local drag-and-drop file inspection with local object URL preview, image zoom modal, and metadata display (name, size, MIME type, modified date).
   - Clean decoupled frontend mode informing the user that automated AI multi-modal inference requires backend connection.
   - Dedicated *Design Blueprint Spec* tab clearly isolating the static design benchmark reference sourced from `resources/verify audit.png`.

3. **Brand Assets (`#/brand-assets`)**
   - Unified brand asset repository with category filtering (*Logos*, *Colors*, *Fonts*, *Templates*, *Imagery*, *Documents*).
   - Honest empty states for unpopulated assets with accessible *+ Add Asset* modal.
   - Hex palette swatch matrix with defined semantic roles (`Primary`, `Secondary`, `Background`, `Text`, `Accent`).
   - Typography specifications (Headings & Body text).
   - Real-time client asset storage gauge and interactive *Edit Brand Colors* and *Edit Typography* drawers.
   - Dedicated option to inspect the static design reference logo spec from `resources/veryfi lojo.png`.

4. **Brand Guidelines (`#/guidelines`)**
   - 8-category baseline governance rule explorer (*Brand Voice & Tone*, *Messaging & Positioning*, *Visual Identity*, *Typography*, *Colour Usage*, *Logo & Asset Usage*, *Claims & Compliance*, *Accessibility*).
   - Real-time search filter across all guideline categories.
   - Detail panel with voice attribute tags, actionable *Writing Do's and Don'ts*, and *On-Brand* vs *Off-Brand* copywriting examples.
   - Accessible *+ Create Guideline* modal.

5. **Audit History (`#/audit-history`)**
   - Comprehensive audit log with honest empty state when no audits have been processed.
   - Multi-parameter filtering (*Content Type*, *Time Period*, and full-text search) and sorting (*Newest* vs *Oldest*).
   - Detailed inspection drawer with *Audit Summary*, *Issues & Fixes*, and *Technical Analysis* tabs when audits exist.

6. **Analytics (`#/analytics`)**
   - Brand compliance trend tracking with honest initial zero-data state (`—` values and empty state notices matching `resources/verify analysis.png`).
   - Top-level compliance KPIs (*Total Audits*, *Approved*, *Needs Fix*, *Rejected* all initialized to `—`).
   - Donut breakdown for issue distribution and content volume by format (*Images*, *Text*, *Video*, *PDF*).
   - Interactive date range selector (*Last 7 Days*, *Last 30 Days*, *Last 90 Days*, *Year to Date*).

7. **Settings (`#/settings`)**
   - Session-only configuration notice explaining that settings update client state for the active browser session.
   - Workspace configuration (*Organization details*, *Industry classification*, *Workspace Logo*).
   - Hex color validation with live *Brand Preview* card updating in real time.
   - Granular compliance rule toggles (*Brand Consistency*, *Fact Checking*, *Claims & Compliance*, *Accessibility*).
   - Complete sub-views for *Team* (member roster & invite modal), *Integrations* (Figma, Adobe, Slack, Webhooks), *API* (key viewer & copy), and *Notifications*.
   - Administrative danger zone with confirmation modal and protected workspace deletion.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React 18 with TypeScript 5.7
- **Bundler & Dev Server**: Vite 6.1
- **Styling**: Tailwind CSS 3.4 with custom Veryfi design tokens, glassmorphism styling & WCAG AA contrast
- **Icons**: Lucide React
- **Routing**: Browser hash history synchronization (`#/dashboard`, `#/new-audit`, etc.) with browser back/forward support
- **Backend Decoupling**: Typed API interface contracts defined in `src/services/apiContract.ts` to ensure seamless plug-and-play compatibility with future backend microservices.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18.0.0` or newer (`v24.18.0` tested)
- npm `v9.0.0` or newer

### Installation
```bash
npm install
```

### Running the Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5173`.

### Production Build & Type Checking
```bash
# Type-check TypeScript codebase
npm run type-check

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Repository Structure

```text
FAKELENS/
├── index.html                   # HTML entry point with dark theme styles
├── package.json                 # Consolidated dependencies and scripts
├── postcss.config.js            # PostCSS configuration for Tailwind
├── tailwind.config.js           # Veryfi design tokens, colors & shadows
├── tsconfig.json                # TypeScript compiler settings
├── tsconfig.node.json           # Node TypeScript configuration
├── vite.config.ts               # Vite configuration + asset copy plugin
├── resources/                   # Preserved original UI reference blueprints
│   ├── veryfi dashboard.png     # Dashboard screen design
│   ├── verify audit.png         # New Audit / Audit Result design
│   ├── veryfi lojo.png          # Brand Assets design
│   ├── veryfi guidlnes.png      # Brand Guidelines design
│   ├── veryfy 1.png             # Audit History design
│   ├── verify analysis.png      # Analytics initial state design
│   └── verify setttings.png     # Workspace Settings design
├── src/
│   ├── main.tsx                 # React DOM mount
│   ├── App.tsx                  # Root layout, router & state orchestrator
│   ├── index.css                # Global Tailwind directives & glass panels
│   ├── types/                   # TypeScript interfaces
│   │   └── index.ts
│   ├── services/                # Backend API contracts
│   │   └── apiContract.ts
│   ├── data/                    # Design token schemas & seed data
│   │   └── mockData.ts
│   ├── components/
│   │   ├── layout/              # Sidebar, Header, Breadcrumbs
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── common/              # Reusable UI primitives
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Toast.tsx
│   │       ├── CircularProgress.tsx
│   │       └── BackendStatusBanner.tsx
│   └── pages/                   # Seven Veryfi AI screens
│       ├── Dashboard.tsx
│       ├── NewAudit.tsx
│       ├── BrandAssets.tsx
│       ├── BrandGuidelines.tsx
│       ├── AuditHistory.tsx
│       ├── Analytics.tsx
│       └── Settings.tsx
└── dontdelte.py                 # Preserved existing user file
```

---

## 🛡️ Git Safety & Integration Notes

- Base commit: `4aaf4120e799f04a597c43be8dbdb361f5fc2de1` (`Initial commit` from `FAKELENS/main`).
- Previous `codex-48` integration branch (`feature/veryfi-ai-frontend`, commit `0e505aa`) remains preserved in local Git history.
- All original files (`resources/` and `dontdelte.py`) are strictly preserved.
- No backend code was fabricated or falsely claimed as live.
- Verification-dependent actions indicate clear backend-readiness requirements.
