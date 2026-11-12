import { ConsolidatedQualityReport } from '../config/types.js';
export declare class ReporterModule {
    static saveReports(report: ConsolidatedQualityReport, outputDir: string, formats: string[]): {
        htmlPath?: string;
        jsonPath?: string;
        junitPath?: string;
    };
    static printConsoleSummary(report: ConsolidatedQualityReport): void;
    private static generateJunitXml;
}
//# sourceMappingURL=index.d.ts.map