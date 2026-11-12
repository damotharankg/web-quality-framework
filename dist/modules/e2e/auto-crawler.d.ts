export interface CrawledPage {
    url: string;
    statusCode: number;
    title: string;
    links: string[];
    html: string;
    loadTimeMs: number;
    error?: string;
}
export declare class AutoCrawler {
    private baseUrl;
    private maxDepth;
    private maxPages;
    private ignorePatterns;
    constructor(baseUrl: string, maxDepth?: number, maxPages?: number, ignorePatterns?: string[]);
    crawl(): Promise<CrawledPage[]>;
    private normalizeUrl;
    private shouldIgnore;
    private fetchPage;
    private extractLinks;
}
//# sourceMappingURL=auto-crawler.d.ts.map