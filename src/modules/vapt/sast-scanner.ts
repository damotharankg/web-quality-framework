import fs from 'node:fs';
import path from 'node:path';
import { VaptRuleResult, SeverityLevel } from '../../config/types.js';

interface SASTRule {
  id: string;
  name: string;
  category: 'SAST' | 'SECRETS';
  severity: SeverityLevel;
  pattern: RegExp;
  description: string;
  remediation: string;
  cwe: string;
}

export const DEFAULT_SAST_RULES: SASTRule[] = [
  // Dangerous XSS Sinks
  {
    id: 'SEC-XSS-001',
    name: 'Unsafe DOM Injection (dangerouslySetInnerHTML)',
    category: 'SAST',
    severity: 'high',
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
    description: 'Direct use of dangerouslySetInnerHTML exposes the component to Cross-Site Scripting (XSS) if data is user-controlled.',
    remediation: 'Sanitize HTML input using DOMPurify before rendering: DOMPurify.sanitize(inputHtml)',
    cwe: 'CWE-79',
  },
  {
    id: 'SEC-XSS-002',
    name: 'Direct innerHTML / outerHTML assignment',
    category: 'SAST',
    severity: 'high',
    pattern: /\.(innerHTML|outerHTML)\s*=/g,
    description: 'Direct assignment to innerHTML or outerHTML bypasses template escaping and can trigger XSS execution.',
    remediation: 'Use textContent or safe template rendering, or sanitize with DOMPurify.',
    cwe: 'CWE-79',
  },
  {
    id: 'SEC-XSS-003',
    name: 'Dynamic code execution (eval / Function constructor)',
    category: 'SAST',
    severity: 'critical',
    pattern: /\b(eval\s*\(|new\s+Function\s*\()/g,
    description: 'eval() and the Function constructor execute arbitrary strings as code, leading to arbitrary code execution.',
    remediation: 'Avoid eval() completely. Parse structured data using JSON.parse() instead.',
    cwe: 'CWE-95',
  },
  {
    id: 'SEC-XSS-004',
    name: 'Dangerous document.write execution',
    category: 'SAST',
    severity: 'high',
    pattern: /document\.(write|writeln)\s*\(/g,
    description: 'document.write overwrites document streams and allows HTML/script injection from untrusted sources.',
    remediation: 'Manipulate the DOM using safe standard APIs such as document.createElement and appendChild.',
    cwe: 'CWE-79',
  },
  {
    id: 'SEC-XSS-005',
    name: 'Vue unescaped v-html binding',
    category: 'SAST',
    severity: 'high',
    pattern: /v-html\s*=/g,
    description: 'v-html renders raw HTML and exposes Vue components to XSS attacks if data is user-supplied.',
    remediation: 'Sanitize content with DOMPurify or replace with standard mustache interpolation {{ data }}.',
    cwe: 'CWE-79',
  },

  // Insecure Communications & postMessage
  {
    id: 'SEC-COMM-001',
    name: 'Insecure postMessage with wildcard targetOrigin',
    category: 'SAST',
    severity: 'high',
    pattern: /postMessage\s*\([^,]+,\s*['"]\*['"]\s*\)/g,
    description: 'Sending postMessage with "*" as targetOrigin transmits data to any origin that embeds or loads the window.',
    remediation: 'Specify the exact target origin string instead of "*", e.g. postMessage(data, "https://trusted.domain.com").',
    cwe: 'CWE-345',
  },
  {
    id: 'SEC-COMM-002',
    name: 'Unvalidated window message event origin',
    category: 'SAST',
    severity: 'medium',
    pattern: /window\.addEventListener\s*\(\s*['"]message['"]\s*,\s*(function|\([^)]*\)\s*=>)/g,
    description: 'Message event listeners must strictly validate event.origin before acting upon event.data.',
    remediation: 'Add `if (event.origin !== "https://trusted.domain.com") return;` as the first statement in the handler.',
    cwe: 'CWE-346',
  },

  // Insecure Storage of Sensitive Data
  {
    id: 'SEC-STOR-001',
    name: 'Potential Sensitive Token / Password in Web Storage',
    category: 'SAST',
    severity: 'medium',
    pattern: /(localStorage|sessionStorage)\.setItem\s*\(\s*['"][^'"]*(token|jwt|auth|password|secret|bearer)[^'"]*['"]/gi,
    description: 'Storing authentication tokens or secrets in localStorage or sessionStorage exposes them to theft via XSS.',
    remediation: 'Store session tokens in secure, HttpOnly, SameSite cookies rather than browser localStorage.',
    cwe: 'CWE-922',
  },

  // Secrets & Credential Leaks
  {
    id: 'SEC-CRED-001',
    name: 'Hardcoded AWS Access Key ID',
    category: 'SECRETS',
    severity: 'critical',
    pattern: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    description: 'Found hardcoded AWS Access Key ID in source code. Credentials in frontend bundles can be extracted by anyone.',
    remediation: 'Revoke the key immediately in AWS IAM, and move cloud service interactions to a secure backend API.',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-CRED-002',
    name: 'Hardcoded Private Key Block',
    category: 'SECRETS',
    severity: 'critical',
    pattern: /-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----/g,
    description: 'Found embedded cryptographic private key in source code.',
    remediation: 'Rotate this private key immediately and store keys only in secure KMS or backend environment variables.',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-CRED-003',
    name: 'Hardcoded Stripe Secret Key',
    category: 'SECRETS',
    severity: 'critical',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    description: 'Stripe live secret key found in client-side code, allowing unauthorized billing and transaction manipulation.',
    remediation: 'Revoke key in Stripe Dashboard. Only publishable keys (pk_live_...) may reside on client side.',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-CRED-004',
    name: 'Hardcoded Generic Bearer Token or JWT',
    category: 'SECRETS',
    severity: 'high',
    pattern: /['"]Bearer\s+eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+['"]/g,
    description: 'Found static JWT or Bearer authorization token hardcoded in client source.',
    remediation: 'Obtain authorization tokens dynamically at runtime via OAuth/OIDC login flow; never hardcode.',
    cwe: 'CWE-798',
  },
  {
    id: 'SEC-CRED-005',
    name: 'Google API / Gemini API Key pattern',
    category: 'SECRETS',
    severity: 'high',
    pattern: /AIzaSy[0-9A-Za-z-_]{33}/g,
    description: 'Found hardcoded Google API / Firebase / Gemini key. Ensure API key restrictions are strictly configured.',
    remediation: 'Restrict key by HTTP referrer and API service in Google Cloud Console, or route calls through your backend.',
    cwe: 'CWE-798',
  },

  // Insecure Transport / URLs
  {
    id: 'SEC-NET-001',
    name: 'Insecure Cleartext HTTP Protocol in Production Code',
    category: 'SAST',
    severity: 'medium',
    pattern: /['"]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^'"]*['"]/g,
    description: 'Hardcoded plain HTTP URL detected. Cleartext communication is vulnerable to eavesdropping and MITM tampering.',
    remediation: 'Upgrade URL scheme to HTTPS to ensure end-to-end encryption.',
    cwe: 'CWE-319',
  },

  // Dangerous Iframe Sandboxing
  {
    id: 'SEC-DOM-001',
    name: 'Permissive Iframe Sandbox Bypass',
    category: 'SAST',
    severity: 'high',
    pattern: /sandbox\s*=\s*['"][^'"]*allow-scripts[^'"]*allow-same-origin[^'"]*['"]/g,
    description: 'An iframe with both allow-scripts and allow-same-origin can remove its own sandbox attribute and execute arbitrary code.',
    remediation: 'Do not combine allow-scripts and allow-same-origin unless the embedded origin is completely untrusted and isolated.',
    cwe: 'CWE-1021',
  },
];

export class SASTScanner {
  private rules: SASTRule[];
  private excludePatterns: string[];

  constructor(customRules: SASTRule[] = [], excludePatterns: string[] = []) {
    this.rules = [...DEFAULT_SAST_RULES, ...customRules];
    this.excludePatterns = [
      'node_modules',
      'dist',
      'build',
      '.next',
      '.git',
      'coverage',
      'quality-reports',
      ...excludePatterns,
    ];
  }

  public scanDirectory(dirPath: string): VaptRuleResult[] {
    const results: VaptRuleResult[] = [];
    if (!fs.existsSync(dirPath)) return results;

    const files = this.collectFiles(dirPath);
    for (const filePath of files) {
      const fileFindings = this.scanFile(filePath);
      results.push(...fileFindings);
    }

    return results;
  }

  public scanFile(filePath: string): VaptRuleResult[] {
    const results: VaptRuleResult[] = [];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const rule of this.rules) {
        const flags = rule.pattern.flags.includes('g') ? rule.pattern.flags : `${rule.pattern.flags}g`;
        const regex = new RegExp(rule.pattern.source, flags);
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(content)) !== null) {
          const matchIndex = match.index;
          // Calculate line number
          let charCount = 0;
          let lineNumber = 1;
          for (let i = 0; i < lines.length; i++) {
            charCount += lines[i].length + 1; // +1 for \n
            if (charCount > matchIndex) {
              lineNumber = i + 1;
              break;
            }
          }

          const rawSnippet = lines[lineNumber - 1] ? lines[lineNumber - 1].trim() : match[0];
          // Truncate snippet to 140 chars max
          const snippet = rawSnippet.length > 140 ? rawSnippet.substring(0, 137) + '...' : rawSnippet;

          results.push({
            id: rule.id,
            name: rule.name,
            category: rule.category,
            severity: rule.severity,
            description: rule.description,
            filePath,
            lineNumber,
            snippet,
            remediation: rule.remediation,
            cwe: rule.cwe,
          });

          // Prevent infinite loop on zero-width match
          if (regex.lastIndex === matchIndex) {
            regex.lastIndex++;
          }
        }
      }
    } catch {
      // Ignore binary or unreadable files
    }

    return results;
  }

  private collectFiles(dir: string): string[] {
    const fileList: string[] = [];
    const validExtensions = new Set([
      '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
      '.vue', '.svelte', '.html', '.htm', '.json'
    ]);

    const traverse = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (this.excludePatterns.some(pattern => fullPath.includes(pattern))) {
            continue;
          }

          if (entry.isDirectory()) {
            traverse(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (validExtensions.has(ext)) {
              fileList.push(fullPath);
            }
          }
        }
      } catch {
        // Skip inaccessible dirs
      }
    };

    traverse(dir);
    return fileList;
  }
}
