import { ConsolidatedQualityReport } from '../config/types.js';

export class HtmlReportGenerator {
  public static generate(report: ConsolidatedQualityReport): string {
    const { summary, vaptResults, e2eResults, consoleResults, dependencyResults, frontendQualityResults } = report;

    const gradeColor = {
      'A+': '#10b981',
      'A': '#22c55e',
      'B': '#3b82f6',
      'C': '#f59e0b',
      'D': '#f97316',
      'F': '#ef4444',
    }[summary.grade];

    const escapeHtml = (str: string = '') =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Quality Report - ${escapeHtml(report.config.project.name)}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --info: #06b6d4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px;
    }
    .container { max-width: 1300px; margin: 0 auto; }
    header {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .header-left h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 12px; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-framework { background: #312e81; color: #c7d2fe; }
    .badge-pass { background: #064e3b; color: #a7f3d0; }
    .badge-fail { background: #7f1d1d; color: #fecaca; }
    .header-meta { font-size: 13px; color: var(--text-muted); margin-top: 6px; }

    .header-right { display: flex; align-items: center; gap: 20px; }
    .score-circle {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      border: 6px solid ${gradeColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #0f172a;
    }
    .score-val { font-size: 26px; font-weight: 800; line-height: 1; }
    .score-grade { font-size: 11px; font-weight: 700; color: ${gradeColor}; text-transform: uppercase; }

    /* Pillar Summary Grid */
    .pillar-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .pillar-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px;
      transition: transform 0.2s, border-color 0.2s;
    }
    .pillar-card:hover { transform: translateY(-2px); border-color: var(--accent); }
    .pillar-title { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
    .pillar-score-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 8px; }
    .pillar-score { font-size: 28px; font-weight: 700; }
    .pillar-status { font-size: 12px; font-weight: 600; }

    /* Navigation Tabs */
    .tabs {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--border);
      margin-bottom: 24px;
      overflow-x: auto;
    }
    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      padding: 12px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    /* Tab Content Panes */
    .tab-pane { display: none; }
    .tab-pane.active { display: block; }

    /* Cards & Lists */
    .section-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .section-card h2 { font-size: 18px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
    
    .issue-item {
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
    }
    .issue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .issue-title { font-size: 15px; font-weight: 600; }
    .sev-critical { background: #7f1d1d; color: #fecaca; }
    .sev-high { background: #831843; color: #fbcfe8; }
    .sev-medium { background: #78350f; color: #fef3c7; }
    .sev-low { background: #14532d; color: #bbf7d0; }
    .sev-info { background: #1e3a8a; color: #bfdbfe; }

    .issue-desc { font-size: 14px; color: var(--text-muted); margin-bottom: 8px; }
    .code-box {
      background: #020617;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 12px;
      color: #38bdf8;
      overflow-x: auto;
      margin-top: 8px;
    }
    .remediation-box {
      background: #064e3b;
      color: #a7f3d0;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      margin-top: 8px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    /* Table styles */
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
    th { color: var(--text-muted); font-size: 12px; text-transform: uppercase; }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }

    .badge-safe { background: #064e3b; color: #6ee7b7; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .badge-major { background: #7f1d1d; color: #fca5a5; padding: 2px 6px; border-radius: 4px; font-size: 11px; }

    .metric-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
    .metric-box { background: #0f172a; padding: 14px; border-radius: 8px; flex: 1; min-width: 140px; }
    .metric-val { font-size: 22px; font-weight: 700; color: var(--accent); }
    .metric-lbl { font-size: 12px; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-left">
        <h1>
          ${escapeHtml(report.config.project.name)}
          <span class="badge badge-framework">${summary.frameworkDetected}</span>
          <span class="badge ${summary.passed ? 'badge-pass' : 'badge-fail'}">
            ${summary.passed ? 'QUALITY GATE PASSED' : 'QUALITY GATE FAILED'}
          </span>
        </h1>
        <div class="header-meta">
          Scanned at ${summary.timestamp} • Duration: ${(summary.executionTimeMs / 1000).toFixed(2)}s • Config: ${escapeHtml(report.config.project.rootDir)}
        </div>
      </div>
      <div class="header-right">
        <div class="score-circle">
          <div class="score-val">${summary.overallScore}</div>
          <div class="score-grade">GRADE ${summary.grade}</div>
        </div>
      </div>
    </header>

    <!-- 5 Pillars Overview Grid -->
    <div class="pillar-grid">
      <div class="pillar-card">
        <div class="pillar-title">1. VAPT & Security</div>
        <div class="pillar-score-row">
          <div class="pillar-score" style="color: ${vaptResults.score >= 80 ? 'var(--success)' : 'var(--danger)'}">
            ${vaptResults.score}
          </div>
          <div class="pillar-status">${vaptResults.findings.length} findings</div>
        </div>
      </div>
      <div class="pillar-card">
        <div class="pillar-title">2. E2E Journeys</div>
        <div class="pillar-score-row">
          <div class="pillar-score" style="color: ${e2eResults.score >= 80 ? 'var(--success)' : 'var(--danger)'}">
            ${e2eResults.score}
          </div>
          <div class="pillar-status">${e2eResults.passedJourneys}/${e2eResults.totalJourneys} passed</div>
        </div>
      </div>
      <div class="pillar-card">
        <div class="pillar-title">3. Console Cleanup</div>
        <div class="pillar-score-row">
          <div class="pillar-score" style="color: ${consoleResults.score >= 80 ? 'var(--success)' : 'var(--danger)'}">
            ${consoleResults.score}
          </div>
          <div class="pillar-status">${consoleResults.totalErrors} err, ${consoleResults.totalWarnings} warn</div>
        </div>
      </div>
      <div class="pillar-card">
        <div class="pillar-title">4. Dependencies</div>
        <div class="pillar-score-row">
          <div class="pillar-score" style="color: ${dependencyResults.summary.critical === 0 ? 'var(--success)' : 'var(--danger)'}">
            ${100 - (dependencyResults.summary.critical * 25 + dependencyResults.summary.high * 15)}
          </div>
          <div class="pillar-status">${dependencyResults.vulnerabilities.length} CVEs, ${dependencyResults.outdatedPackages.length} outdated</div>
        </div>
      </div>
      <div class="pillar-card">
        <div class="pillar-title">5. Frontend Quality</div>
        <div class="pillar-score-row">
          <div class="pillar-score" style="color: ${frontendQualityResults.score >= 80 ? 'var(--success)' : 'var(--danger)'}">
            ${frontendQualityResults.score}
          </div>
          <div class="pillar-status">${frontendQualityResults.accessibilityIssues.length} a11y issues</div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('tab-vapt')">1. VAPT Security (${vaptResults.findings.length})</button>
      <button class="tab-btn" onclick="switchTab('tab-e2e')">2. E2E Workflows (${e2eResults.totalJourneys})</button>
      <button class="tab-btn" onclick="switchTab('tab-console')">3. Console Health (${consoleResults.messages.length})</button>
      <button class="tab-btn" onclick="switchTab('tab-deps')">4. Dependency Audit (${dependencyResults.vulnerabilities.length})</button>
      <button class="tab-btn" onclick="switchTab('tab-ui')">5. Frontend Quality (${frontendQualityResults.accessibilityIssues.length})</button>
    </div>

    <!-- Tab 1: VAPT & Security -->
    <div id="tab-vapt" class="tab-pane active">
      <div class="section-card">
        <h2>Security Assessment & SAST Findings</h2>
        ${vaptResults.findings.length === 0 ? '<p style="color: var(--success);">✓ No high or critical security vulnerabilities detected.</p>' : ''}
        ${vaptResults.findings.map(f => `
          <div class="issue-item">
            <div class="issue-header">
              <span class="issue-title">${escapeHtml(f.name)} ${f.cwe ? `<span style="font-size:12px; color:var(--text-muted);">[${f.cwe}]</span>` : ''}</span>
              <span class="badge sev-${f.severity}">${f.severity}</span>
            </div>
            <div class="issue-desc">${escapeHtml(f.description)}</div>
            ${f.filePath ? `<div style="font-size:12px; color:var(--accent);">File: ${escapeHtml(f.filePath)}${f.lineNumber ? `:${f.lineNumber}` : ''}</div>` : ''}
            ${f.snippet ? `<div class="code-box">${escapeHtml(f.snippet)}</div>` : ''}
            <div class="remediation-box">
              <strong>Remediation:</strong> ${escapeHtml(f.remediation)}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="section-card">
        <h2>HTTP Security Headers Audit</h2>
        <table>
          <thead>
            <tr><th>Header</th><th>Status</th><th>Evaluated Value / Details</th><th>Recommended Remediation</th></tr>
          </thead>
          <tbody>
            ${Object.entries(vaptResults.headersAudit).map(([header, item]) => `
              <tr>
                <td><strong>${escapeHtml(header)}</strong></td>
                <td><span class="badge ${item.status === 'pass' ? 'badge-pass' : (item.status === 'warn' ? 'sev-medium' : 'badge-fail')}">${item.status}</span></td>
                <td>${escapeHtml(item.value || item.message)}</td>
                <td style="font-size:12px; color:var(--text-muted);">${escapeHtml(item.remediation)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: E2E Automation Testing -->
    <div id="tab-e2e" class="tab-pane">
      <div class="section-card">
        <h2>Automated User Journeys</h2>
        <div class="metric-row">
          <div class="metric-box"><div class="metric-val">${e2eResults.totalJourneys}</div><div class="metric-lbl">Total Executed</div></div>
          <div class="metric-box"><div class="metric-val" style="color:var(--success);">${e2eResults.passedJourneys}</div><div class="metric-lbl">Passed</div></div>
          <div class="metric-box"><div class="metric-val" style="color:var(--danger);">${e2eResults.failedJourneys}</div><div class="metric-lbl">Failed</div></div>
        </div>
        <table>
          <thead>
            <tr><th>Journey Name</th><th>Viewport</th><th>Duration</th><th>Steps</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${e2eResults.results.map(r => `
              <tr>
                <td><strong>${escapeHtml(r.name)}</strong></td>
                <td>${escapeHtml(r.viewport)}</td>
                <td>${r.durationMs}ms</td>
                <td>${r.stepsPassed} / ${r.stepsTotal}</td>
                <td><span class="badge ${r.success ? 'badge-pass' : 'badge-fail'}">${r.success ? 'PASSED' : 'FAILED'}</span></td>
              </tr>
              ${r.failedStep ? `
                <tr>
                  <td colspan="5" style="background:#1e1b4b; padding:10px 16px;">
                    <strong style="color:#f87171;">Failed Step:</strong> ${escapeHtml(r.failedStep.action.type)} (${escapeHtml(r.failedStep.action.value || r.failedStep.action.selector || '')}) - ${escapeHtml(r.failedStep.error)}
                  </td>
                </tr>
              ` : ''}
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 3: Browser Console Cleanup -->
    <div id="tab-console" class="tab-pane">
      <div class="section-card">
        <h2>Console Warnings, Errors & Cleanup Guide</h2>
        ${consoleResults.messages.length === 0 ? '<p style="color:var(--success);">✓ Clean console! No runtime errors or warnings detected.</p>' : ''}
        ${consoleResults.messages.map(m => `
          <div class="issue-item">
            <div class="issue-header">
              <span class="issue-title">
                <span class="badge badge-framework">${m.category}</span>
                ${escapeHtml(m.message.substring(0, 100))}
              </span>
              <span class="badge sev-${m.severity}">Occurrences: ${m.occurrences}</span>
            </div>
            ${m.sourceUrl ? `<div style="font-size:12px; color:var(--accent);">Source: ${escapeHtml(m.sourceUrl)}${m.lineNumber ? `:${m.lineNumber}` : ''}</div>` : ''}
            ${m.frameworkNote ? `<div style="font-size:12px; color:#a5b4fc; margin-top:4px;">💡 ${escapeHtml(m.frameworkNote)}</div>` : ''}
            <div class="remediation-box">
              <strong>Fix:</strong> ${escapeHtml(m.remediation)}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Tab 4: Package and Dependency Audit -->
    <div id="tab-deps" class="tab-pane">
      <div class="section-card">
        <h2>Vulnerability Scanning & Automated Updates</h2>
        ${dependencyResults.vulnerabilities.length === 0 ? '<p style="color:var(--success);">✓ Zero CVE vulnerabilities reported by package audit.</p>' : ''}
        ${dependencyResults.vulnerabilities.map(v => `
          <div class="issue-item">
            <div class="issue-header">
              <span class="issue-title"><strong>${escapeHtml(v.packageName)}</strong>: ${escapeHtml(v.title)}</span>
              <span class="badge sev-${v.severity}">${v.severity}</span>
            </div>
            <div class="issue-desc">Installed Range: ${escapeHtml(v.installedVersion)} • Patched In: ${escapeHtml(v.patchedVersions || 'N/A')}</div>
            <div class="remediation-box"><strong>Remediation:</strong> ${escapeHtml(v.recommendation)}</div>
          </div>
        `).join('')}
      </div>

      <div class="section-card">
        <h2>Outdated Packages & Non-Breaking Update Guide</h2>
        <div style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">
          Safe minor/patch updates are non-breaking. Major updates require functional regression testing.
        </div>
        <table>
          <thead>
            <tr><th>Package</th><th>Current</th><th>Wanted (Safe)</th><th>Latest</th><th>Type</th></tr>
          </thead>
          <tbody>
            ${dependencyResults.outdatedPackages.map(p => `
              <tr>
                <td><strong>${escapeHtml(p.packageName)}</strong></td>
                <td>${escapeHtml(p.current)}</td>
                <td>${escapeHtml(p.wanted)}</td>
                <td>${escapeHtml(p.latest)}</td>
                <td><span class="${p.isSafeToUpdate ? 'badge-safe' : 'badge-major'}">${p.updateType}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 5: Frontend Quality Check -->
    <div id="tab-ui" class="tab-pane">
      <div class="section-card">
        <h2>Accessibility (WCAG 2.1) & UI Consistency</h2>
        ${frontendQualityResults.accessibilityIssues.length === 0 ? '<p style="color:var(--success);">✓ No automated accessibility violations detected.</p>' : ''}
        ${frontendQualityResults.accessibilityIssues.map(a => `
          <div class="issue-item">
            <div class="issue-header">
              <span class="issue-title">${escapeHtml(a.rule)} (${a.wcagTags.join(', ')})</span>
              <span class="badge sev-${a.severity}">${a.severity}</span>
            </div>
            <div class="issue-desc">${escapeHtml(a.description)}</div>
            ${a.elementHtml ? `<div class="code-box">${escapeHtml(a.elementHtml)}</div>` : ''}
            <div class="remediation-box"><strong>Remediation:</strong> ${escapeHtml(a.remediation)}</div>
          </div>
        `).join('')}
      </div>

      <div class="section-card">
        <h2>Performance & Web Vitals Benchmarks</h2>
        <div class="metric-row">
          <div class="metric-box"><div class="metric-val">${frontendQualityResults.performanceMetrics.fcp || 0}ms</div><div class="metric-lbl">First Contentful Paint (FCP)</div></div>
          <div class="metric-box"><div class="metric-val">${frontendQualityResults.performanceMetrics.lcp || 0}ms</div><div class="metric-lbl">Largest Contentful Paint (LCP)</div></div>
          <div class="metric-box"><div class="metric-val">${frontendQualityResults.performanceMetrics.cls || 0}</div><div class="metric-lbl">Cumulative Layout Shift (CLS)</div></div>
          <div class="metric-box"><div class="metric-val">${frontendQualityResults.performanceMetrics.domNodesCount || 0}</div><div class="metric-lbl">DOM Nodes Count</div></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function switchTab(tabId) {
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
      event.target.classList.add('active');
    }
  </script>
</body>
</html>`;
  }
}

