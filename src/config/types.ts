export type FrontendFramework = 'react' | 'angular' | 'vue' | 'nextjs' | 'vanilla' | 'auto';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface VaptRuleResult {
  id: string;
  name: string;
  category: 'SAST' | 'HEADERS' | 'DYNAMIC_DOM' | 'SECRETS' | 'TRANSPORT';
  severity: SeverityLevel;
  description: string;
  filePath?: string;
  lineNumber?: number;
  snippet?: string;
  remediation: string;
  cwe?: string;
}

export interface VaptConfig {
  enabled: boolean;
  sast: {
    enabled: boolean;
    includePatterns: string[];
    excludePatterns: string[];
    scanSecrets: boolean;
    scanDangerousSinks: boolean;
    customRules?: Array<{
      id: string;
      name: string;
      pattern: string;
      severity: SeverityLevel;
      description: string;
      remediation: string;
    }>;
  };
  headers: {
    enabled: boolean;
    targetUrl?: string;
    enforceCSP: boolean;
    enforceHSTS: boolean;
    enforceXFrame: boolean;
    enforceContentTypeOptions: boolean;
    enforceReferrerPolicy: boolean;
    enforcePermissionsPolicy: boolean;
    checkCors: boolean;
  };
  dynamic: {
    enabled: boolean;
    checkStorageSecrets: boolean;
    checkGlobalWindowLeaks: boolean;
    checkMixedContent: boolean;
    checkDomXssSinks: boolean;
  };
  thresholds: {
    failOnCritical: boolean;
    failOnHigh: boolean;
    maxCriticalCount: number;
    maxHighCount: number;
  };
}

export interface E2EViewport {
  name: string;
  width: number;
  height: number;
  isMobile?: boolean;
}

export interface E2EAction {
  type: 'navigate' | 'click' | 'fill' | 'assertText' | 'assertVisible' | 'screenshot' | 'wait';
  selector?: string;
  value?: string;
  timeout?: number;
  description?: string;
}

export interface E2EJourney {
  name: string;
  description?: string;
  startUrl: string;
  actions: E2EAction[];
  tags?: string[];
}

export interface E2EJourneyResult {
  name: string;
  success: boolean;
  durationMs: number;
  stepsPassed: number;
  stepsTotal: number;
  failedStep?: {
    action: E2EAction;
    error: string;
  };
  screenshotPath?: string;
  viewport: string;
}

export interface E2EConfig {
  enabled: boolean;
  baseUrl: string;
  headless: boolean;
  timeout: number;
  viewports: E2EViewport[];
  journeys: E2EJourney[];
  autoCrawl: {
    enabled: boolean;
    maxDepth: number;
    maxPages: number;
    routes: string[];
    ignorePatterns: string[];
  };
  screenshotOnFailure: boolean;
}

export interface ConsoleMessageItem {
  id: string;
  type: 'error' | 'warn' | 'info' | 'log';
  category: 'react' | 'vue' | 'angular' | 'network' | 'runtime' | 'deprecation' | 'unhandled';
  severity: SeverityLevel;
  message: string;
  sourceUrl?: string;
  lineNumber?: number;
  columnNumber?: number;
  stack?: string;
  remediation: string;
  occurrences: number;
  frameworkNote?: string;
}

export interface ConsoleMonitorConfig {
  enabled: boolean;
  failOnError: boolean;
  failOnWarning: boolean;
  maxErrorsAllowed: number;
  maxWarningsAllowed: number;
  ignorePatterns: string[];
  categorizeFrameworkWarnings: boolean;
}

export interface DependencyVulnerability {
  id: string;
  packageName: string;
  installedVersion: string;
  severity: SeverityLevel;
  title: string;
  cve?: string;
  url?: string;
  vulnerableVersions?: string;
  patchedVersions?: string;
  recommendation: string;
  isDirect: boolean;
}

export interface OutdatedPackage {
  packageName: string;
  current: string;
  wanted: string;
  latest: string;
  updateType: 'patch' | 'minor' | 'major';
  isSafeToUpdate: boolean;
}

export interface DependencyAuditResult {
  totalDependencies: number;
  vulnerabilities: DependencyVulnerability[];
  outdatedPackages: OutdatedPackage[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    outdated: number;
    safeUpdatesCount: number;
  };
  packageManager: string;
}

export interface DependencyAuditConfig {
  enabled: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'auto';
  failOnSeverity: SeverityLevel | 'none';
  checkOutdated: boolean;
  autoFixSafe: boolean;
}

export interface AccessibilityIssue {
  id: string;
  rule: string;
  severity: SeverityLevel;
  description: string;
  elementHtml?: string;
  selector?: string;
  remediation: string;
  wcagTags: string[];
}

export interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  cls?: number;
  ttfb?: number;
  domNodesCount?: number;
  resourceCount?: number;
  totalResourceSizeBytes?: number;
}

export interface ResponsiveIssue {
  viewport: string;
  issueType: 'horizontal-overflow' | 'broken-image' | 'unresponsive-element';
  selector?: string;
  description: string;
  remediation: string;
}

export interface FrontendQualityConfig {
  enabled: boolean;
  accessibility: {
    enabled: boolean;
    level: 'WCAG2A' | 'WCAG2AA' | 'WCAG2AAA';
    checkAltTags: boolean;
    checkFormLabels: boolean;
    checkHeadingOrder: boolean;
    checkColorContrast: boolean;
    checkAriaRoles: boolean;
  };
  performance: {
    enabled: boolean;
    maxFcpMs: number;
    maxLcpMs: number;
    maxCls: number;
    maxDomNodes: number;
  };
  responsiveness: {
    enabled: boolean;
    checkHorizontalOverflow: boolean;
    viewports: E2EViewport[];
  };
  brokenAssets: {
    enabled: boolean;
    checkImages: boolean;
    checkLinks: boolean;
  };
}

export interface QualityReportSummary {
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  passed: boolean;
  executionTimeMs: number;
  timestamp: string;
  frameworkDetected: FrontendFramework;
  scores: {
    vapt: number;
    e2e: number;
    console: number;
    dependencies: number;
    frontendQuality: number;
  };
  issueCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ConsolidatedQualityReport {
  summary: QualityReportSummary;
  config: QualityConfig;
  vaptResults: {
    score: number;
    findings: VaptRuleResult[];
    headersAudit: Record<string, { status: 'pass' | 'fail' | 'warn'; value?: string; message: string; remediation?: string }>;
  };
  e2eResults: {
    score: number;
    totalJourneys: number;
    passedJourneys: number;
    failedJourneys: number;
    results: E2EJourneyResult[];
  };
  consoleResults: {
    score: number;
    totalErrors: number;
    totalWarnings: number;
    messages: ConsoleMessageItem[];
  };
  dependencyResults: DependencyAuditResult;
  frontendQualityResults: {
    score: number;
    accessibilityIssues: AccessibilityIssue[];
    performanceMetrics: PerformanceMetrics;
    responsiveIssues: ResponsiveIssue[];
    brokenAssets: Array<{ type: 'link' | 'image'; url: string; status: number; parentPage: string }>;
  };
}

export interface QualityConfig {
  project: {
    name: string;
    framework: FrontendFramework;
    rootDir: string;
    srcDir: string;
    distDir?: string;
  };
  server?: {
    url: string;
    startCommand?: string;
    readyTimeout?: number;
  };
  vapt: VaptConfig;
  e2e: E2EConfig;
  consoleMonitor: ConsoleMonitorConfig;
  dependencyAudit: DependencyAuditConfig;
  frontendQuality: FrontendQualityConfig;
  reporting: {
    outputDir: string;
    formats: Array<'html' | 'json' | 'junit' | 'console'>;
    minOverallScore: number;
    failPipelineOnQualityGate: boolean;
    openBrowser: boolean;
  };
}
