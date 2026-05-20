/**
 * Each app must use its own @dimensiondev/envs entry point so wallet and web
 * env schemas stay isolated.
 */

/** @type {import('eslint').Linter.RuleEntry} */
export const walletEnvsImportRestriction = [
    'error',
    {
        patterns: [
            {
                group: ['@dimensiondev/envs/web', '@dimensiondev/envs/web/*'],
                message:
                    'apps/wallet must import environment config from @dimensiondev/envs/wallet, not @dimensiondev/envs/web.',
            },
        ],
    },
];

/** @type {import('eslint').Linter.RuleEntry} */
export const webEnvsImportRestriction = [
    'error',
    {
        patterns: [
            {
                group: ['@dimensiondev/envs/wallet', '@dimensiondev/envs/wallet/*'],
                message:
                    'apps/web must import environment config from @dimensiondev/envs/web, not @dimensiondev/envs/wallet.',
            },
        ],
    },
];
