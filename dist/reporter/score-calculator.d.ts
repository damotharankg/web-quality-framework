import { QualityReportSummary, FrontendFramework } from '../config/types.js';
export interface ModuleScores {
    vapt: number;
    e2e: number;
    console: number;
    dependencies: number;
    frontendQuality: number;
}
export declare class ScoreCalculator {
    static calculate(scores: ModuleScores, issueCounts: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    }, framework: FrontendFramework, minOverallScore: number, startTime: number): QualityReportSummary;
}
//# sourceMappingURL=score-calculator.d.ts.map