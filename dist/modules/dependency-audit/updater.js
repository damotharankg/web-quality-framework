export class DependencyUpdater {
    static generatePlan(packageManager, vulnerabilities, outdated) {
        const safeUpdates = outdated.filter(p => p.isSafeToUpdate);
        const majorBreakingUpdates = outdated.filter(p => p.updateType === 'major');
        const vulnerabilityFixCommands = [];
        if (vulnerabilities.length > 0) {
            if (packageManager === 'npm') {
                vulnerabilityFixCommands.push('npm audit fix');
            }
            else if (packageManager === 'pnpm') {
                vulnerabilityFixCommands.push('pnpm audit --fix');
            }
            else if (packageManager === 'yarn') {
                vulnerabilityFixCommands.push('yarn upgrade');
            }
        }
        let safeUpdateCommand = '';
        if (safeUpdates.length > 0) {
            if (packageManager === 'npm') {
                safeUpdateCommand = 'npm update';
            }
            else if (packageManager === 'pnpm') {
                safeUpdateCommand = 'pnpm update';
            }
            else if (packageManager === 'yarn') {
                safeUpdateCommand = 'yarn upgrade';
            }
        }
        const summaryText = `Identified ${safeUpdates.length} safe non-breaking patch/minor update(s) and ${majorBreakingUpdates.length} major version update(s) requiring testing.`;
        return {
            safeUpdates,
            majorBreakingUpdates,
            vulnerabilityFixCommands,
            safeUpdateCommand,
            summaryText,
        };
    }
}
//# sourceMappingURL=updater.js.map