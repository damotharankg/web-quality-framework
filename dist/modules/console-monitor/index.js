import { ConsoleMessageCategorizer } from './categorizer.js';
export class ConsoleMonitorModule {
    config;
    collectedMessages = [];
    constructor(config) {
        this.config = config;
    }
    recordMessage(rawMessage, type = 'error', source) {
        // Check ignore patterns
        for (const pattern of this.config.consoleMonitor.ignorePatterns) {
            if (rawMessage.includes(pattern))
                return;
        }
        const categorized = ConsoleMessageCategorizer.categorize(rawMessage, type);
        this.collectedMessages.push({
            id: `CONSOLE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type,
            category: categorized.category,
            severity: categorized.severity,
            message: rawMessage,
            sourceUrl: source,
            remediation: categorized.remediation,
            frameworkNote: categorized.frameworkNote,
            occurrences: 1,
        });
    }
    addMessages(messages) {
        for (const msg of messages) {
            const shouldIgnore = this.config.consoleMonitor.ignorePatterns.some(pat => msg.message.includes(pat));
            if (!shouldIgnore) {
                this.collectedMessages.push(msg);
            }
        }
    }
    evaluate() {
        const aggregated = ConsoleMessageCategorizer.aggregateMessages(this.collectedMessages);
        const totalErrors = aggregated.filter(m => m.type === 'error').reduce((acc, m) => acc + m.occurrences, 0);
        const totalWarnings = aggregated.filter(m => m.type === 'warn').reduce((acc, m) => acc + m.occurrences, 0);
        const summary = {
            critical: aggregated.filter(m => m.severity === 'critical').reduce((acc, m) => acc + m.occurrences, 0),
            high: aggregated.filter(m => m.severity === 'high').reduce((acc, m) => acc + m.occurrences, 0),
            medium: aggregated.filter(m => m.severity === 'medium').reduce((acc, m) => acc + m.occurrences, 0),
            low: aggregated.filter(m => m.severity === 'low').reduce((acc, m) => acc + m.occurrences, 0),
            frameworkSpecific: aggregated.filter(m => ['react', 'vue', 'angular'].includes(m.category)).length,
        };
        // Calculate score: Base 100
        // Errors: -10 each, Warnings: -2 each
        const penalty = (totalErrors * 10) + (totalWarnings * 2);
        const score = Math.max(0, 100 - penalty);
        const passed = (!this.config.consoleMonitor.failOnError || totalErrors <= this.config.consoleMonitor.maxErrorsAllowed) &&
            (!this.config.consoleMonitor.failOnWarning || totalWarnings <= this.config.consoleMonitor.maxWarningsAllowed);
        return {
            score,
            passed,
            totalErrors,
            totalWarnings,
            messages: aggregated,
            summary,
        };
    }
}
//# sourceMappingURL=index.js.map