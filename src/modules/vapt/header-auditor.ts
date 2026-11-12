import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { VaptRuleResult } from '../../config/types.js';

export interface HeaderAuditItem {
  status: 'pass' | 'fail' | 'warn';
  value?: string;
  message: string;
  remediation: string;
}

export class HeaderAuditor {
  public async auditUrl(targetUrl: string): Promise<{
    auditResults: Record<string, HeaderAuditItem>;
    vulnerabilities: VaptRuleResult[];
  }> {
    const vulnerabilities: VaptRuleResult[] = [];
    const auditResults: Record<string, HeaderAuditItem> = {};

    let responseHeaders: Record<string, string | string[] | undefined> = {};

    try {
      responseHeaders = await this.fetchHeaders(targetUrl);
    } catch (err: any) {
      // If server is not reachable, record warning and return empty/offline audit
      auditResults['server_connection'] = {
        status: 'warn',
        message: `Could not connect to target server at ${targetUrl}: ${err.message}`,
        remediation: 'Ensure the application development or staging server is running before running live header audit.',
      };
      return { auditResults, vulnerabilities };
    }

    const getHeader = (name: string): string | undefined => {
      const lower = name.toLowerCase();
      const val = responseHeaders[lower];
      if (Array.isArray(val)) return val.join(', ');
      return val;
    };

    // 1. Content-Security-Policy (CSP)
    const csp = getHeader('content-security-policy');
    if (!csp) {
      auditResults['Content-Security-Policy'] = {
        status: 'fail',
        message: 'Missing Content-Security-Policy (CSP) header.',
        remediation: 'Configure CSP header to restrict script, style, and object execution: Content-Security-Policy: default-src \'self\'; script-src \'self\';',
      };
      vulnerabilities.push({
        id: 'SEC-HDR-CSP-01',
        name: 'Missing Content-Security-Policy',
        category: 'HEADERS',
        severity: 'high',
        description: 'No Content-Security-Policy header returned. CSP is critical in preventing XSS and data injection attacks.',
        remediation: 'Add `Content-Security-Policy: default-src \'self\'; script-src \'self\'; object-src \'none\'; base-uri \'self\';` to server or meta tag.',
        cwe: 'CWE-1021',
      });
    } else {
      let cspWarn = false;
      const notes: string[] = [];
      if (csp.includes("'unsafe-inline'")) {
        cspWarn = true;
        notes.push("Includes 'unsafe-inline' which weakens XSS mitigation.");
      }
      if (csp.includes("'unsafe-eval'")) {
        cspWarn = true;
        notes.push("Includes 'unsafe-eval' which allows string code execution.");
      }
      auditResults['Content-Security-Policy'] = {
        status: cspWarn ? 'warn' : 'pass',
        value: csp,
        message: cspWarn ? `CSP present with weaknesses: ${notes.join(' ')}` : 'Strong Content-Security-Policy active.',
        remediation: 'Remove unsafe-inline and unsafe-eval; adopt nonces or hashes for inline scripts.',
      };
      if (cspWarn) {
        vulnerabilities.push({
          id: 'SEC-HDR-CSP-02',
          name: 'Permissive Directives in Content-Security-Policy',
          category: 'HEADERS',
          severity: 'medium',
          description: `CSP allows unsafe directives: ${notes.join(' ')}`,
          remediation: 'Refactor inline scripts to external bundles or attach cryptographic nonces: script-src \'self\' \'nonce-...\'',
          cwe: 'CWE-79',
        });
      }
    }

    // 2. Strict-Transport-Security (HSTS)
    const hsts = getHeader('strict-transport-security');
    const isHttps = targetUrl.startsWith('https://');
    if (isHttps) {
      if (!hsts) {
        auditResults['Strict-Transport-Security'] = {
          status: 'fail',
          message: 'Missing Strict-Transport-Security (HSTS) header on HTTPS endpoint.',
          remediation: 'Add `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` header.',
        };
        vulnerabilities.push({
          id: 'SEC-HDR-HSTS-01',
          name: 'Missing Strict-Transport-Security (HSTS)',
          category: 'HEADERS',
          severity: 'high',
          description: 'HSTS is not enforced on HTTPS endpoint, enabling SSL-stripping and downgrade attacks.',
          remediation: 'Configure Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
          cwe: 'CWE-319',
        });
      } else {
        auditResults['Strict-Transport-Security'] = {
          status: 'pass',
          value: hsts,
          message: 'Strict-Transport-Security is active.',
          remediation: 'Maintain valid HSTS configuration.',
        };
      }
    } else {
      auditResults['Strict-Transport-Security'] = {
        status: 'warn',
        message: 'Endpoint is plain HTTP. HSTS only applies to HTTPS.',
        remediation: 'Deploy HTTPS certificate and enforce redirect to HTTPS.',
      };
    }

    // 3. X-Frame-Options
    const xfo = getHeader('x-frame-options');
    if (!xfo && (!csp || !csp.includes('frame-ancestors'))) {
      auditResults['X-Frame-Options'] = {
        status: 'fail',
        message: 'Missing X-Frame-Options and frame-ancestors CSP directive.',
        remediation: 'Set `X-Frame-Options: DENY` or `SAMEORIGIN` to mitigate clickjacking.',
      };
      vulnerabilities.push({
        id: 'SEC-HDR-XFO-01',
        name: 'Missing Clickjacking Defense (X-Frame-Options)',
        category: 'HEADERS',
        severity: 'medium',
        description: 'Application allows embedding into foreign iframes without restriction, risking clickjacking attacks.',
        remediation: 'Set `X-Frame-Options: SAMEORIGIN` or CSP `frame-ancestors \'self\';`',
        cwe: 'CWE-1021',
      });
    } else {
      auditResults['X-Frame-Options'] = {
        status: 'pass',
        value: xfo || 'Protected via CSP frame-ancestors',
        message: 'Clickjacking defenses verified.',
        remediation: 'Maintain current iframe embedding restrictions.',
      };
    }

    // 4. X-Content-Type-Options
    const xcto = getHeader('x-content-type-options');
    if (!xcto || !xcto.toLowerCase().includes('nosniff')) {
      auditResults['X-Content-Type-Options'] = {
        status: 'fail',
        message: 'Missing or invalid X-Content-Type-Options: nosniff header.',
        remediation: 'Set `X-Content-Type-Options: nosniff` to prevent browser MIME-sniffing.',
      };
      vulnerabilities.push({
        id: 'SEC-HDR-XCTO-01',
        name: 'Missing X-Content-Type-Options: nosniff',
        category: 'HEADERS',
        severity: 'low',
        description: 'Without nosniff, browsers may interpret non-executable MIME types as executable JavaScript.',
        remediation: 'Add `X-Content-Type-Options: nosniff` header.',
        cwe: 'CWE-16',
      });
    } else {
      auditResults['X-Content-Type-Options'] = {
        status: 'pass',
        value: xcto,
        message: 'MIME-sniffing prevention is active.',
        remediation: 'Maintain nosniff policy.',
      };
    }

    // 5. Referrer-Policy
    const refPol = getHeader('referrer-policy');
    if (!refPol) {
      auditResults['Referrer-Policy'] = {
        status: 'warn',
        message: 'Missing explicit Referrer-Policy header.',
        remediation: 'Set `Referrer-Policy: strict-origin-when-cross-origin` to prevent leaking full query URLs to external domains.',
      };
    } else {
      auditResults['Referrer-Policy'] = {
        status: 'pass',
        value: refPol,
        message: 'Referrer-Policy configured.',
        remediation: 'Ensure policy restricts cross-origin path leaks.',
      };
    }

    // 6. Access-Control-Allow-Origin (CORS)
    const cors = getHeader('access-control-allow-origin');
    if (cors === '*') {
      auditResults['Access-Control-Allow-Origin'] = {
        status: 'warn',
        value: '*',
        message: 'CORS wildcard (*) allowed on frontend endpoint.',
        remediation: 'Ensure wildcards are not used on authenticated endpoints or endpoints delivering private data.',
      };
    }

    // 7. Cookies Check
    const rawCookies = responseHeaders['set-cookie'];
    if (rawCookies) {
      const cookieList = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      for (const cookie of cookieList) {
        const lowerCookie = cookie.toLowerCase();
        const cookieName = cookie.split('=')[0].trim();
        const missingFlags: string[] = [];

        if (!lowerCookie.includes('secure') && isHttps) missingFlags.push('Secure');
        if (!lowerCookie.includes('httponly')) missingFlags.push('HttpOnly');
        if (!lowerCookie.includes('samesite')) missingFlags.push('SameSite');

        if (missingFlags.length > 0) {
          vulnerabilities.push({
            id: 'SEC-CK-01',
            name: `Cookie ${cookieName} missing security attributes`,
            category: 'TRANSPORT',
            severity: 'medium',
            description: `Cookie "${cookieName}" lacks recommended protection flags: ${missingFlags.join(', ')}`,
            remediation: `Configure cookie attributes: Set-Cookie: ${cookieName}=...; Secure; HttpOnly; SameSite=Lax`,
            cwe: 'CWE-614',
          });
        }
      }
    }

    return { auditResults, vulnerabilities };
  }

  private fetchHeaders(targetUrl: string): Promise<Record<string, string | string[] | undefined>> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(targetUrl);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.request(
        parsedUrl,
        {
          method: 'HEAD',
          timeout: 8000,
          headers: {
            'User-Agent': 'WebQualityFramework/1.0 (VAPT-Auditor)',
          },
        },
        (res) => {
          resolve(res.headers);
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error(`Timeout connecting to ${targetUrl}`));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });
  }
}

