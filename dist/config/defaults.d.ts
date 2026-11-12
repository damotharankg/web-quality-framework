import { QualityConfig, FrontendFramework } from './types.js';
export declare function detectFramework(projectRoot: string): FrontendFramework;
export declare function getDefaultConfig(rootDir?: string, overrides?: Partial<QualityConfig>): QualityConfig;
export declare function loadConfig(configPath?: string, cwd?: string): Promise<QualityConfig>;
//# sourceMappingURL=defaults.d.ts.map