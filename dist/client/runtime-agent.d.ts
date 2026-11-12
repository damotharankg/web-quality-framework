import { ConsoleMessageItem } from '../config/types.js';
export interface QualityClientOptions {
    enableConsoleInterception?: boolean;
    enableErrorListener?: boolean;
    reportEndpoint?: string;
    maxBufferSize?: number;
    onIssueDetected?: (issue: ConsoleMessageItem) => void;
}
declare global {
    interface Window {
        __QUALITY_CONSOLE_BUFFER__?: ConsoleMessageItem[];
        __QUALITY_MONITOR_ACTIVE__?: boolean;
    }
}
export declare function initQualityMonitor(options?: QualityClientOptions): void;
export declare function getConsoleBuffer(): ConsoleMessageItem[];
export declare function clearConsoleBuffer(): void;
//# sourceMappingURL=runtime-agent.d.ts.map