import { E2ERunner } from './runner.js';
import { AutoCrawler } from './auto-crawler.js';
export class E2EModule {
    config;
    runner;
    crawler;
    constructor(config) {
        this.config = config;
        const baseUrl = config.e2e.baseUrl || config.server?.url || 'http://localhost:3000';
        this.runner = new E2ERunner(baseUrl, config.e2e.timeout);
        this.crawler = new AutoCrawler(baseUrl, config.e2e.autoCrawl.maxDepth, config.e2e.autoCrawl.maxPages, config.e2e.autoCrawl.ignorePatterns);
    }
    async run() {
        const results = [];
        const capturedConsoleErrors = [];
        let crawledPagesCount = 0;
        const onConsoleMessage = (msg) => {
            capturedConsoleErrors.push(msg);
        };
        // 1. Run defined journeys across configured viewports
        const journeys = [...this.config.e2e.journeys];
        // If autoCrawl is enabled or journeys list is empty, synthesize a baseline route navigation journey
        if (this.config.e2e.autoCrawl.enabled) {
            try {
                const pages = await this.crawler.crawl();
                crawledPagesCount = pages.length;
                // Create synthetic journeys for crawled pages
                for (const page of pages) {
                    if (page.statusCode >= 200 && page.statusCode < 400) {
                        journeys.push({
                            name: `Route Verification: ${page.url.replace(this.config.e2e.baseUrl, '') || '/'}`,
                            startUrl: page.url,
                            actions: [
                                { type: 'assertVisible', selector: 'body', description: 'Page body renders' },
                            ],
                        });
                    }
                    else {
                        results.push({
                            name: `Broken Route: ${page.url}`,
                            success: false,
                            durationMs: page.loadTimeMs,
                            stepsPassed: 0,
                            stepsTotal: 1,
                            failedStep: {
                                action: { type: 'navigate', value: page.url },
                                error: page.error || `HTTP ${page.statusCode}`,
                            },
                            viewport: 'Desktop',
                        });
                    }
                }
            }
            catch (err) {
                console.warn(`[web-quality] Auto-crawler warning:`, err.message);
            }
        }
        // Default smoke journey if no journeys exist
        if (journeys.length === 0) {
            journeys.push({
                name: 'Smoke Test: Application Home Route',
                startUrl: '/',
                actions: [
                    { type: 'assertVisible', selector: 'body', description: 'Verify page body renders' },
                ],
            });
        }
        // Run journeys across selected viewports (Desktop & Mobile)
        const testViewports = this.config.e2e.viewports.slice(0, 2); // default test top 2 viewports
        for (const journey of journeys) {
            for (const viewport of testViewports) {
                const result = await this.runner.runJourney(journey, viewport, onConsoleMessage);
                results.push(result);
            }
        }
        const totalJourneys = results.length;
        const passedJourneys = results.filter(r => r.success).length;
        const failedJourneys = totalJourneys - passedJourneys;
        const score = totalJourneys > 0 ? Math.round((passedJourneys / totalJourneys) * 100) : 100;
        return {
            score,
            totalJourneys,
            passedJourneys,
            failedJourneys,
            results,
            crawledPagesCount,
            capturedConsoleErrors,
        };
    }
}
//# sourceMappingURL=index.js.map