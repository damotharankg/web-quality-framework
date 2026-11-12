import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { ResponsiveIssue } from '../../config/types.js';

export class ResponsivenessAuditor {
  public auditHtml(html: string, pageUrl: string = '/'): {
    issues: ResponsiveIssue[];
    brokenAssets: Array<{ type: 'link' | 'image'; url: string; status: number; parentPage: string }>;
  } {
    const issues: ResponsiveIssue[] = [];
    const brokenAssets: Array<{ type: 'link' | 'image'; url: string; status: number; parentPage: string }> = [];

    // 1. Meta viewport check
    const hasViewport = /<meta\s+[^>]*name=["']viewport["'][^>]*>/i.test(html);
    if (!hasViewport) {
      issues.push({
        viewport: 'All Viewports',
        issueType: 'horizontal-overflow',
        description: `Page ${pageUrl} is missing the standard responsive <meta name="viewport"> tag.`,
        remediation: 'Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">` inside <head>.',
      });
    }

    // 2. Inline fixed width anti-patterns (e.g. style="width: 1200px" or width="1400")
    const fixedWidthRegex = /(?:style=["'][^"']*width:\s*([0-9]{3,4})px[^"']*["']|\bwidth=["']([0-9]{3,4})["'])/gi;
    let match: RegExpExecArray | null;
    while ((match = fixedWidthRegex.exec(html)) !== null) {
      const widthVal = parseInt(match[1] || match[2], 10);
      if (widthVal > 600) {
        issues.push({
          viewport: 'Mobile / Tablet',
          issueType: 'horizontal-overflow',
          description: `Hardcoded large fixed width (${widthVal}px) on ${pageUrl} causes horizontal scrolling on smaller viewports.`,
          remediation: 'Use responsive units (e.g. `max-width: 100%`, `width: 100%`, flexbox, or grid) instead of fixed pixel widths.',
        });
        break; // Report once per page
      }
    }

    return { issues, brokenAssets };
  }

  public async verifyAssets(
    assetUrls: string[],
    pageUrl: string
  ): Promise<Array<{ type: 'link' | 'image'; url: string; status: number; parentPage: string }>> {
    const broken: Array<{ type: 'link' | 'image'; url: string; status: number; parentPage: string }> = [];

    for (const rawUrl of assetUrls.slice(0, 10)) { // Verify top 10 assets to maintain speed
      if (!rawUrl.startsWith('http')) continue;
      try {
        const status = await this.pingUrl(rawUrl);
        if (status >= 400) {
          const type = rawUrl.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) ? 'image' : 'link';
          broken.push({
            type,
            url: rawUrl,
            status,
            parentPage: pageUrl,
          });
        }
      } catch {
        broken.push({
          type: 'link',
          url: rawUrl,
          status: 0,
          parentPage: pageUrl,
        });
      }
    }

    return broken;
  }

  private pingUrl(targetUrl: string): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        const parsed = new URL(targetUrl);
        const client = parsed.protocol === 'https:' ? https : http;
        const req = client.request(parsed, { method: 'HEAD', timeout: 5000 }, (res) => {
          resolve(res.statusCode || 0);
        });
        req.on('timeout', () => req.destroy(new Error('Timeout')));
        req.on('error', (err) => reject(err));
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

