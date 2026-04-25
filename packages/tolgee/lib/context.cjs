'use strict';

const fs = require('fs');
const path = require('path');

/**
 * @param {string} fromDir
 * @returns {string}
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

function hasTolgeercAt(dir) {
    return fs.existsSync(path.join(dir, '.tolgeerc.json')) || fs.existsSync(path.join(dir, '.tolgeerc'));
}

/**
 * @param {string} appRoot
 * @returns {string | null} Path to the resolved Tolgee config file
 */
function findTolgeercPath(appRoot) {
    const j = path.join(appRoot, '.tolgeerc.json');
    if (fs.existsSync(j)) return j;
    const t = path.join(appRoot, '.tolgeerc');
    if (fs.existsSync(t)) return t;
    return null;
}

/**
 * @param {string} repoRoot
 * @returns {string} Absolute app root (directory containing .tolgeerc)
 */
function resolveAppRoot(repoRoot) {
    const explicit = process.env.TOLGEE_APP_ROOT;
    const cwd = process.cwd();
    if (explicit) {
        return path.isAbsolute(explicit) ? explicit : path.join(repoRoot, explicit);
    }
    if (hasTolgeercAt(cwd)) {
        return cwd;
    }
    return path.join(repoRoot, 'apps/web');
}

/**
 * Load .env then .env.local from app root (local overrides).
 * @param {string} appRoot
 */
function loadEnv(appRoot) {
    const dotenv = require('dotenv');
    dotenv.config({ path: path.join(appRoot, '.env') });
    dotenv.config({ path: path.join(appRoot, '.env.local'), override: true });
}

/**
 * @param {string} appRoot
 * @returns {{ config: object, path: string }}
 */
function readTolgeerc(appRoot) {
    const p = findTolgeercPath(appRoot);
    if (!p) {
        throw new Error(`No .tolgeerc.json or .tolgeerc found under ${appRoot}`);
    }
    return { config: JSON.parse(fs.readFileSync(p, 'utf8')), path: p };
}

/**
 * Host app extension (context string, pull restore, sync script names). Document in each app’s .tolgeerc or .tolgeerc.json.
 * @param {object} tolgeerc
 */
function getFireflyTolgee(tolgeerc) {
    const raw = tolgeerc.fireflyTolgee ?? {};
    return {
        /** Human-readable i18n context for this app (doc / onboarding only). */
        context: raw.context,
        /** After `tolgee pull`, re-insert Lingui gettext comments from metadata (default true). */
        restoreAfterPull: raw.restoreAfterPull !== false,
        /** Override default `<app root>/lingui-gettext-plural-metadata.json`. */
        linguiGettextPluralMetadataPath: raw.linguiGettextPluralMetadataPath,
        sync: {
            extractScript: 'lingui:extract',
            compileScript: 'lingui:compile',
            ...(raw.sync && typeof raw.sync === 'object' ? raw.sync : {}),
        },
    };
}

module.exports = {
    findRepoRoot,
    resolveAppRoot,
    loadEnv,
    readTolgeerc,
    findTolgeercPath,
    getFireflyTolgee,
};
