import fs from 'node:fs';
import path from 'node:path';
import { DependencyAuditor } from './auditor.js';
import { DependencyUpdater } from './updater.js';
export class DependencyAuditModule {
    config;
    auditor;
    constructor(config) {
        this.config = config;
        this.auditor = new DependencyAuditor(config.project.rootDir, config.dependencyAudit.packageManager);
    }
    run() {
        const pkgJsonPath = path.join(this.config.project.rootDir, 'package.json');
        let totalDependencies = 0;
        if (fs.existsSync(pkgJsonPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
                totalDependencies = Object.keys(pkg.dependencies || {}).length + Object.keys(pkg.devDependencies || {}).length;
            }
            catch { }
        }
        const vulnerabilities = this.auditor.runAudit();
        const outdatedPackages = this.config.dependencyAudit.checkOutdated
            ? this.auditor.checkOutdated()
            : [];
        const summary = {
            critical: vulnerabilities.filter(v => v.severity === 'critical').length,
            high: vulnerabilities.filter(v => v.severity === 'high').length,
            medium: vulnerabilities.filter(v => v.severity === 'medium').length,
            low: vulnerabilities.filter(v => v.severity === 'low').length,
            outdated: outdatedPackages.length,
            safeUpdatesCount: outdatedPackages.filter(p => p.isSafeToUpdate).length,
        };
        const packageManager = this.auditor.getPackageManager();
        const remediationPlan = DependencyUpdater.generatePlan(packageManager, vulnerabilities, outdatedPackages);
        // Scoring: Base 100
        // Critical: -25, High: -15, Medium: -5, Low: -2, Outdated: -1 each (capped at -15)
        const vulnPenalty = (summary.critical * 25) + (summary.high * 15) + (summary.medium * 5) + (summary.low * 2);
        const outdatedPenalty = Math.min(15, summary.outdated * 1);
        const score = Math.max(0, 100 - vulnPenalty - outdatedPenalty);
        // Fail check
        const failOn = this.config.dependencyAudit.failOnSeverity;
        let passed = true;
        if (failOn === 'critical' && summary.critical > 0)
            passed = false;
        else if (failOn === 'high' && (summary.critical > 0 || summary.high > 0))
            passed = false;
        else if (failOn === 'medium' && (summary.critical > 0 || summary.high > 0 || summary.medium > 0))
            passed = false;
        return {
            score,
            passed,
            auditResult: {
                totalDependencies,
                vulnerabilities,
                outdatedPackages,
                summary,
                packageManager,
            },
            remediationPlan,
        };
    }
}
//# sourceMappingURL=index.js.map