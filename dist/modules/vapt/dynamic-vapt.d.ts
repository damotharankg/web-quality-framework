import { VaptRuleResult } from '../../config/types.js';
export declare class DynamicVaptScanner {
    /**
     * Evaluates client-side DOM and Storage security checks using DOM structure or in-browser evaluation script.
     */
    getBrowserEvaluationScript(): string;
    /**
     * Static analysis of HTML contents for DOM-level security checks when headless browser is not active.
     */
    analyzeHtmlContent(html: string, pageUrl?: string): VaptRuleResult[];
}
//# sourceMappingURL=dynamic-vapt.d.ts.map