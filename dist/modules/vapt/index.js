import path from 'node:path';
import { SASTScanner } from './sast-scanner.js';
import { HeaderAuditor } from './header-auditor.js';
import { DynamicVaptScanner } from './dynamic-vapt.js';
export class VaptModule {
    config;
    sastScanner;
    headerAuditor;
    dynamicScanner;
    constructor(config) {
        this.config = config;
        this.sastScanner = new SASTScanner([], config.vapt.sast.excludePatterns);
        this.headerAuditor = new HeaderAuditor();
        this.dynamicScanner = new DynamicVaptScanner();
    }
    async run() {
        const findings = [];
        let headersAudit = {};
        // 1. Static Application Security Testing (SAST)
        if (this.config.vapt.sast.enabled) {
            const targetDir = path.resolve(this.config.project.rootDir, this.config.project.srcDir);
            const sastFindings = this.sastScanner.scanDirectory(targetDir);
            findings.push(...sastFindings);
        }
        // 2. Security Headers Audit
        if (this.config.vapt.headers.enabled && this.config.server?.url) {
            const headerTarget = this.config.vapt.headers.targetUrl || this.config.server.url;
            const { auditResults, vulnerabilities } = await this.headerAuditor.auditUrl(headerTarget);
            headersAudit = auditResults;
            findings.push(...vulnerabilities);
        }
        // Count findings by severity
        const summary = {
            critical: findings.filter(f => f.severity === 'critical').length,
            high: findings.filter(f => f.severity === 'high').length,
            medium: findings.filter(f => f.severity === 'medium').length,
            low: findings.filter(f => f.severity === 'low').length,
        };
        // Score calculation: Base 100
        // Critical: -25, High: -15, Medium: -5, Low: -2
        let deduction = (summary.critical * 25) + (summary.high * 15) + (summary.medium * 5) + (summary.low * 2);
        const score = Math.max(0, 100 - deduction);
        // Threshold checks
        const passed = summary.critical <= this.config.vapt.thresholds.maxCriticalCount &&
            (!this.config.vapt.thresholds.failOnHigh || summary.high <= this.config.vapt.thresholds.maxHighCount);
        return {
            score,
            passed,
            findings,
            headersAudit,
            summary,
        };
    }
    getDynamicScanner() {
        return this.dynamicScanner;
    }
}
//# sourceMappingURL=index.js.map