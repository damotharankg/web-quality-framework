import { QualityConfig, E2EJourneyResult, ConsoleMessageItem } from '../../config/types.js';
export interface E2EModuleResult {
    score: number;
    totalJourneys: number;
    passedJourneys: number;
    failedJourneys: number;
    results: E2EJourneyResult[];
    crawledPagesCount: number;
    capturedConsoleErrors: ConsoleMessageItem[];
}
export declare class E2EModule {
    private config;
    private runner;
    private crawler;
    constructor(config: QualityConfig);
    run(): Promise<E2EModuleResult>;
}
//# sourceMappingURL=index.d.ts.map