import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { E2EJourney, E2EJourneyResult, E2EViewport, ConsoleMessageItem } from '../../config/types.js';

export class E2ERunner {
  private baseUrl: string;
  private timeout: number;
  private screenshotDir: string;
  private hasPlaywright: boolean = false;
  private playwrightModule: any = null;

  constructor(baseUrl: string, timeout: number = 30000, screenshotDir: string = './quality-reports/screenshots') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
    this.screenshotDir = screenshotDir;
    this.detectPlaywright();
  }

  private detectPlaywright() {
    try {
      // Dynamic require check without hard dependency
      // @ts-ignore
      import('playwright').then((pw) => {
        this.playwrightModule = pw;
        this.hasPlaywright = true;
      }).catch(() => {
        this.hasPlaywright = false;
      });
    } catch {
      this.hasPlaywright = false;
    }
  }

  public async runJourney(
    journey: E2EJourney,
    viewport: E2EViewport,
    onConsoleMessage?: (msg: ConsoleMessageItem) => void
  ): Promise<E2EJourneyResult> {
    const startTime = Date.now();

    // Try Playwright execution if available
    if (this.hasPlaywright && this.playwrightModule) {
      return this.runWithPlaywright(journey, viewport, onConsoleMessage);
    }

    // Default universal lightweight runner
    return this.runWithLightweightRunner(journey, viewport);
  }

  private async runWithPlaywright(
    journey: E2EJourney,
    viewport: E2EViewport,
    onConsoleMessage?: (msg: ConsoleMessageItem) => void
  ): Promise<E2EJourneyResult> {
    const startTime = Date.now();
    let stepsPassed = 0;
    const chromium = this.playwrightModule.chromium;
    let browser: any;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
      });
      const page = await context.newPage();

      // Hook console messages
      page.on('console', (msg: any) => {
        if (onConsoleMessage && (msg.type() === 'error' || msg.type() === 'warning')) {
          onConsoleMessage({
            id: `CONSOLE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: msg.type() === 'error' ? 'error' : 'warn',
            category: 'runtime',
            severity: msg.type() === 'error' ? 'high' : 'medium',
            message: msg.text(),
            remediation: 'Investigate browser console error source.',
            occurrences: 1,
          });
        }
      });

      // 1. Initial navigation
      const initialUrl = journey.startUrl.startsWith('http')
        ? journey.startUrl
        : `${this.baseUrl}${journey.startUrl.startsWith('/') ? '' : '/'}${journey.startUrl}`;

      await page.goto(initialUrl, { timeout: this.timeout, waitUntil: 'domcontentloaded' });
      stepsPassed++;

      // 2. Execute journey actions
      for (const action of journey.actions) {
        if (action.type === 'navigate' && action.value) {
          const nextUrl = action.value.startsWith('http') ? action.value : `${this.baseUrl}${action.value}`;
          await page.goto(nextUrl, { timeout: action.timeout || this.timeout, waitUntil: 'domcontentloaded' });
        } else if (action.type === 'click' && action.selector) {
          await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
          await page.click(action.selector);
        } else if (action.type === 'fill' && action.selector && action.value) {
          await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
          await page.fill(action.selector, action.value);
        } else if (action.type === 'assertText' && action.selector && action.value) {
          await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
          const text = await page.innerText(action.selector);
          if (!text.includes(action.value)) {
            throw new Error(`Expected text "${action.value}" in "${action.selector}", got "${text}"`);
          }
        } else if (action.type === 'assertVisible' && action.selector) {
          await page.waitForSelector(action.selector, { state: 'visible', timeout: action.timeout || 5000 });
        } else if (action.type === 'wait') {
          await page.waitForTimeout(action.timeout || 1000);
        }
        stepsPassed++;
      }

      await browser.close();

      return {
        name: journey.name,
        success: true,
        durationMs: Date.now() - startTime,
        stepsPassed,
        stepsTotal: journey.actions.length + 1,
        viewport: viewport.name,
      };
    } catch (err: any) {
      if (browser) await browser.close().catch(() => {});

      return {
        name: journey.name,
        success: false,
        durationMs: Date.now() - startTime,
        stepsPassed,
        stepsTotal: journey.actions.length + 1,
        failedStep: {
          action: journey.actions[stepsPassed - 1] || { type: 'navigate', value: journey.startUrl },
          error: err.message,
        },
        viewport: viewport.name,
      };
    }
  }

  private async runWithLightweightRunner(journey: E2EJourney, viewport: E2EViewport): Promise<E2EJourneyResult> {
    const startTime = Date.now();
    let stepsPassed = 0;
    const initialUrl = journey.startUrl.startsWith('http')
      ? journey.startUrl
      : `${this.baseUrl}${journey.startUrl.startsWith('/') ? '' : '/'}${journey.startUrl}`;

    try {
      let currentHtml = await this.fetchHtml(initialUrl);
      stepsPassed++;

      for (const action of journey.actions) {
        if (action.type === 'navigate' && action.value) {
          const nextUrl = action.value.startsWith('http') ? action.value : `${this.baseUrl}${action.value}`;
          currentHtml = await this.fetchHtml(nextUrl);
        } else if (action.type === 'assertText' && action.value) {
          if (!currentHtml.includes(action.value)) {
            throw new Error(`Text assertion failed: Expected HTML to contain "${action.value}"`);
          }
        } else if (action.type === 'assertVisible' && action.selector) {
          // Check if selector element tag/id/class is present in HTML
          const matches = this.checkSelectorInHtml(currentHtml, action.selector);
          if (!matches) {
            throw new Error(`Element assertion failed: Selector "${action.selector}" not found in page HTML`);
          }
        }
        stepsPassed++;
      }

      return {
        name: journey.name,
        success: true,
        durationMs: Date.now() - startTime,
        stepsPassed,
        stepsTotal: journey.actions.length + 1,
        viewport: viewport.name,
      };
    } catch (err: any) {
      return {
        name: journey.name,
        success: false,
        durationMs: Date.now() - startTime,
        stepsPassed,
        stepsTotal: journey.actions.length + 1,
        failedStep: {
          action: journey.actions[stepsPassed - 1] || { type: 'navigate', value: journey.startUrl },
          error: err.message,
        },
        viewport: viewport.name,
      };
    }
  }

  private checkSelectorInHtml(html: string, selector: string): boolean {
    if (selector.startsWith('#')) {
      const id = selector.substring(1);
      return new RegExp(`id=["']${id}["']`, 'i').test(html);
    }
    if (selector.startsWith('.')) {
      const className = selector.substring(1);
      return new RegExp(`class=["'][^"']*\\b${className}\\b[^"']*["']`, 'i').test(html);
    }
    // Tag name selector
    const tag = selector.split(/[\s.#\[]/)[0];
    if (tag) {
      return new RegExp(`<${tag}\\b`, 'i').test(html);
    }
    return true;
  }

  private fetchHtml(targetUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const parsed = new URL(targetUrl);
        const client = parsed.protocol === 'https:' ? https : http;

        const req = client.get(
          parsed,
          {
            timeout: this.timeout,
            headers: {
              'User-Agent': 'WebQualityFramework/1.0 (E2E-Runner)',
              'Accept': 'text/html,application/xhtml+xml',
            },
          },
          (res) => {
            if (res.statusCode && (res.statusCode >= 400)) {
              reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage} loading ${targetUrl}`));
              return;
            }
            let data = '';
            res.setEncoding('utf-8');
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve(data));
          }
        );

        req.on('timeout', () => {
          req.destroy(new Error(`Timeout after ${this.timeout}ms loading ${targetUrl}`));
        });

        req.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }
}

