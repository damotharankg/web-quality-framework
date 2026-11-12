import { ConsoleMessageCategorizer } from '../modules/console-monitor/categorizer.js';
export function initQualityMonitor(options = {}) {
    if (typeof window === 'undefined')
        return;
    if (window.__QUALITY_MONITOR_ACTIVE__)
        return;
    window.__QUALITY_MONITOR_ACTIVE__ = true;
    window.__QUALITY_CONSOLE_BUFFER__ = window.__QUALITY_CONSOLE_BUFFER__ || [];
    const buffer = window.__QUALITY_CONSOLE_BUFFER__;
    const maxBufferSize = options.maxBufferSize || 200;
    const pushMessage = (item) => {
        if (buffer.length >= maxBufferSize) {
            buffer.shift(); // Evict oldest
        }
        buffer.push(item);
        if (options.onIssueDetected) {
            options.onIssueDetected(item);
        }
        if (options.reportEndpoint) {
            try {
                navigator.sendBeacon?.(options.reportEndpoint, JSON.stringify(item));
            }
            catch { }
        }
    };
    // 1. Intercept console.error and console.warn
    if (options.enableConsoleInterception !== false) {
        const originalError = console.error;
        const originalWarn = console.warn;
        console.error = function (...args) {
            const rawText = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            const categorized = ConsoleMessageCategorizer.categorize(rawText, 'error');
            pushMessage({
                id: `CLIENT-ERR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'error',
                category: categorized.category,
                severity: categorized.severity,
                message: rawText,
                remediation: categorized.remediation,
                frameworkNote: categorized.frameworkNote,
                occurrences: 1,
            });
            originalError.apply(console, args);
        };
        console.warn = function (...args) {
            const rawText = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
            const categorized = ConsoleMessageCategorizer.categorize(rawText, 'warn');
            pushMessage({
                id: `CLIENT-WARN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'warn',
                category: categorized.category,
                severity: categorized.severity,
                message: rawText,
                remediation: categorized.remediation,
                frameworkNote: categorized.frameworkNote,
                occurrences: 1,
            });
            originalWarn.apply(console, args);
        };
    }
    // 2. Intercept window.onerror and unhandledrejection
    if (options.enableErrorListener !== false) {
        window.addEventListener('error', (event) => {
            const categorized = ConsoleMessageCategorizer.categorize(event.message || 'Script error', 'error');
            pushMessage({
                id: `WINDOW-ERR-${Date.now()}`,
                type: 'error',
                category: 'unhandled',
                severity: 'critical',
                message: event.message,
                sourceUrl: event.filename,
                lineNumber: event.lineno,
                columnNumber: event.colno,
                stack: event.error?.stack,
                remediation: categorized.remediation,
                occurrences: 1,
            });
        });
        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason?.message || String(event.reason || 'Unhandled Promise Rejection');
            pushMessage({
                id: `UNHANDLED-REJECT-${Date.now()}`,
                type: 'error',
                category: 'unhandled',
                severity: 'high',
                message: `Unhandled Promise Rejection: ${reason}`,
                stack: event.reason?.stack,
                remediation: 'Attach a .catch() handler or enclose async calls in try/catch.',
                occurrences: 1,
            });
        });
    }
    console.info('[web-quality-framework] Runtime Quality Monitor active.');
}
export function getConsoleBuffer() {
    if (typeof window === 'undefined')
        return [];
    return window.__QUALITY_CONSOLE_BUFFER__ || [];
}
export function clearConsoleBuffer() {
    if (typeof window === 'undefined')
        return;
    window.__QUALITY_CONSOLE_BUFFER__ = [];
}
//# sourceMappingURL=runtime-agent.js.map