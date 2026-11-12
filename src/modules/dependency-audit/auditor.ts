import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { DependencyVulnerability, OutdatedPackage, SeverityLevel } from '../../config/types.js';

export class DependencyAuditor {
  private projectRoot: string;
  private packageManager: string;

  constructor(projectRoot: string = process.cwd(), pm: string = 'auto') {
    this.projectRoot = projectRoot;
    this.packageManager = pm === 'auto' ? this.detectPackageManager(projectRoot) : pm;
  }

  private detectPackageManager(root: string): string {
    if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn';
    return 'npm';
  }

  public getPackageManager(): string {
    return this.packageManager;
  }

  public runAudit(): DependencyVulnerability[] {
    const vulnerabilities: DependencyVulnerability[] = [];
    const pkgJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) return vulnerabilities;

    let directDeps: Set<string> = new Set();
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
      Object.keys(pkg.dependencies || {}).forEach(d => directDeps.add(d));
      Object.keys(pkg.devDependencies || {}).forEach(d => directDeps.add(d));
    } catch {}

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
    } catch (err: any) {
      // npm audit exits with non-zero exit code if vulnerabilities are found!
      if (err.stdout) {
        try {
          const parsed = JSON.parse(err.stdout);
          this.parseNpmAudit(parsed, directDeps, vulnerabilities);
        } catch {
          // stdout was not valid JSON
        }
      }
    }

    return vulnerabilities;
  }

  private parseNpmAudit(
    parsed: any,
    directDeps: Set<string>,
    results: DependencyVulnerability[]
  ) {
    if (parsed.vulnerabilities) {
      for (const [pkgName, details] of Object.entries<any>(parsed.vulnerabilities)) {
        const severity = this.mapSeverity(details.severity);
        const viaList = Array.isArray(details.via) ? details.via : [];
        const firstVia = viaList.find((v: any) => typeof v === 'object') || {};

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

  public checkOutdated(): OutdatedPackage[] {
    const outdatedList: OutdatedPackage[] = [];
    const pkgJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) return outdatedList;

    try {
      const output = execSync('npm outdated --json', {
        cwd: this.projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf-8',
        timeout: 20000,
      });
      const parsed = JSON.parse(output);
      this.parseNpmOutdated(parsed, outdatedList);
    } catch (err: any) {
      if (err.stdout) {
        try {
          const parsed = JSON.parse(err.stdout);
          this.parseNpmOutdated(parsed, outdatedList);
        } catch {}
      }
    }

    return outdatedList;
  }

  private parseNpmOutdated(parsed: any, results: OutdatedPackage[]) {
    for (const [pkgName, info] of Object.entries<any>(parsed)) {
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

  private determineUpdateType(current: string, wanted: string, latest: string): 'patch' | 'minor' | 'major' {
    const parseMajor = (v: string) => parseInt(v.replace(/^[^\d]*/, '').split('.')[0] || '0', 10);
    const parseMinor = (v: string) => parseInt(v.replace(/^[^\d]*/, '').split('.')[1] || '0', 10);

    const currMajor = parseMajor(current);
    const lateMajor = parseMajor(latest);

    if (lateMajor > currMajor) return 'major';

    const currMinor = parseMinor(current);
    const lateMinor = parseMinor(latest);

    if (lateMinor > currMinor) return 'minor';

    return 'patch';
  }

  private mapSeverity(raw: string): SeverityLevel {
    const lower = (raw || '').toLowerCase();
    if (lower === 'critical') return 'critical';
    if (lower === 'high') return 'high';
    if (lower === 'moderate' || lower === 'medium') return 'medium';
    if (lower === 'low') return 'low';
    return 'info';
  }
}

