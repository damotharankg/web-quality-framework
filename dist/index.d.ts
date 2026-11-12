import { QualityConfig, ConsolidatedQualityReport } from './config/types.js';
import { loadConfig, getDefaultConfig } from './config/defaults.js';
import { VaptModule } from './modules/vapt/index.js';
import { E2EModule } from './modules/e2e/index.js';
import { ConsoleMonitorModule } from './modules/console-monitor/index.js';
import { DependencyAuditModule } from './modules/dependency-audit/index.js';
import { FrontendQualityModule } from './modules/frontend-quality/index.js';
import { ReporterModule } from './reporter/index.js';
export * from './config/types.js';
export { loadConfig, getDefaultConfig };
export { VaptModule, E2EModule, ConsoleMonitorModule, DependencyAuditModule, FrontendQualityModule, ReporterModule };
export declare class QualityRunner {
    private config;
    constructor(config: QualityConfig);
    runAll(): Promise<ConsolidatedQualityReport>;
}
export declare function runQualitySuite(overrides?: Partial<QualityConfig>, configPath?: string): Promise<ConsolidatedQualityReport>;
//# sourceMappingURL=index.d.ts.map