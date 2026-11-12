import { QualityConfig, ConsoleMessageItem } from '../../config/types.js';
export interface ConsoleMonitorResult {
    score: number;
    passed: boolean;
    totalErrors: number;
    totalWarnings: number;
    messages: ConsoleMessageItem[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        frameworkSpecific: number;
    };
}
export declare class ConsoleMonitorModule {
    private config;
    private collectedMessages;
    constructor(config: QualityConfig);
    recordMessage(rawMessage: string, type?: 'error' | 'warn', source?: string): void;
    addMessages(messages: ConsoleMessageItem[]): void;
    evaluate(): ConsoleMonitorResult;
}
//# sourceMappingURL=index.d.ts.map