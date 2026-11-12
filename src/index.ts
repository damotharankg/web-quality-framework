import { QualityConfig, ConsolidatedQualityReport, FrontendFramework } from './config/types.js';
import { loadConfig, getDefaultConfig } from './config/defaults.js';
import { VaptModule } from './modules/vapt/index.js';
import { E2EModule } from './modules/e2e/index.js';
import { ConsoleMonitorModule } from './modules/console-monitor/index.js';
import { DependencyAuditModule } from './modules/dependency-audit/index.js';
import { FrontendQualityModule } from './modules/frontend-quality/index.js';
import { ScoreCalculator } from './reporter/score-calculator.js';
import { ReporterModule } from './reporter/index.js';

export * from './config/types.js';
export { loadConfig, getDefaultConfig };
export { VaptModule, E2EModule, ConsoleMonitorModule, DependencyAuditModule, FrontendQualityModule, ReporterModule };

export class QualityRunner {
  private config: QualityConfig;

  constructor(config: QualityConfig) {
    this.config = config;
  }

  public async runAll(): Promise<ConsolidatedQualityReport> {
    const startTime = Date.now();
    console.log(`\n🚀 Starting Web Application Quality Suite for: ${this.config.project.name} (${this.config.project.framework.toUpperCase()})`);

    // 1. Run VAPT & Security
    console.log('  🔍 [1/5] Executing VAPT & Security Assessment...');
    const vaptModule = new VaptModule(this.config);
    const vaptResults = await vaptModule.run();

    // 2. Run E2E Automation & Crawler
    console.log('  🎭 [2/5] Running E2E Automation Workflows & Route Crawler...');
    const e2eModule = new E2EModule(this.config);
    const e2eResults = await e2eModule.run();

    // 3. Browser Console Cleanup & Monitoring
    console.log('  🖥️  [3/5] Inspecting Browser Console Health & Framework Warnings...');
    const consoleModule = new ConsoleMonitorModule(this.config);
    if (e2eResults.capturedConsoleErrors.length > 0) {
      consoleModule.addMessages(e2eResults.capturedConsoleErrors);
    }
    const consoleResults = consoleModule.evaluate();

    // 4. Package and Dependency Audit
    console.log('  📦 [4/5] Auditing Dependencies & Evaluating Safe Upgrades...');
    const depModule = new DependencyAuditModule(this.config);
    const depResults = depModule.run();

    // 5. Frontend Quality (A11y, Performance, Responsiveness)
    console.log('  🎨 [5/5] Checking Frontend Quality, A11y (WCAG 2.1), & Viewports...');
    const feQualityModule = new FrontendQualityModule(this.config);
    const feQualityResults = await feQualityModule.evaluate([]);

    // Calculate Unified Score & Summary
    const issueCounts = {
      critical: vaptResults.summary.critical + depResults.auditResult.summary.critical,
      high: vaptResults.summary.high + depResults.auditResult.summary.high + consoleResults.summary.high,
      medium: vaptResults.summary.medium + depResults.auditResult.summary.medium + consoleResults.summary.medium,
      low: vaptResults.summary.low + depResults.auditResult.summary.low + consoleResults.summary.low,
    };

    const summary = ScoreCalculator.calculate(
      {
        vapt: vaptResults.score,
        e2e: e2eResults.score,
        console: consoleResults.score,
        dependencies: depResults.score,
        frontendQuality: feQualityResults.score,
      },
      issueCounts,
      this.config.project.framework,
      this.config.reporting.minOverallScore,
      startTime
    );

    const fullReport: ConsolidatedQualityReport = {
      summary,
      config: this.config,
      vaptResults: {
        score: vaptResults.score,
        findings: vaptResults.findings,
        headersAudit: vaptResults.headersAudit,
      },
      e2eResults: {
        score: e2eResults.score,
        totalJourneys: e2eResults.totalJourneys,
        passedJourneys: e2eResults.passedJourneys,
        failedJourneys: e2eResults.failedJourneys,
        results: e2eResults.results,
      },
      consoleResults: {
        score: consoleResults.score,
        totalErrors: consoleResults.totalErrors,
        totalWarnings: consoleResults.totalWarnings,
        messages: consoleResults.messages,
      },
      dependencyResults: depResults.auditResult,
      frontendQualityResults: {
        score: feQualityResults.score,
        accessibilityIssues: feQualityResults.accessibilityIssues,
        performanceMetrics: feQualityResults.performanceMetrics,
        responsiveIssues: feQualityResults.responsiveIssues,
        brokenAssets: feQualityResults.brokenAssets,
      },
    };

    // Output Reports
    const saved = ReporterModule.saveReports(
      fullReport,
      this.config.reporting.outputDir,
      this.config.reporting.formats
    );

    if (this.config.reporting.formats.includes('console')) {
      ReporterModule.printConsoleSummary(fullReport);
    }

    if (saved.htmlPath) {
      console.log(`\n📊 Interactive HTML Dashboard generated: file://${saved.htmlPath}`);
    }
    if (saved.jsonPath) {
      console.log(`📄 Machine-readable JSON Report: file://${saved.jsonPath}`);
    }

    return fullReport;
  }
}

export async function runQualitySuite(overrides: Partial<QualityConfig> = {}, configPath?: string): Promise<ConsolidatedQualityReport> {
  const config = await loadConfig(configPath, process.cwd());
  const mergedConfig: QualityConfig = {
    ...config,
    ...overrides,
    project: { ...config.project, ...overrides.project },
    vapt: { ...config.vapt, ...overrides.vapt },
    e2e: { ...config.e2e, ...overrides.e2e },
    consoleMonitor: { ...config.consoleMonitor, ...overrides.consoleMonitor },
    dependencyAudit: { ...config.dependencyAudit, ...overrides.dependencyAudit },
    frontendQuality: { ...config.frontendQuality, ...overrides.frontendQuality },
    reporting: { ...config.reporting, ...overrides.reporting },
  };

  const runner = new QualityRunner(mergedConfig);
  return runner.runAll();
}

