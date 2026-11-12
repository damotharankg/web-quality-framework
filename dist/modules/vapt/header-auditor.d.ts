import { VaptRuleResult } from '../../config/types.js';
export interface HeaderAuditItem {
    status: 'pass' | 'fail' | 'warn';
    value?: string;
    message: string;
    remediation: string;
}
export declare class HeaderAuditor {
    auditUrl(targetUrl: string): Promise<{
        auditResults: Record<string, HeaderAuditItem>;
        vulnerabilities: VaptRuleResult[];
    }>;
    private fetchHeaders;
}
//# sourceMappingURL=header-auditor.d.ts.map