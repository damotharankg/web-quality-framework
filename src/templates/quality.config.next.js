/**
 * Quality Configuration for Next.js Applications (App Router & Pages Router)
 */
export default {
  project: {
    name: 'Next.js Application',
    framework: 'nextjs',
    rootDir: '.',
    srcDir: '.', // Next.js often uses app/ or pages/ in root or src/
  },
  server: {
    url: 'http://localhost:3000',
    startCommand: 'npm run dev',
  },
  vapt: {
    enabled: true,
    sast: {
      enabled: true,
      excludePatterns: ['**/.next/**', '**/out/**'],
      scanDangerousSinks: true,
      scanSecrets: true,
    },
    headers: {
      enabled: true,
      enforceCSP: true,
      enforceHSTS: true,
    },
  },
  e2e: {
    enabled: true,
    autoCrawl: {
      enabled: true,
      maxDepth: 3,
      maxPages: 20,
      ignorePatterns: ['/_next/**', '/api/**'],
    },
    journeys: [
      {
        name: 'SSR/SSG Route Hydration Test',
        startUrl: '/',
        actions: [
          { type: 'assertVisible', selector: 'main', description: 'Next.js page hydrated' },
        ],
      },
    ],
  },
  consoleMonitor: {
    enabled: true,
    failOnError: true,
    categorizeFrameworkWarnings: true,
    ignorePatterns: ['Fast Refresh'],
  },
  dependencyAudit: {
    enabled: true,
    failOnSeverity: 'critical',
    checkOutdated: true,
  },
  frontendQuality: {
    enabled: true,
    accessibility: { enabled: true, level: 'WCAG2AA' },
    performance: {
      enabled: true,
      maxFcpMs: 1800,
      maxLcpMs: 2500,
    },
  },
  reporting: {
    outputDir: './quality-reports',
    formats: ['html', 'json', 'console'],
    minOverallScore: 85,
    failPipelineOnQualityGate: true,
  },
};

