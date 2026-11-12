import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
export class AutoCrawler {
    baseUrl;
    maxDepth;
    maxPages;
    ignorePatterns;
    constructor(baseUrl, maxDepth = 2, maxPages = 15, ignorePatterns = []) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.maxDepth = maxDepth;
        this.maxPages = maxPages;
        this.ignorePatterns = [
            /\/logout/i,
            /\/api\//i,
            /\.(pdf|zip|tar|gz|png|jpg|jpeg|gif|svg|css|js|ico)$/i,
            ...ignorePatterns.map(p => new RegExp(p.replace(/\*/g, '.*'), 'i')),
        ];
    }
    async crawl() {
        const visited = new Set();
        const results = [];
        const queue = [{ url: this.baseUrl, depth: 0 }];
        while (queue.length > 0 && results.length < this.maxPages) {
            const current = queue.shift();
            const normalizedUrl = this.normalizeUrl(current.url);
            if (visited.has(normalizedUrl))
                continue;
            visited.add(normalizedUrl);
            if (this.shouldIgnore(normalizedUrl))
                continue;
            const page = await this.fetchPage(normalizedUrl);
            results.push(page);
            if (current.depth < this.maxDepth) {
                for (const link of page.links) {
                    if (!visited.has(link) && link.startsWith(this.baseUrl)) {
                        queue.push({ url: link, depth: current.depth + 1 });
                    }
                }
            }
        }
        return results;
    }
    normalizeUrl(inputUrl) {
        try {
            const parsed = new URL(inputUrl, this.baseUrl);
            parsed.hash = ''; // Remove fragment
            return parsed.toString();
        }
        catch {
            return inputUrl;
        }
    }
    shouldIgnore(url) {
        return this.ignorePatterns.some(regex => regex.test(url));
    }
    fetchPage(targetUrl) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            try {
                const parsed = new URL(targetUrl);
                const client = parsed.protocol === 'https:' ? https : http;
                const req = client.get(parsed, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'WebQualityFramework/1.0 (E2E-Crawler)',
                        'Accept': 'text/html,application/xhtml+xml',
                    },
                }, (res) => {
                    let data = '';
                    res.setEncoding('utf-8');
                    res.on('data', chunk => { data += chunk; });
                    res.on('end', () => {
                        const loadTimeMs = Date.now() - startTime;
                        const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
                        const title = titleMatch ? titleMatch[1].trim() : '';
                        const links = this.extractLinks(data, targetUrl);
                        resolve({
                            url: targetUrl,
                            statusCode: res.statusCode || 0,
                            title,
                            links,
                            html: data,
                            loadTimeMs,
                        });
                    });
                });
                req.on('timeout', () => {
                    req.destroy(new Error(`Timeout loading ${targetUrl}`));
                });
                req.on('error', (err) => {
                    resolve({
                        url: targetUrl,
                        statusCode: 0,
                        title: '',
                        links: [],
                        html: '',
                        loadTimeMs: Date.now() - startTime,
                        error: err.message,
                    });
                });
            }
            catch (err) {
                resolve({
                    url: targetUrl,
                    statusCode: 0,
                    title: '',
                    links: [],
                    html: '',
                    loadTimeMs: Date.now() - startTime,
                    error: err.message,
                });
            }
        });
    }
    extractLinks(html, pageUrl) {
        const links = [];
        const linkRegex = /<a\s+[^>]*href=["']([^"'#]+)["']/gi;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
            const rawHref = match[1].trim();
            if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) {
                continue;
            }
            try {
                const resolved = new URL(rawHref, pageUrl).toString();
                links.push(resolved);
            }
            catch {
                // Invalid URL
            }
        }
        return [...new Set(links)];
    }
}
//# sourceMappingURL=auto-crawler.js.map