'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

/**
 * Run the Tolgee CLI the same way app scripts do: `tolgee` from the host's node_modules
 * (via pnpm exec from the app root).
 *
 * @param {string} appRoot
 * @param {string[]} args
 * @param {{ stdio?: 'inherit' | 'pipe' }} [opts]
 * @returns {import('child_process').SpawnSyncReturns<Buffer>}
 */
function runTolgeeSync(appRoot, args, opts) {
    return spawnSync('pnpm', ['exec', 'tolgee', ...args], {
        cwd: appRoot,
        stdio: opts?.stdio ?? 'inherit',
        env: process.env,
        shell: false,
    });
}

module.exports = { runTolgeeSync };
