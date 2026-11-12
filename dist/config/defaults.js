import fs from 'node:fs';
import path from 'node:path';
export function detectFramework(projectRoot) {
    const pkgPath = path.join(projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) {
        return 'vanilla';
    }
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const allDeps = {
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
        };
        if (allDeps['next'])
            return 'nextjs';
        if (allDeps['react'] || allDeps['react-dom'])
            return 'react';
        if (allDeps['vue'] || allDeps['nuxt'])
            return 'vue';
        if (allDeps['@angular/core'])
            return 'angular';
        return 'vanilla';
    }
    catch {
        return 'vanilla';
    }
}
export function getDefaultConfig(rootDir = process.cwd(), overrides = {}) {
    const framework = overrides.project?.framework && overrides.project.framework !== 'auto'
        ? overrides.project.framework
        : detectFramework(rootDir);
    const defaultViewports = [
        { name: 'Desktop', width: 1920, height: 1080 },
        { name: 'Laptop', width: 1366, height: 768 },
        { name: 'Tablet', width: 768, height: 1024, isMobile: true },
        { name: 'Mobile', width: 375, height: 812, isMobile: true },
    ];
    return {
        project: {
            name: overrides.project?.name || path.basename(rootDir) || 'Web Application',
            framework,
            rootDir,
            srcDir: overrides.project?.srcDir || (fs.existsSync(path.join(rootDir, 'src')) ? 'src' : '.'),
            distDir: overrides.project?.distDir || (fs.existsSync(path.join(rootDir, 'dist')) ? 'dist' : 'build'),
            ...overrides.project,
        },
        server: {
            url: overrides.server?.url || 'http://localhost:3000',
            startCommand: overrides.server?.startCommand,
            readyTimeout: overrides.server?.readyTimeout || 30000,
            ...overrides.server,
        },
        vapt: {
            enabled: true,
            sast: {
                enabled: true,
                includePatterns: ['**/*.{js,jsx,ts,tsx,vue,html}'],
                excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.git/**'],
                scanSecrets: true,
                scanDangerousSinks: true,
            },
            headers: {
                enabled: true,
                enforceCSP: true,
                enforceHSTS: true,
                enforceXFrame: true,
                enforceContentTypeOptions: true,
                enforceReferrerPolicy: true,
                enforcePermissionsPolicy: false,
                checkCors: true,
            },
            dynamic: {
                enabled: true,
                checkStorageSecrets: true,
                checkGlobalWindowLeaks: true,
                checkMixedContent: true,
                checkDomXssSinks: true,
            },
            thresholds: {
                failOnCritical: true,
                failOnHigh: false,
                maxCriticalCount: 0,
                maxHighCount: 5,
            },
            ...overrides.vapt,
        },
        e2e: {
            enabled: true,
            baseUrl: overrides.e2e?.baseUrl || overrides.server?.url || 'http://localhost:3000',
            headless: true,
            timeout: 30000,
            viewports: defaultViewports,
            journeys: overrides.e2e?.journeys || [],
            autoCrawl: {
                enabled: true,
                maxDepth: 2,
                maxPages: 10,
                routes: ['/'],
                ignorePatterns: ['/logout', '/api/**', '.*\\.pdf$'],
            },
            screenshotOnFailure: true,
            ...overrides.e2e,
        },
        consoleMonitor: {
            enabled: true,
            failOnError: true,
            failOnWarning: false,
            maxErrorsAllowed: 0,
            maxWarningsAllowed: 10,
            ignorePatterns: [
                'Download the React DevTools',
                'You are running Vue in development mode',
                'Angular is running in development mode',
            ],
            categorizeFrameworkWarnings: true,
            ...overrides.consoleMonitor,
        },
        dependencyAudit: {
            enabled: true,
            packageManager: 'auto',
            failOnSeverity: 'critical',
            checkOutdated: true,
            autoFixSafe: false,
            ...overrides.dependencyAudit,
        },
        frontendQuality: {
            enabled: true,
            accessibility: {
                enabled: true,
                level: 'WCAG2AA',
                checkAltTags: true,
                checkFormLabels: true,
                checkHeadingOrder: true,
                checkColorContrast: true,
                checkAriaRoles: true,
            },
            performance: {
                enabled: true,
                maxFcpMs: 2000,
                maxLcpMs: 3500,
                maxCls: 0.1,
                maxDomNodes: 1500,
            },
            responsiveness: {
                enabled: true,
                checkHorizontalOverflow: true,
                viewports: defaultViewports,
            },
            brokenAssets: {
                enabled: true,
                checkImages: true,
                checkLinks: true,
            },
            ...overrides.frontendQuality,
        },
        reporting: {
            outputDir: overrides.reporting?.outputDir || './quality-reports',
            formats: overrides.reporting?.formats || ['html', 'json', 'console'],
            minOverallScore: overrides.reporting?.minOverallScore ?? 80,
            failPipelineOnQualityGate: overrides.reporting?.failPipelineOnQualityGate ?? false,
            openBrowser: overrides.reporting?.openBrowser ?? false,
            ...overrides.reporting,
        },
    };
}
export async function loadConfig(configPath, cwd = process.cwd()) {
    const possiblePaths = configPath ? [configPath] : [
        path.join(cwd, 'quality.config.js'),
        path.join(cwd, 'quality.config.mjs'),
        path.join(cwd, 'quality.config.json'),
        path.join(cwd, '.qualityrc.json'),
    ];
    for (const candidate of possiblePaths) {
        if (fs.existsSync(candidate)) {
            if (candidate.endsWith('.json')) {
                const parsed = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
                return getDefaultConfig(cwd, parsed);
            }
            try {
                const moduleUrl = candidate.startsWith('/') ? `file://${candidate}` : `file://${path.resolve(cwd, candidate)}`;
                const imported = await import(moduleUrl);
                const configData = imported.default || imported;
                return getDefaultConfig(cwd, configData);
            }
            catch (err) {
                console.warn(`[web-quality] Warning: Failed to load config from ${candidate}:`, err);
            }
        }
    }
    return getDefaultConfig(cwd);
}
//# sourceMappingURL=defaults.js.map