import { DependencyVulnerability, OutdatedPackage } from '../../config/types.js';
export interface RemediationPlan {
    safeUpdates: OutdatedPackage[];
    majorBreakingUpdates: OutdatedPackage[];
    vulnerabilityFixCommands: string[];
    safeUpdateCommand: string;
    summaryText: string;
}
export declare class DependencyUpdater {
    static generatePlan(packageManager: string, vulnerabilities: DependencyVulnerability[], outdated: OutdatedPackage[]): RemediationPlan;
}
//# sourceMappingURL=updater.d.ts.map