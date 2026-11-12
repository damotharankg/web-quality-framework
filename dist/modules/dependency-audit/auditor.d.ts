import { DependencyVulnerability, OutdatedPackage } from '../../config/types.js';
export declare class DependencyAuditor {
    private projectRoot;
    private packageManager;
    constructor(projectRoot?: string, pm?: string);
    private detectPackageManager;
    getPackageManager(): string;
    runAudit(): DependencyVulnerability[];
    private parseNpmAudit;
    checkOutdated(): OutdatedPackage[];
    private parseNpmOutdated;
    private determineUpdateType;
    private mapSeverity;
}
//# sourceMappingURL=auditor.d.ts.map