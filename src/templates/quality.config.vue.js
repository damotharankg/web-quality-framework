/**
 * Quality Configuration for Vue.js / Nuxt Applications
 */
export default {
  project: {
    name: 'Vue.js Application',
    framework: 'vue',
    rootDir: '.',
    srcDir: 'src',
  },
  server: {
    url: 'http://localhost:5173',
    startCommand: 'npm run dev',
  },
  vapt: {
    enabled: true,
    sast: {
      enabled: true,
      scanDangerousSinks: true, // Flags unsafe v-html bindings without DOMPurify
    },
    headers: {
      enabled: true,
      enforceCSP: true,
      enforceXFrame: true,
    },
  },
  e2e: {
    enabled: true,
    journeys: [
      {
        name: 'Vue App Root Mount',
        startUrl: '/',
        actions: [
          { type: 'assertVisible', selector: '#app' },
        ],
      },
    ],
  },
  consoleMonitor: {
    enabled: true,
    failOnError: true,
    categorizeFrameworkWarnings: true, // Detects mutating prop directly, duplicate v-for keys
    ignorePatterns: ['You are running Vue in development mode'],
  },
  dependencyAudit: {
    enabled: true,
    failOnSeverity: 'critical',
  },
  frontendQuality: {
    enabled: true,
    accessibility: { enabled: true, level: 'WCAG2AA' },
  },
  reporting: {
    outputDir: './quality-reports',
    formats: ['html', 'json', 'console'],
    minOverallScore: 80,
  },
};

