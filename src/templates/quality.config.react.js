/**
 * Quality Configuration for React Applications (Vite / CRA)
 */
export default {
  project: {
    name: 'React Application',
    framework: 'react',
    rootDir: '.',
    srcDir: 'src',
  },
  server: {
    url: 'http://localhost:5173', // Vite default port or 3000 for CRA
    startCommand: 'npm run dev',
  },
  vapt: {
    enabled: true,
    sast: {
      enabled: true,
      scanDangerousSinks: true, // Detects dangerouslySetInnerHTML, eval, etc.
      scanSecrets: true,
    },
    headers: {
      enabled: true,
      enforceCSP: true,
      enforceXFrame: true,
    },
    thresholds: {
      failOnCritical: true,
      maxCriticalCount: 0,
      maxHighCount: 2,
    },
  },
  e2e: {
    enabled: true,
    baseUrl: 'http://localhost:5173',
    journeys: [
      {
        name: 'React App Smoke Test',
        startUrl: '/',
        actions: [
          { type: 'assertVisible', selector: '#root', description: 'React root mounted' },
        ],
      },
    ],
  },
  consoleMonitor: {
    enabled: true,
    failOnError: true,
    failOnWarning: false,
    categorizeFrameworkWarnings: true, // Specifically identifies React missing key props, unmounted state updates, and hook dependency issues
    ignorePatterns: ['Download the React DevTools'],
  },
  dependencyAudit: {
    enabled: true,
    failOnSeverity: 'critical',
    checkOutdated: true,
  },
  frontendQuality: {
    enabled: true,
    accessibility: {
      enabled: true,
      level: 'WCAG2AA',
      checkAltTags: true,
      checkFormLabels: true,
    },
  },
  reporting: {
    outputDir: './quality-reports',
    formats: ['html', 'json', 'console'],
    minOverallScore: 80,
  },
};

