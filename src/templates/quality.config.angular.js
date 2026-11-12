/**
 * Quality Configuration for Angular Applications
 */
export default {
  project: {
    name: 'Angular Application',
    framework: 'angular',
    rootDir: '.',
    srcDir: 'src',
  },
  server: {
    url: 'http://localhost:4200',
    startCommand: 'ng serve',
  },
  vapt: {
    enabled: true,
    sast: {
      enabled: true,
      scanDangerousSinks: true, // Detects bypassSecurityTrustHtml, unescaped innerHTML
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
        name: 'Angular App Root Component Mount',
        startUrl: '/',
        actions: [
          { type: 'assertVisible', selector: 'app-root' },
        ],
      },
    ],
  },
  consoleMonitor: {
    enabled: true,
    failOnError: true,
    categorizeFrameworkWarnings: true, // Flags ExpressionChangedAfterItHasBeenCheckedError, NullInjectorError
    ignorePatterns: ['Angular is running in development mode'],
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

