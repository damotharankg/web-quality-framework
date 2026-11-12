import { QualityConfig, DependencyAuditResult } from '../../config/types.js';
import { RemediationPlan } from './updater.js';
export interface DependencyModuleResult {
    score: number;
    passed: boolean;
    auditResult: DependencyAuditResult;
    remediationPlan: RemediationPlan;
}
export declare class DependencyAuditModule {
    private config;
    private auditor;
    constructor(config: QualityConfig);
    run(): DependencyModuleResult;
}
//# sourceMappingURL=index.d.ts.map