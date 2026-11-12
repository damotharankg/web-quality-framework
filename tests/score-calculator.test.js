import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ScoreCalculator } from '../dist/reporter/score-calculator.js';

describe('Score Calculator', () => {
  test('calculates correct weighted overall score and grade A+', () => {
    const scores = {
      vapt: 100,
      e2e: 100,
      console: 100,
      dependencies: 100,
      frontendQuality: 100,
    };
    const issueCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    const summary = ScoreCalculator.calculate(scores, issueCounts, 'react', 80, Date.now());

    assert.equal(summary.overallScore, 100);
    assert.equal(summary.grade, 'A+');
    assert.equal(summary.passed, true);
  });

  test('fails quality gate if critical issues are present even with high score', () => {
    const scores = {
      vapt: 90,
      e2e: 95,
      console: 90,
      dependencies: 90,
      frontendQuality: 90,
    };
    const issueCounts = { critical: 1, high: 0, medium: 0, low: 0 };
    const summary = ScoreCalculator.calculate(scores, issueCounts, 'react', 80, Date.now());

    assert.equal(summary.passed, false, 'Should fail gate when critical issues exist');
  });
});

