import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ConsoleMessageCategorizer } from '../dist/modules/console-monitor/categorizer.js';

describe('Console Message Categorizer', () => {
  test('categorizes React unique key prop warning', () => {
    const raw = 'Warning: Each child in a list should have a unique "key" prop.';
    const result = ConsoleMessageCategorizer.categorize(raw, 'warn');

    assert.equal(result.category, 'react');
    assert.equal(result.severity, 'medium');
    assert.ok(result.remediation.includes('key'));
  });

  test('categorizes Vue direct prop mutation warning', () => {
    const raw = 'Avoid mutating a prop directly since the value will be overwritten.';
    const result = ConsoleMessageCategorizer.categorize(raw, 'warn');

    assert.equal(result.category, 'vue');
    assert.equal(result.severity, 'medium');
  });

  test('categorizes Angular change detection error', () => {
    const raw = 'ERROR Error: NG0100: ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked.';
    const result = ConsoleMessageCategorizer.categorize(raw, 'error');

    assert.equal(result.category, 'angular');
    assert.equal(result.severity, 'high');
  });

  test('aggregates recurring console messages correctly', () => {
    const messages = [
      { id: '1', type: 'error', category: 'runtime', severity: 'high', message: 'TypeError: Cannot read property of undefined', remediation: '', occurrences: 1 },
      { id: '2', type: 'error', category: 'runtime', severity: 'high', message: 'TypeError: Cannot read property of undefined', remediation: '', occurrences: 1 },
      { id: '3', type: 'warn', category: 'react', severity: 'medium', message: 'Missing key prop', remediation: '', occurrences: 1 },
    ];

    const aggregated = ConsoleMessageCategorizer.aggregateMessages(messages);
    assert.equal(aggregated.length, 2);
    const typeError = aggregated.find(m => m.type === 'error');
    assert.equal(typeError?.occurrences, 2);
  });
});

