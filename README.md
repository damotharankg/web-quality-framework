# 🛡️ Web Application Quality Framework (`web-quality-framework`)

> A centralized, modular, scalable, and technology-independent quality assurance framework that automatically executes **VAPT**, **E2E Automation Testing**, **Browser Console Cleanup**, **Dependency Audits**, and **Frontend Quality Checks** across React, Angular, Vue, Next.js, and other frontend stacks.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [The 5 Core Pillars](#-the-5-core-pillars)
  - [1. Vulnerability Assessment & Penetration Testing (VAPT)](#1-vulnerability-assessment--penetration-testing-vapt)
  - [2. End-to-End (E2E) Automation Testing](#2-end-to-end-e2e-automation-testing)
  - [3. Browser Console Cleanup & Runtime Monitoring](#3-browser-console-cleanup--runtime-monitoring)
  - [4. Package & Dependency Audit](#4-package--dependency-audit)
  - [5. Frontend Quality Check (WCAG & Web Vitals)](#5-frontend-quality-check-wcag--web-vitals)
- [Installation & Quick Start](#-installation--quick-start)
- [Framework-Specific Presets](#-framework-specific-presets)
  - [React & Vite](#react--vite)
  - [Next.js (App & Pages Router)](#nextjs-app--pages-router)
  - [Vue & Nuxt](#vue--nuxt)
  - [Angular](#angular)
- [Configuration Reference (`quality.config.js`)](#-configuration-reference-qualityconfigjs)
- [CLI Commands](#-cli-commands)
- [Client Runtime Monitoring SDK](#-client-runtime-monitoring-sdk)
- [Consolidated Quality Reports](#-consolidated-quality-reports)
- [CI/CD Quality Gate Integration](#-cicd-quality-gate-integration)

---

## 🏛️ Architecture Overview

The Web Application Quality Framework is engineered around a **"Develop Once, Integrate Anywhere"** paradigm:

```
                      ┌───────────────────────────────────────────────┐
                      │          web-quality-framework CLI           │
                      │             & Node Programmatic API           │
                      └───────────────────────┬───────────────────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              │                               │                               │
    ┌─────────▼─────────┐           ┌─────────▼─────────┐           ┌─────────▼─────────┐
    │  Pillar 1: VAPT   │           │   Pillar 2: E2E   │           │ Pillar 3: Console │
    │  - SAST Scanner   │           │  - Auto-Crawler   │           │  - Error Trapper  │
    │  - Header Auditor │           │  - Journey Engine │           │  - React Classifier│
    │  - Secret Leaks   │           │  - Viewports      │           │  - Vue / Angular  │
    └───────────────────┘           └───────────────────┘           └───────────────────┘
              │                               │                               │
              └───────────────────────────────┼───────────────────────────────┘
                                              │
                              ┌───────────────┴───────────────┐
                              │                               │
                    ┌─────────▼─────────┐           ┌─────────▼─────────┐
                    │  Pillar 4: Deps   │           │  Pillar 5: Quality│
                    │  - CVE Audit      │           │  - WCAG 2.1 A11y  │
                    │  - Outdated Deps  │           │  - Responsiveness │
                    │  - Non-Breaking   │           │  - Web Vitals     │
                    └───────────────────┘           └───────────────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │ Unified Scorecard │
                                    │  & HTML Dashboard │
                                    │  (0-100 / Grade)  │
                                    └───────────────────┘
```

---

## 🎯 The 5 Core Pillars

### 1. Vulnerability Assessment & Penetration Testing (VAPT)
- **Static Application Security Testing (SAST)**:
  - Scans source trees for dangerous XSS sinks: `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, `eval()`, and `new Function()`.
  - Flags insecure `postMessage` calls with `*` wildcard target origins and missing `event.origin` validations.
  - Detects hardcoded secrets, AWS keys, Stripe live keys, JWT tokens, and private keys.
  - Identifies insecure cleartext `http://` endpoints and insecure iframe sandbox bypasses.
- **HTTP Transport & Security Headers Auditor**:
  - Live verification of `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS), `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and CORS headers.
  - Cookie security flag auditing (`Secure`, `HttpOnly`, `SameSite`).
- **Dynamic VAPT & DOM Probes**:
  - Scans `localStorage`, `sessionStorage`, and global `window` object for leaked authentication credentials or sensitive customer data.
  - Flags reverse tabnabbing vulnerabilities (`target="_blank"` without `rel="noopener noreferrer"`).

### 2. End-to-End (E2E) Automation Testing
- **Configurable User Journeys**: Declarative journey definitions supporting user actions (`navigate`, `click`, `fill`, `assertText`, `assertVisible`, `wait`).
- **Autonomous Route Crawler**: Discovers internal routes automatically, verifies HTTP status codes, and ensures error-free page loads.
- **Multi-Viewport Matrix**: Executes tests across Desktop (1920x1080), Laptop (1366x768), Tablet (768x1024), and Mobile (375x812).
- **Pluggable Engine**: Automatically activates Playwright headless browsers when available, with a zero-dependency synthetic DOM runner fallback.

### 3. Browser Console Cleanup & Runtime Monitoring
- **Framework-Specific Classifiers**:
  - **React**: Missing list `key` props, state updates on unmounted components, invalid DOM attributes (`class` vs `className`), controlled/uncontrolled transitions, and hook dependencies.
  - **Vue**: Direct prop mutation violations (`Avoid mutating a prop directly`), duplicate `v-for` keys.
  - **Angular**: `ExpressionChangedAfterItHasBeenCheckedError` (NG0100), `NullInjectorError` (NG0201).
- **Runtime Error Trapping**: Uncaught exceptions, unhandled Promise rejections, and failed network assets (404/500/CORS).
- **Smart Aggregator**: Deduplicates repetitive messages, calculates frequency, and provides copy-paste remediation steps.

### 4. Package & Dependency Audit
- **Vulnerability Scanning**: Evaluates installed dependencies against the National Vulnerability Database / GitHub Advisory Database (`npm audit`, `pnpm audit`, `yarn audit`).
- **Outdated Package Detection**: Identifies `patch`, `minor`, and `major` updates.
- **Non-Breaking Automated Update Algorithm**: Distinguishes between safe backwards-compatible updates (patch/minor) and major breaking releases.
- **Remediation Scripts**: Generates exact CLI update commands (e.g. `npm update`, `npm audit fix`).

### 5. Frontend Quality Check (WCAG & Web Vitals)
- **Accessibility (WCAG 2.1 Level AA)**:
  - Missing `alt` tags on images.
  - Missing `<label>` or `aria-label` on form inputs.
  - Empty or unlabelled `<button>` elements.
  - Heading hierarchy skips (e.g. `<h1>` followed by `<h3>`).
  - Missing `<html lang="...">` attributes.
- **Responsive Layout & Viewport Stability**:
  - Detects hardcoded pixel widths causing horizontal overflow on mobile screens.
  - Validates `<meta name="viewport">` responsiveness configuration.
- **Core Web Vitals & Resource Profiler**:
  - First Contentful Paint (FCP) and Largest Contentful Paint (LCP) estimates.
  - DOM node count monitoring to prevent browser rendering jank.

---

## 🚀 Installation & Quick Start

### 1. Install via npm
```bash
npm install --save-dev web-quality-framework
```

### 2. Initialize in your project
```bash
npx web-quality init
```
This automatically detects your frontend framework (React, Next.js, Vue, Angular, or Vanilla) and generates a preconfigured `quality.config.js`.

### 3. Run the complete quality suite
```bash
npx web-quality run
```

---

## 🧩 Framework-Specific Presets

### React & Vite
In `quality.config.js`:
```js
export default {
  project: {
    name: 'My React Application',
    framework: 'react',
    srcDir: 'src',
  },
  server: { url: 'http://localhost:5173' },
  consoleMonitor: {
    enabled: true,
    failOnError: true,
    categorizeFrameworkWarnings: true, // Specifically identifies React missing key warnings
  },
  vapt: {
    sast: { scanDangerousSinks: true } // Scans dangerouslySetInnerHTML
  }
};
```

### Next.js (App & Pages Router)
In `quality.config.js`:
```js
export default {
  project: {
    name: 'My Next.js Application',
    framework: 'nextjs',
    srcDir: '.',
  },
  server: { url: 'http://localhost:3000' },
  e2e: {
    autoCrawl: {
      enabled: true,
      ignorePatterns: ['/_next/**', '/api/**']
    }
  }
};
```

### Vue & Nuxt
In `quality.config.js`:
```js
export default {
  project: {
    name: 'My Vue App',
    framework: 'vue',
    srcDir: 'src',
  },
  server: { url: 'http://localhost:5173' },
  vapt: {
    sast: { scanDangerousSinks: true } // Scans unsafe v-html
  }
};
```

### Angular
In `quality.config.js`:
```js
export default {
  project: {
    name: 'My Angular App',
    framework: 'angular',
    srcDir: 'src',
  },
  server: { url: 'http://localhost:4200' },
  consoleMonitor: {
    categorizeFrameworkWarnings: true // Catches ExpressionChangedAfterItHasBeenCheckedError
  }
};
```

---

## 🛠️ CLI Commands

| Command | Description |
| :--- | :--- |
| `npx web-quality run` | Executes all 5 pillars and generates consolidated scorecard & dashboard |
| `npx web-quality init` | Auto-detects project stack and scaffolds `quality.config.js` |
| `npx web-quality vapt` | Runs SAST security scanning, headers audit, and secret detection |
| `npx web-quality e2e` | Runs automated user journeys and route crawler |
| `npx web-quality console` | Evaluates console health, errors, and framework warnings |
| `npx web-quality deps` | Audits dependencies for CVEs and non-breaking upgrades |
| `npx web-quality ui` | Audits WCAG accessibility, responsiveness, and performance |

---

## 📡 Client Runtime Monitoring SDK

You can also embed the runtime listener directly inside your application frontend to trap errors in staging or QA environments:

```ts
// In your index.tsx / main.ts / App.vue
import { initQualityMonitor } from 'web-quality-framework/client';

initQualityMonitor({
  enableConsoleInterception: true,
  enableErrorListener: true,
  onIssueDetected: (issue) => {
    console.log(`[Quality Monitor] Detected ${issue.category} issue:`, issue.message);
  }
});
```

---

## 📊 Consolidated Quality Reports

Running `npx web-quality run` produces:
1. **Interactive HTML Dashboard** (`./quality-reports/quality-report.html`):
   - Standalone, zero-CDN, responsive dark-mode dashboard.
   - Filterable tabs for VAPT, E2E, Console, Dependencies, and Frontend Quality.
   - Expandable code snippets and remediation instructions.
2. **Machine-Readable JSON** (`./quality-reports/quality-report.json`):
   - Full programmatic data structure for dashboards, Datadog, or Elasticsearch.
3. **JUnit XML** (`./quality-reports/quality-report.junit.xml`):
   - Standard JUnit test results consumed directly by GitHub Actions, GitLab CI, and Jenkins.

---

## 🔄 CI/CD Quality Gate Integration

Drop this GitHub Actions workflow into `.github/workflows/quality.yml`:

```yaml
name: Web Quality Gate

on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx web-quality run
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: quality-reports
          path: quality-reports/
```

If the project fails the configured quality gate (e.g. Critical VAPT issues > 0 or score < 80), the CLI exits with code `1`, preventing flawed code from merging.

