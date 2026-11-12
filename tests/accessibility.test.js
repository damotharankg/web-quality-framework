import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AccessibilityAuditor } from '../dist/modules/frontend-quality/accessibility.js';

describe('Accessibility Auditor', () => {
  const auditor = new AccessibilityAuditor();

  test('flags images without alt attribute', () => {
    const html = '<div><img src="banner.jpg"></div>';
    const issues = auditor.auditHtml(html);

    const altIssue = issues.find(i => i.rule === 'image-alt');
    assert.ok(altIssue, 'Should flag missing alt attribute');
  });

  test('flags inputs without labels', () => {
    const html = '<form><input type="text" name="username"></form>';
    const issues = auditor.auditHtml(html);

    const labelIssue = issues.find(i => i.rule === 'label-title-only');
    assert.ok(labelIssue, 'Should flag input without label');
  });

  test('passes valid accessible markup', () => {
    const html = `
      <html lang="en">
        <body>
          <img src="logo.png" alt="Company Logo">
          <label for="user">Username</label>
          <input type="text" id="user" name="user">
          <button type="submit">Submit Form</button>
        </body>
      </html>
    `;
    const issues = auditor.auditHtml(html);
    assert.equal(issues.length, 0, 'Clean markup should produce 0 accessibility issues');
  });
});

