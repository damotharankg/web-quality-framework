import { QualityReportSummary, FrontendFramework } from '../config/types.js';

export interface ModuleScores {
  vapt: number;
  e2e: number;
  console: number;
  dependencies: number;
  frontendQuality: number;
}

export class ScoreCalculator {
  public static calculate(
    scores: ModuleScores,
    issueCounts: { critical: number; high: number; medium: number; low: number },
    framework: FrontendFramework,
    minOverallScore: number = 80,
    startTime: number
  ): QualityReportSummary {
    // Weighted average:
    // VAPT: 25%, E2E: 25%, Console: 15%, Dependencies: 15%, Frontend Quality: 20%
    const weightedScore = Math.round(
      (scores.vapt * 0.25) +
      (scores.e2e * 0.25) +
      (scores.console * 0.15) +
      (scores.dependencies * 0.15) +
      (scores.frontendQuality * 0.20)
    );

    const overallScore = Math.min(100, Math.max(0, weightedScore));

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 95) grade = 'A+';
    else if (overallScore >= 90) grade = 'A';
    else if (overallScore >= 80) grade = 'B';
    else if (overallScore >= 70) grade = 'C';
    else if (overallScore >= 60) grade = 'D';
    else grade = 'F';

    // Gate passes if overallScore >= minOverallScore AND no critical security/runtime issues
    const passed = overallScore >= minOverallScore && issueCounts.critical === 0;

    return {
      overallScore,
      grade,
      passed,
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      frameworkDetected: framework,
      scores,
      issueCounts,
    };
  }
}

