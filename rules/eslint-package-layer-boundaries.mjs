/**
 * Workspace package dependency layers.
 *
 *   Layer 0 – Foundation (no @dimensiondev deps):
 *     utils · types · assets
 *
 *   Layer 1 – Core packages (may only import Layer 0):
 *     constants · envs · exception-tracker · hooks
 *     iframe-bridge · native-bridge · rn-ui
 *
 *   Layer 2 – Applications (may import Layer 0 + Layer 1):
 *     apps/web · apps/wallet
 *
 * Packages must not import "sideways" into a sibling Layer 1 package.
 * Move shared logic down to @dimensiondev/utils or @dimensiondev/types.
 */
const LAYER_0_PACKAGES = ['@dimensiondev/utils', '@dimensiondev/types', '@dimensiondev/assets'];
const LAYER_1_PACKAGES = [
    '@dimensiondev/constants',
    '@dimensiondev/envs',
    '@dimensiondev/exception-tracker',
    '@dimensiondev/hooks',
    '@dimensiondev/iframe-bridge',
    '@dimensiondev/native-bridge',
    '@dimensiondev/rn-ui',
];

/** Returns a no-restricted-imports rule config that blocks the given package names. */
function packageBoundaryRule(disallowed) {
    if (disallowed.length === 0) return ['error'];
    return [
        'error',
        {
            patterns: disallowed.map((pkg) => ({
                group: [pkg, `${pkg}/*`],
                message: `Package boundary violation: '${pkg}' cannot be imported from this layer. Move shared logic to @dimensiondev/utils or @dimensiondev/types.`,
            })),
        },
    ];
}

/**
 * One ESLint config object per workspace package, scoped to its src directory.
 * Overrides the baseline no-restricted-imports with layer-aware restrictions.
 */
export const packageBoundaryConfigs = [
    {
        srcDir: 'packages/utils/src',
        disallowed: [...LAYER_0_PACKAGES.filter((p) => p !== '@dimensiondev/utils'), ...LAYER_1_PACKAGES],
    },
    {
        srcDir: 'packages/types/src',
        disallowed: [...LAYER_0_PACKAGES.filter((p) => p !== '@dimensiondev/types'), ...LAYER_1_PACKAGES],
    },
    ...LAYER_1_PACKAGES.map((pkg) => ({
        srcDir: `packages/${pkg.replace('@dimensiondev/', '')}/src`,
        disallowed: LAYER_1_PACKAGES.filter((p) => p !== pkg),
    })),
].map(({ srcDir, disallowed }) => ({
    files: [`${srcDir}/**/*.{ts,tsx,js,jsx}`],
    rules: {
        'no-restricted-imports': packageBoundaryRule(disallowed),
    },
}));
