export class PerformanceAuditor {
    analyzeHtmlMetrics(html, loadTimeMs) {
        // Count DOM nodes by matching HTML tags
        const tagMatches = html.match(/<[a-zA-Z0-9-]+(?:\s|>)/g);
        const domNodesCount = tagMatches ? tagMatches.length : 0;
        // Count external resources (scripts, stylesheets, images)
        const scriptMatches = html.match(/<script\s+/gi);
        const styleMatches = html.match(/<link\s+[^>]*rel=["']stylesheet["']/gi);
        const imgMatches = html.match(/<img\s+/gi);
        const resourceCount = (scriptMatches ? scriptMatches.length : 0) +
            (styleMatches ? styleMatches.length : 0) +
            (imgMatches ? imgMatches.length : 0);
        const totalResourceSizeBytes = Buffer.byteLength(html, 'utf-8');
        // Approximate FCP & LCP based on network loadTimeMs and DOM complexity
        const fcp = Math.max(100, Math.round(loadTimeMs * 0.4));
        const lcp = Math.max(200, Math.round(loadTimeMs * 0.8) + (domNodesCount > 1000 ? 300 : 50));
        const cls = domNodesCount > 1200 ? 0.08 : 0.01;
        return {
            ttfb: Math.round(loadTimeMs * 0.3),
            fcp,
            lcp,
            cls,
            domNodesCount,
            resourceCount,
            totalResourceSizeBytes,
        };
    }
}
//# sourceMappingURL=performance.js.map