# Frontend — Technical Setup

React TypeScript SPA with Vite, Tailwind CSS, and TanStack Query.

## Prerequisites

- Node.js 18+
- npm 9+

## Installation

```bash
npm install
```

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure API endpoint:
```env
VITE_API_URL=http://localhost:8000/api
```

## Development

```bash
# Dev server with hot reload
npm run dev

# Type checking
npx tsc --noEmit

# Build for production
npm run build

# Preview production build
npm run preview
```

## Dependencies

**Core:**
- `react` 18.3 — UI library
- `react-router-dom` 7.1 — Client-side routing
- `typescript` 5.6 — Type safety

**Data Fetching:**
- `@tanstack/react-query` 5.62 — Server state management
- `axios` 1.7 — HTTP client

**Styling:**
- `tailwindcss` 3.4 — Utility-first CSS
- `lucide-react` 0.469 — Icon library

**Date Handling:**
- `react-datepicker` 7.5 — Custom date input component

## Architecture

```
src/
├── main.tsx              # App entry, QueryClient setup
├── App.tsx               # Layout, routing, sidebar
├── api/
│   └── client.ts         # Axios instance, API functions
├── components/
│   └── DateInput.tsx     # Reusable date picker (mm.dd.yy format)
├── pages/                # Route components
├── types/
│   └── index.ts          # TypeScript interfaces, enums
└── utils/
    └── dateFormat.ts     # Date formatting helpers
```

## Build Output

```bash
npm run build
# Output: dist/
# - index.html
# - assets/ (hashed JS/CSS bundles)
```

## Vite Configuration

- Dev server port: 3000
- Proxy `/api` requests to backend (Docker: `http://backend:8000`)
- Build target: ES2020

## TypeScript

- Strict mode enabled
- Path aliases not configured (use relative imports)
- `@types` packages installed as needed
