import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
export class DependencyAuditor {
    projectRoot;
    packageManager;
    constructor(projectRoot = process.cwd(), pm = 'auto') {
        this.projectRoot = projectRoot;
        this.packageManager = pm === 'auto' ? this.detectPackageManager(projectRoot) : pm;
    }
    detectPackageManager(root) {
        if (fs.existsSync(path.join(root, 'pnpm-lock.yaml')))
            return 'pnpm';
        if (fs.existsSync(path.join(root, 'yarn.lock')))
            return 'yarn';
        return 'npm';
    }
    getPackageManager() {
        return this.packageManager;
    }
    runAudit() {
        const vulnerabilities = [];
        const pkgJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(pkgJsonPath))
            return vulnerabilities;
        let directDeps = new Set();
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
            Object.keys(pkg.dependencies || {}).forEach(d => directDeps.add(d));
            Object.keys(pkg.devDependencies || {}).forEach(d => directDeps.add(d));
        }
        catch { }
        try {
            // npm audit --json
            const output = execSync('npm audit --json', {
                cwd: this.projectRoot,
                stdio: ['ignore', 'pipe', 'pipe'],
                encoding: 'utf-8',
                timeout: 25000,
            });
            const parsed = JSON.parse(output);
            this.parseNpmAudit(parsed, directDeps, vulnerabilities);
        }
        catch (err) {
            // npm audit exits with non-zero exit code if vulnerabilities are found!
            if (err.stdout) {
                try {
                    const parsed = JSON.parse(err.stdout);
                    this.parseNpmAudit(parsed, directDeps, vulnerabilities);
                }
                catch {
                    // stdout was not valid JSON
                }
            }
        }
        return vulnerabilities;
    }
    parseNpmAudit(parsed, directDeps, results) {
        if (parsed.vulnerabilities) {
            for (const [pkgName, details] of Object.entries(parsed.vulnerabilities)) {
                const severity = this.mapSeverity(details.severity);
                const viaList = Array.isArray(details.via) ? details.via : [];
                const firstVia = viaList.find((v) => typeof v === 'object') || {};
                results.push({
                    id: firstVia.source ? `GHSA-${firstVia.source}` : `VULN-${pkgName}`,
                    packageName: pkgName,
                    installedVersion: details.range || 'unknown',
                    severity,
                    title: firstVia.title || `${severity.toUpperCase()} vulnerability in ${pkgName}`,
                    cve: firstVia.cve || undefined,
                    url: firstVia.url || undefined,
                    vulnerableVersions: details.range,
                    patchedVersions: details.fixAvailable ? (typeof details.fixAvailable === 'object' ? details.fixAvailable.version : 'Available') : undefined,
                    recommendation: details.fixAvailable
                        ? `Update ${pkgName} to a safe version via 'npm audit fix'`
                        : `Review upstream dependency chain for ${pkgName}`,
                    isDirect: directDeps.has(pkgName),
                });
            }
        }
    }
    checkOutdated() {
        const outdatedList = [];
        const pkgJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(pkgJsonPath))
            return outdatedList;
        try {
            const output = execSync('npm outdated --json', {
                cwd: this.projectRoot,
                stdio: ['ignore', 'pipe', 'pipe'],
                encoding: 'utf-8',
                timeout: 20000,
            });
            const parsed = JSON.parse(output);
            this.parseNpmOutdated(parsed, outdatedList);
        }
        catch (err) {
            if (err.stdout) {
                try {
                    const parsed = JSON.parse(err.stdout);
                    this.parseNpmOutdated(parsed, outdatedList);
                }
                catch { }
            }
        }
        return outdatedList;
    }
    parseNpmOutdated(parsed, results) {
        for (const [pkgName, info] of Object.entries(parsed)) {
            const current = info.current || '';
            const wanted = info.wanted || '';
            const latest = info.latest || '';
            const updateType = this.determineUpdateType(current, wanted, latest);
            // Safe to update if current != wanted (minor/patch safe upgrade without major breaking change)
            const isSafeToUpdate = updateType === 'patch' || (updateType === 'minor' && current !== wanted);
            results.push({
                packageName: pkgName,
                current,
                wanted,
                latest,
                updateType,
                isSafeToUpdate,
            });
        }
    }
    determineUpdateType(current, wanted, latest) {
        const parseMajor = (v) => parseInt(v.replace(/^[^\d]*/, '').split('.')[0] || '0', 10);
        const parseMinor = (v) => parseInt(v.replace(/^[^\d]*/, '').split('.')[1] || '0', 10);
        const currMajor = parseMajor(current);
        const lateMajor = parseMajor(latest);
        if (lateMajor > currMajor)
            return 'major';
        const currMinor = parseMinor(current);
        const lateMinor = parseMinor(latest);
        if (lateMinor > currMinor)
            return 'minor';
        return 'patch';
    }
    mapSeverity(raw) {
        const lower = (raw || '').toLowerCase();
        if (lower === 'critical')
            return 'critical';
        if (lower === 'high')
            return 'high';
        if (lower === 'moderate' || lower === 'medium')
            return 'medium';
        if (lower === 'low')
            return 'low';
        return 'info';
    }
}
//# sourceMappingURL=auditor.js.map