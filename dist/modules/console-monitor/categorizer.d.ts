import { ConsoleMessageItem, SeverityLevel } from '../../config/types.js';
interface KnownIssuePattern {
    id: string;
    category: 'react' | 'vue' | 'angular' | 'network' | 'runtime' | 'deprecation' | 'unhandled';
    severity: SeverityLevel;
    pattern: RegExp;
    title: string;
    remediation: string;
    frameworkNote?: string;
}
export declare const KNOWN_CONSOLE_PATTERNS: KnownIssuePattern[];
export declare class ConsoleMessageCategorizer {
    static categorize(rawMessage: string, type?: 'error' | 'warn' | 'info' | 'log'): {
        category: ConsoleMessageItem['category'];
        severity: SeverityLevel;
        title: string;
        remediation: string;
        frameworkNote?: string;
    };
    static aggregateMessages(messages: ConsoleMessageItem[]): ConsoleMessageItem[];
}
export {};
//# sourceMappingURL=categorizer.d.ts.map