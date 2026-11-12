import { VaptRuleResult, SeverityLevel } from '../../config/types.js';
interface SASTRule {
    id: string;
    name: string;
    category: 'SAST' | 'SECRETS';
    severity: SeverityLevel;
    pattern: RegExp;
    description: string;
    remediation: string;
    cwe: string;
}
export declare const DEFAULT_SAST_RULES: SASTRule[];
export declare class SASTScanner {
    private rules;
    private excludePatterns;
    constructor(customRules?: SASTRule[], excludePatterns?: string[]);
    scanDirectory(dirPath: string): VaptRuleResult[];
    scanFile(filePath: string): VaptRuleResult[];
    private collectFiles;
}
export {};
//# sourceMappingURL=sast-scanner.d.ts.map