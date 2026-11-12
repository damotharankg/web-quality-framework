import fs from 'node:fs';
import path from 'node:path';
import { runQualitySuite, loadConfig, VaptModule, E2EModule, DependencyAuditModule, FrontendQualityModule, ConsoleMonitorModule, ReporterModule } from './index.js';
import { detectFramework } from './config/defaults.js';

export async function runCli(args: string[] = process.argv.slice(2)) {
  const command = args[0] || 'run';

  if (command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'init') {
    handleInit();
    return;
  }

  const cwd = process.cwd();
  const config = await loadConfig(undefined, cwd);

  if (command === 'run') {
    const report = await runQualitySuite();
    if (config.reporting.failPipelineOnQualityGate && !report.summary.passed) {
      process.exit(1);
    }
    return;
  }

  if (command === 'vapt') {
    console.log(`\n🔍 Running VAPT & Security Audit for ${config.project.name}...`);
    const mod = new VaptModule(config);
    const res = await mod.run();
    console.log(`\nVAPT Score: ${res.score}/100 [${res.passed ? 'PASSED' : 'FAILED'}]`);
    console.log(`Total Findings: ${res.findings.length} (Critical: ${res.summary.critical}, High: ${res.summary.high}, Medium: ${res.summary.medium})`);
    for (const f of res.findings) {
      console.log(`  [${f.severity.toUpperCase()}] ${f.id} - ${f.name}`);
      if (f.filePath) console.log(`    File: ${f.filePath}:${f.lineNumber || 1}`);
      console.log(`    Fix:  ${f.remediation}`);
    }
    if (config.vapt.thresholds.failOnCritical && res.summary.critical > 0) {
      process.exit(1);
    }
    return;
  }

  if (command === 'e2e') {
    console.log(`\n🎭 Running E2E Automation Workflows...`);
    const mod = new E2EModule(config);
    const res = await mod.run();
    console.log(`\nE2E Score: ${res.score}/100`);
    console.log(`Passed: ${res.passedJourneys} / Total: ${res.totalJourneys}`);
    for (const j of res.results) {
      console.log(`  ${j.success ? '✅' : '❌'} ${j.name} (${j.viewport}) - ${j.durationMs}ms`);
      if (j.failedStep) {
        console.log(`     Error: ${j.failedStep.error}`);
      }
    }
    return;
  }

  if (command === 'deps') {
    console.log(`\n📦 Auditing Dependencies & Evaluating Safe Updates...`);
    const mod = new DependencyAuditModule(config);
    const res = mod.run();
    console.log(`\nDependency Score: ${res.score}/100`);
    console.log(`Package Manager: ${res.auditResult.packageManager}`);
    console.log(`Vulnerabilities: ${res.auditResult.vulnerabilities.length}`);
    console.log(`Outdated Packages: ${res.auditResult.outdatedPackages.length} (${res.remediationPlan.safeUpdates.length} safe to update)`);
    if (res.remediationPlan.safeUpdateCommand) {
      console.log(`\nRecommended Safe Update Command:\n  $ ${res.remediationPlan.safeUpdateCommand}`);
    }
    return;
  }

  if (command === 'console') {
    console.log(`\n🖥️ Inspecting Browser Console Health & Categorizing Warnings...`);
    const mod = new ConsoleMonitorModule(config);
    const res = mod.evaluate();
    console.log(`\nConsole Health Score: ${res.score}/100`);
    console.log(`Total Errors: ${res.totalErrors} | Warnings: ${res.totalWarnings}`);
    return;
  }

  if (command === 'ui') {
    console.log(`\n🎨 Running Frontend Quality & Accessibility (WCAG) Check...`);
    const mod = new FrontendQualityModule(config);
    const res = await mod.evaluate([]);
    console.log(`\nFrontend Quality Score: ${res.score}/100`);
    console.log(`Accessibility Issues: ${res.accessibilityIssues.length}`);
    for (const a of res.accessibilityIssues) {
      console.log(`  [${a.severity.toUpperCase()}] ${a.rule}: ${a.description}`);
    }
    return;
  }

  console.error(`Unknown command: "${command}". Run "npx web-quality --help" for usage.`);
  process.exit(1);
}

function handleInit() {
  const cwd = process.cwd();
  const framework = detectFramework(cwd);
  const targetConfig = path.join(cwd, 'quality.config.js');

  if (fs.existsSync(targetConfig)) {
    console.log(`⚠️  Config file already exists at ${targetConfig}`);
    return;
  }

  const content = `/**
 * Web Application Quality Framework Configuration
 * Framework Detected: ${framework.toUpperCase()}
 */
export default {
  project: {
    name: '${path.basename(cwd)}',
    framework: '${framework}',
    rootDir: '.',
    srcDir: 'src',
  },
  server: {
    url: 'http://localhost:3000',
  },
  vapt: {
    enabled: true,
    sast: { enabled: true },
    headers: { enabled: true },
    thresholds: { failOnCritical: true, maxCriticalCount: 0 }
  },
  e2e: {
    enabled: true,
    autoCrawl: { enabled: true, maxPages: 10 },
    journeys: [
      {
        name: 'Home Smoke Journey',
        startUrl: '/',
        actions: [
          { type: 'assertVisible', selector: 'body' }
        ]
      }
    ]
  },
  consoleMonitor: {
    enabled: true,
    failOnError: true,
    maxErrorsAllowed: 0
  },
  dependencyAudit: {
    enabled: true,
    failOnSeverity: 'critical',
    checkOutdated: true
  },
  frontendQuality: {
    enabled: true,
    accessibility: { enabled: true, level: 'WCAG2AA' }
  },
  reporting: {
    outputDir: './quality-reports',
    formats: ['html', 'json', 'console'],
    minOverallScore: 80,
    failPipelineOnQualityGate: true
  }
};
`;

  fs.writeFileSync(targetConfig, content, 'utf-8');
  console.log(`✅ Successfully initialized ${targetConfig} for ${framework.toUpperCase()}!`);
  console.log(`\nNext steps:`);
  console.log(`  1. Run the audit:  npx web-quality run`);
  console.log(`  2. View dashboard: open ./quality-reports/quality-report.html`);
}

function printHelp() {
  console.log(`
Web Application Quality Framework (CLI)
=======================================
Usage:
  npx web-quality [command] [options]

Commands:
  run       Execute full 5-pillar suite (VAPT, E2E, Console, Dependencies, Frontend UI)
  init      Generate a tailored quality.config.js for your project
  vapt      Run Vulnerability Assessment & Penetration Testing (SAST, Headers, DAST)
  e2e       Run End-to-End user journeys and route crawler
  console   Monitor and categorize browser console errors and React/Vue/Angular warnings
  deps      Audit dependencies for CVE vulnerabilities and safe non-breaking updates
  ui        Check accessibility (WCAG 2.1), responsive viewports, and performance
  help      Display this help menu

Options:
  --config <path>   Specify custom path to quality.config.js
  --help, -h        Show help
`);
}

