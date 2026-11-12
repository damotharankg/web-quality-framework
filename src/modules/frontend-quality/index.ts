import fs from 'node:fs';
import path from 'node:path';
import {
  QualityConfig,
  AccessibilityIssue,
  PerformanceMetrics,
  ResponsiveIssue,
} from '../../config/types.js';
import { AccessibilityAuditor } from './accessibility.js';
import { ResponsivenessAuditor } from './responsiveness.js';
import { PerformanceAuditor } from './performance.js';
import { CrawledPage } from '../e2e/auto-crawler.js';

export interface FrontendQualityModuleResult {
  score: number;
  passed: boolean;
  accessibilityIssues: AccessibilityIssue[];
  performanceMetrics: PerformanceMetrics;
  responsiveIssues: ResponsiveIssue[];
  brokenAssets: Array<{ type: 'link' | 'image'; url: string; status: number; parentPage: string }>;
  summary: {
    accessibilityErrors: number;
    responsiveIssuesCount: number;
    brokenAssetsCount: number;
  };
}

export class FrontendQualityModule {
  private config: QualityConfig;
  private a11yAuditor: AccessibilityAuditor;
  private respAuditor: ResponsivenessAuditor;
  private perfAuditor: PerformanceAuditor;

  constructor(config: QualityConfig) {
    this.config = config;
    this.a11yAuditor = new AccessibilityAuditor();
    this.respAuditor = new ResponsivenessAuditor();
    this.perfAuditor = new PerformanceAuditor();
  }

  public async evaluate(pages: CrawledPage[] = []): Promise<FrontendQualityModuleResult> {
    const accessibilityIssues: AccessibilityIssue[] = [];
    const responsiveIssues: ResponsiveIssue[] = [];
    const brokenAssets: Array<{ type: 'link' | 'image'; url: string; status: number; parentPage: string }> = [];
    let performanceMetrics: PerformanceMetrics = {
      fcp: 0,
      lcp: 0,
      cls: 0,
      ttfb: 0,
      domNodesCount: 0,
      resourceCount: 0,
    };

    // If pages are provided via crawler
    if (pages.length > 0) {
      for (const page of pages) {
        if (page.html) {
          // A11y
          if (this.config.frontendQuality.accessibility.enabled) {
            const a11y = this.a11yAuditor.auditHtml(page.html, page.url);
            accessibilityIssues.push(...a11y);
          }

          // Responsiveness
          if (this.config.frontendQuality.responsiveness.enabled) {
            const resp = this.respAuditor.auditHtml(page.html, page.url);
            responsiveIssues.push(...resp.issues);
          }

          // Performance from the first/primary page
          if (page.url === pages[0].url) {
            performanceMetrics = this.perfAuditor.analyzeHtmlMetrics(page.html, page.loadTimeMs);
          }
        }
      }
    } else {
      // Fallback: check index.html or source templates on disk
      const possibleIndexHtml = [
        path.join(this.config.project.rootDir, 'index.html'),
        path.join(this.config.project.rootDir, 'public', 'index.html'),
        path.join(this.config.project.rootDir, 'src', 'index.html'),
      ];

      for (const candidate of possibleIndexHtml) {
        if (fs.existsSync(candidate)) {
          const html = fs.readFileSync(candidate, 'utf-8');
          const a11y = this.a11yAuditor.auditHtml(html, candidate);
          accessibilityIssues.push(...a11y);

          const resp = this.respAuditor.auditHtml(html, candidate);
          responsiveIssues.push(...resp.issues);

          performanceMetrics = this.perfAuditor.analyzeHtmlMetrics(html, 300);
          break;
        }
      }
    }

    // Score computation: Base 100
    // Accessibility issues: -5 for high, -2 for medium, -1 for low
    const a11yPenalty = accessibilityIssues.reduce((sum, issue) => {
      if (issue.severity === 'high') return sum + 5;
      if (issue.severity === 'medium') return sum + 2;
      return sum + 1;
    }, 0);

    const responsivePenalty = responsiveIssues.length * 5;
    const brokenPenalty = brokenAssets.length * 10;

    const totalDeductions = Math.min(80, a11yPenalty + responsivePenalty + brokenPenalty);
    const score = Math.max(0, 100 - totalDeductions);

    const summary = {
      accessibilityErrors: accessibilityIssues.length,
      responsiveIssuesCount: responsiveIssues.length,
      brokenAssetsCount: brokenAssets.length,
    };

    const passed = score >= 70;

    return {
      score,
      passed,
      accessibilityIssues,
      performanceMetrics,
      responsiveIssues,
      brokenAssets,
      summary,
    };
  }
}

