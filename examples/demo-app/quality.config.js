/**
 * Web Quality Configuration for Demo App
 */
export default {
  project: {
    name: 'Enterprise Demo Portal',
    framework: 'react',
    rootDir: '.',
    srcDir: 'src',
  },
  server: {
    url: 'http://localhost:3456',
  },
  vapt: {
    enabled: true,
    sast: { enabled: true, scanDangerousSinks: true, scanSecrets: true },
    headers: { enabled: true, targetUrl: 'http://localhost:3456' },
    thresholds: { failOnCritical: false, maxCriticalCount: 0 }
  },
  e2e: {
    enabled: true,
    baseUrl: 'http://localhost:3456',
    autoCrawl: { enabled: true, maxDepth: 2, maxPages: 8 },
    journeys: [
      {
        name: 'Contact Form Flow',
        startUrl: '/',
        actions: [
          { type: 'assertVisible', selector: '#contact-form' },
          { type: 'assertVisible', selector: '#user-email' },
          { type: 'assertVisible', selector: '#submit-btn' },
          { type: 'assertText', selector: 'h1', value: 'Welcome to Enterprise Portal Demo' }
        ]
      },
      {
        name: 'Navigation Integrity Flow',
        startUrl: '/products',
        actions: [
          { type: 'assertText', selector: 'h1', value: 'Products Catalog' }
        ]
      }
    ]
  },
  consoleMonitor: {
    enabled: true,
    failOnError: false,
    categorizeFrameworkWarnings: true,
  },
  dependencyAudit: {
    enabled: true,
    checkOutdated: true,
    failOnSeverity: 'none',
  },
  frontendQuality: {
    enabled: true,
    accessibility: { enabled: true, level: 'WCAG2AA' }
  },
  reporting: {
    outputDir: './quality-reports',
    formats: ['html', 'json', 'console'],
    minOverallScore: 75,
    failPipelineOnQualityGate: false
  }
};

