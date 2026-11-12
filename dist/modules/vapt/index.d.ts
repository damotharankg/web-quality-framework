import { QualityConfig, VaptRuleResult } from '../../config/types.js';
import { HeaderAuditItem } from './header-auditor.js';
import { DynamicVaptScanner } from './dynamic-vapt.js';
export interface VaptModuleResult {
    score: number;
    passed: boolean;
    findings: VaptRuleResult[];
    headersAudit: Record<string, HeaderAuditItem>;
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}
export declare class VaptModule {
    private config;
    private sastScanner;
    private headerAuditor;
    private dynamicScanner;
    constructor(config: QualityConfig);
    run(): Promise<VaptModuleResult>;
    getDynamicScanner(): DynamicVaptScanner;
}
//# sourceMappingURL=index.d.ts.map