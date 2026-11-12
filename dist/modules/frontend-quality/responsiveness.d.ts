import { ResponsiveIssue } from '../../config/types.js';
export declare class ResponsivenessAuditor {
    auditHtml(html: string, pageUrl?: string): {
        issues: ResponsiveIssue[];
        brokenAssets: Array<{
            type: 'link' | 'image';
            url: string;
            status: number;
            parentPage: string;
        }>;
    };
    verifyAssets(assetUrls: string[], pageUrl: string): Promise<Array<{
        type: 'link' | 'image';
        url: string;
        status: number;
        parentPage: string;
    }>>;
    private pingUrl;
}
//# sourceMappingURL=responsiveness.d.ts.map