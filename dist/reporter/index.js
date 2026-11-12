import fs from 'node:fs';
import path from 'node:path';
import { HtmlReportGenerator } from './html-generator.js';
export class ReporterModule {
    static saveReports(report, outputDir, formats) {
        const absOutputDir = path.resolve(outputDir);
        if (!fs.existsSync(absOutputDir)) {
            fs.mkdirSync(absOutputDir, { recursive: true });
        }
        const paths = {};
        // 1. JSON Report
        if (formats.includes('json')) {
            const jsonFile = path.join(absOutputDir, 'quality-report.json');
            fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2), 'utf-8');
            paths.jsonPath = jsonFile;
        }
        // 2. HTML Report
        if (formats.includes('html')) {
            const htmlContent = HtmlReportGenerator.generate(report);
            const htmlFile = path.join(absOutputDir, 'quality-report.html');
            fs.writeFileSync(htmlFile, htmlContent, 'utf-8');
            paths.htmlPath = htmlFile;
        }
        // 3. JUnit XML (for Jenkins/GitLab/GitHub Actions test tabs)
        if (formats.includes('junit')) {
            const junitXml = this.generateJunitXml(report);
            const junitFile = path.join(absOutputDir, 'quality-report.junit.xml');
            fs.writeFileSync(junitFile, junitXml, 'utf-8');
            paths.junitPath = junitFile;
        }
        return paths;
    }
    static printConsoleSummary(report) {
        const { summary, vaptResults, e2eResults, consoleResults, dependencyResults, frontendQualityResults } = report;
        console.log('\n================================================================');
        console.log(` 🛡️  WEB APPLICATION QUALITY FRAMEWORK - SCORECARD`);
        console.log('================================================================');
        console.log(` Project:       ${report.config.project.name}`);
        console.log(` Framework:     ${summary.frameworkDetected.toUpperCase()}`);
        console.log(` Overall Score: ${summary.overallScore}/100 [GRADE ${summary.grade}]`);
        console.log(` Quality Gate:  ${summary.passed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log('----------------------------------------------------------------');
        console.log(` 1. VAPT & Security:       ${vaptResults.score}/100 (${vaptResults.findings.length} findings, ${summary.issueCounts.critical} critical)`);
        console.log(` 2. E2E Journeys:          ${e2eResults.score}/100 (${e2eResults.passedJourneys}/${e2eResults.totalJourneys} passed)`);
        console.log(` 3. Console Cleanup:       ${consoleResults.score}/100 (${consoleResults.totalErrors} errors, ${consoleResults.totalWarnings} warnings)`);
        console.log(` 4. Package Audit:         ${dependencyResults.vulnerabilities.length} CVEs, ${dependencyResults.outdatedPackages.length} outdated`);
        console.log(` 5. Frontend Quality:      ${frontendQualityResults.score}/100 (${frontendQualityResults.accessibilityIssues.length} a11y issues)`);
        console.log('================================================================');
    }
    static generateJunitXml(report) {
        const totalTests = report.vaptResults.findings.length +
            report.e2eResults.totalJourneys +
            report.consoleResults.messages.length +
            report.frontendQualityResults.accessibilityIssues.length;
        const failures = report.summary.issueCounts.critical +
            report.summary.issueCounts.high +
            report.e2eResults.failedJourneys;
        return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Web Quality Framework" tests="${totalTests}" failures="${failures}" time="${(report.summary.executionTimeMs / 1000).toFixed(2)}">
  <testsuite name="VAPT Security" tests="${report.vaptResults.findings.length}" failures="${report.summary.issueCounts.critical + report.summary.issueCounts.high}">
    ${report.vaptResults.findings.map(f => `
      <testcase classname="VAPT" name="${f.id}: ${f.name.replace(/"/g, '&quot;')}">
        ${f.severity === 'critical' || f.severity === 'high' ? `<failure message="${f.description.replace(/"/g, '&quot;')}">${f.remediation.replace(/"/g, '&quot;')}</failure>` : ''}
      </testcase>
    `).join('')}
  </testsuite>
  <testsuite name="E2E Automation" tests="${report.e2eResults.totalJourneys}" failures="${report.e2eResults.failedJourneys}">
    ${report.e2eResults.results.map(r => `
      <testcase classname="E2E" name="${r.name.replace(/"/g, '&quot;')}" time="${(r.durationMs / 1000).toFixed(2)}">
        ${!r.success ? `<failure message="Journey failed">${r.failedStep?.error || 'Unknown failure'}</failure>` : ''}
      </testcase>
    `).join('')}
  </testsuite>
</testsuites>`;
    }
}
//# sourceMappingURL=index.js.map