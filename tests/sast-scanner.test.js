import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SASTScanner } from '../dist/modules/vapt/sast-scanner.js';

describe('SAST Security Scanner', () => {
  const scanner = new SASTScanner();

  test('scanner detects secrets and dangerous sinks in sample file', () => {
    const tmpPath = path.join(process.cwd(), 'temp-test-sink.js');
    fs.writeFileSync(tmpPath, `
      const x = 1;
      eval("2 + 2");
      localStorage.setItem("user_token", "secret123");
      const awsKey = "AKIAIOSFODNN7EXAMPLE";
    `);

    try {
      const findings = scanner.scanFile(tmpPath);

      const evalFinding = findings.find(f => f.id === 'SEC-XSS-003');
      const tokenFinding = findings.find(f => f.id === 'SEC-STOR-001');
      const awsFinding = findings.find(f => f.id === 'SEC-CRED-001');

      assert.ok(evalFinding, 'Should detect eval()');
      assert.ok(tokenFinding, 'Should detect token in localStorage');
      assert.ok(awsFinding, 'Should detect AWS Key');
    } finally {
      if (fs.existsSync(tmpPath)) {
        fs.unlinkSync(tmpPath);
      }
    }
  });
});
