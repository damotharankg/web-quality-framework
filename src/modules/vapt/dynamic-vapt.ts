import { VaptRuleResult } from '../../config/types.js';

export class DynamicVaptScanner {
  /**
   * Evaluates client-side DOM and Storage security checks using DOM structure or in-browser evaluation script.
   */
  public getBrowserEvaluationScript(): string {
    return `
      (() => {
        const findings = [];

        // 1. Check LocalStorage and SessionStorage for sensitive keys
        try {
          const sensitiveKeywords = ['token', 'jwt', 'auth', 'secret', 'password', 'apikey', 'bearer', 'private'];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) || '';
            const lowerKey = key.toLowerCase();
            if (sensitiveKeywords.some(w => lowerKey.includes(w))) {
              findings.push({
                id: 'VAPT-DOM-001',
                name: 'Sensitive Key In LocalStorage: ' + key,
                category: 'DYNAMIC_DOM',
                severity: 'medium',
                description: 'Key "' + key + '" stored in localStorage. Web storage is directly accessible to any XSS payload.',
                remediation: 'Migrate sensitive credentials and session tokens to secure, HttpOnly, SameSite cookies.',
                cwe: 'CWE-922'
              });
            }
          }
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i) || '';
            const lowerKey = key.toLowerCase();
            if (sensitiveKeywords.some(w => lowerKey.includes(w))) {
              findings.push({
                id: 'VAPT-DOM-002',
                name: 'Sensitive Key In SessionStorage: ' + key,
                category: 'DYNAMIC_DOM',
                severity: 'medium',
                description: 'Key "' + key + '" stored in sessionStorage.',
                remediation: 'Avoid unencrypted credential storage in sessionStorage.',
                cwe: 'CWE-922'
              });
            }
          }
        } catch (e) {
          // Storage might be restricted
        }

        // 2. Check window object for leaked credentials
        try {
          const dangerousWindowProps = ['AWS', 'STRIPE_SECRET', 'JWT_TOKEN', 'AUTH_TOKEN', 'SECRET_KEY', 'DATABASE_URL'];
          for (const prop of dangerousWindowProps) {
            if (window[prop] !== undefined) {
              findings.push({
                id: 'VAPT-DOM-003',
                name: 'Exposed Global Secret: window.' + prop,
                category: 'DYNAMIC_DOM',
                severity: 'critical',
                description: 'Sensitive variable "' + prop + '" exposed on global window object.',
                remediation: 'Never attach backend credentials or secrets to global browser window.',
                cwe: 'CWE-798'
              });
            }
          }
        } catch (e) {}

        // 3. Reverse Tabnabbing / Target _blank check
        try {
          const blankLinks = document.querySelectorAll('a[target="_blank"]');
          blankLinks.forEach(link => {
            const rel = (link.getAttribute('rel') || '').toLowerCase();
            if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
              findings.push({
                id: 'VAPT-DOM-004',
                name: 'Reverse Tabnabbing (Unsafe target="_blank")',
                category: 'DYNAMIC_DOM',
                severity: 'low',
                description: 'Anchor tag to "' + (link.getAttribute('href') || '') + '" opens in blank window without rel="noopener noreferrer".',
                snippet: link.outerHTML.substring(0, 100),
                remediation: 'Add rel="noopener noreferrer" to external links opening in new tabs.',
                cwe: 'CWE-1022'
              });
            }
          });
        } catch (e) {}

        // 4. Mixed Content Check (if HTTPS)
        try {
          if (window.location.protocol === 'https:') {
            const elements = document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"], iframe[src^="http:"]');
            elements.forEach(el => {
              const src = el.getAttribute('src') || el.getAttribute('href') || '';
              findings.push({
                id: 'VAPT-DOM-005',
                name: 'Mixed Active/Passive Content',
                category: 'DYNAMIC_DOM',
                severity: 'high',
                description: 'Insecure HTTP asset loaded on secure HTTPS page: ' + src,
                snippet: el.outerHTML.substring(0, 120),
                remediation: 'Update resource URL to HTTPS or load relative to origin.',
                cwe: 'CWE-319'
              });
            });
          }
        } catch (e) {}

        return findings;
      })();
    `;
  }

  /**
   * Static analysis of HTML contents for DOM-level security checks when headless browser is not active.
   */
  public analyzeHtmlContent(html: string, pageUrl: string = '/'): VaptRuleResult[] {
    const findings: VaptRuleResult[] = [];

    // Target _blank check
    const blankRegex = /<a\s+[^>]*target=["']_blank["'][^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = blankRegex.exec(html)) !== null) {
      const tag = match[0];
      const relMatch = tag.match(/rel=["']([^"']*)["']/i);
      const relValue = relMatch ? relMatch[1].toLowerCase() : '';
      if (!relValue.includes('noopener') && !relValue.includes('noreferrer')) {
        findings.push({
          id: 'VAPT-DOM-004',
          name: 'Reverse Tabnabbing (Unsafe target="_blank")',
          category: 'DYNAMIC_DOM',
          severity: 'low',
          description: `Anchor tag opening in blank target without rel="noopener noreferrer" on page ${pageUrl}`,
          snippet: tag.substring(0, 120),
          remediation: 'Add `rel="noopener noreferrer"` attribute to all target="_blank" links.',
          cwe: 'CWE-1022',
        });
      }
    }

    // Mixed content check
    if (pageUrl.startsWith('https://')) {
      const mixedRegex = /<(?:img|script|link|iframe)\s+[^>]*(?:src|href)=["'](http:\/\/[^"']+)["'][^>]*>/gi;
      let mMatch: RegExpExecArray | null;
      while ((mMatch = mixedRegex.exec(html)) !== null) {
        findings.push({
          id: 'VAPT-DOM-005',
          name: 'Mixed Content Detected',
          category: 'DYNAMIC_DOM',
          severity: 'high',
          description: `Cleartext HTTP resource included in HTTPS page: ${mMatch[1]}`,
          snippet: mMatch[0].substring(0, 120),
          remediation: 'Migrate the resource URL to HTTPS.',
          cwe: 'CWE-319',
        });
      }
    }

    return findings;
  }
}

