'use strict';

const fs = require('fs');
const path = require('path');

/**
 * @param {string} fromDir Directory to start from (e.g. __dirname of a file under packages/scripts)
 * @returns {string} Absolute path to the monorepo root (pnpm-lock.yaml + package.json)
 */
function findRepoRoot(fromDir) {
    let dir = path.resolve(fromDir);
    for (;;) {
        if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml')) && fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            throw new Error(`Could not find monorepo root (pnpm-lock.yaml + package.json) starting from ${fromDir}`);
        }
        dir = parent;
    }
}

module.exports = { findRepoRoot };
