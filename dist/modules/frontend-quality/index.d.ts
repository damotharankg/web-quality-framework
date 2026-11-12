import { QualityConfig, AccessibilityIssue, PerformanceMetrics, ResponsiveIssue } from '../../config/types.js';
import { CrawledPage } from '../e2e/auto-crawler.js';
export interface FrontendQualityModuleResult {
    score: number;
    passed: boolean;
    accessibilityIssues: AccessibilityIssue[];
    performanceMetrics: PerformanceMetrics;
    responsiveIssues: ResponsiveIssue[];
    brokenAssets: Array<{
        type: 'link' | 'image';
        url: string;
        status: number;
        parentPage: string;
    }>;
    summary: {
        accessibilityErrors: number;
        responsiveIssuesCount: number;
        brokenAssetsCount: number;
    };
}
export declare class FrontendQualityModule {
    private config;
    private a11yAuditor;
    private respAuditor;
    private perfAuditor;
    constructor(config: QualityConfig);
    evaluate(pages?: CrawledPage[]): Promise<FrontendQualityModuleResult>;
}
//# sourceMappingURL=index.d.ts.map