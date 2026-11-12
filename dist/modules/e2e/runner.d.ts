import { E2EJourney, E2EJourneyResult, E2EViewport, ConsoleMessageItem } from '../../config/types.js';
export declare class E2ERunner {
    private baseUrl;
    private timeout;
    private screenshotDir;
    private hasPlaywright;
    private playwrightModule;
    constructor(baseUrl: string, timeout?: number, screenshotDir?: string);
    private detectPlaywright;
    runJourney(journey: E2EJourney, viewport: E2EViewport, onConsoleMessage?: (msg: ConsoleMessageItem) => void): Promise<E2EJourneyResult>;
    private runWithPlaywright;
    private runWithLightweightRunner;
    private checkSelectorInHtml;
    private fetchHtml;
}
//# sourceMappingURL=runner.d.ts.map