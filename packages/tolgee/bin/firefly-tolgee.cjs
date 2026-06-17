#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');
const { findRepoRoot, resolveAppRoot, loadEnv, readTolgeerc, getFireflyTolgee } = require('../lib/context.cjs');
const { runTolgeeSync } = require('../lib/run-tolgee.cjs');
const { restoreLinguiGettextPluralMetadata } = require('../lib/restore.cjs');
const { runPushSources } = require('../lib/push-sources.cjs');
const { ensureLanguagesFromTolgeerc } = require('../lib/ensure-languages.cjs');

const repoRoot = findRepoRoot(path.join(__dirname, '..'));
const appRoot = resolveAppRoot(repoRoot);

const argv = process.argv.slice(2);
const [cmd, ...rest] = argv;

function usage() {
    console.log(`Usage: firefly-tolgee <command> [options]

Commands:
  push            Run tolgee push (uses .tolgeerc in the app; run from app directory or set TOLGEE_APP_ROOT).
  push-sources    PO wrapper then tolgee push (untranslated plural fix for nplurals=1).
  pull            Run tolgee pull, then re-insert Lingui metadata unless --no-restore or fireflyTolgee.restoreAfterPull: false in .tolgeerc.
  sync            pull + pnpm run <extractScript> + pnpm run <compileScript> (defaults: lingui:extract, lingui:compile).

Config: .tolgeerc or .tolgeerc.json in the app; optional "fireflyTolgee" (context, restoreAfterPull, sync, linguiGettextPluralMetadataPath).
Load API keys from .env / .env.local in the app.
`);
    process.exitCode = cmd && cmd !== 'help' && cmd !== '-h' && cmd !== '--help' ? 1 : 0;
}

function pnpmRun(app, script) {
    const r = spawnSync('pnpm', ['run', script], { cwd: app, stdio: 'inherit', env: process.env, shell: false });
    if (r.status) process.exit(r.status ?? 1);
}

/**
 * @param {string[]} args
 * @param {string} flag
 */
function takeFlag(args, flag) {
    const i = args.indexOf(flag);
    if (i < 0) return false;
    args.splice(i, 1);
    return true;
}

async function main() {
    if (!cmd || cmd === 'help' || cmd === '-h' || cmd === '--help') {
        usage();
        return;
    }

    loadEnv(appRoot);
    const { config: tolgeerc } = readTolgeerc(appRoot);
    const firefly = getFireflyTolgee(tolgeerc);

    if (cmd === 'push') {
        await ensureLanguagesFromTolgeerc(tolgeerc, process.env.TOLGEE_API_KEY);
        const r = runTolgeeSync(appRoot, ['push', ...rest]);
        if (r.status) process.exit(r.status ?? 1);
    } else if (cmd === 'push-sources') {
        await runPushSources(appRoot, rest);
        if (process.exitCode) process.exit(process.exitCode);
    } else if (cmd === 'pull') {
        const args = [...rest];
        const noRestore = takeFlag(args, '--no-restore');
        const r = runTolgeeSync(appRoot, ['pull', ...args]);
        if (r.status) process.exit(r.status ?? 1);
        if (!noRestore && firefly.restoreAfterPull) {
            const { code } = restoreLinguiGettextPluralMetadata(appRoot, tolgeerc, firefly);
            if (code) process.exit(code);
        }
    } else if (cmd === 'sync') {
        const rPull = runTolgeeSync(appRoot, ['pull']);
        if (rPull.status) process.exit(rPull.status ?? 1);
        if (firefly.restoreAfterPull) {
            const { code } = restoreLinguiGettextPluralMetadata(appRoot, tolgeerc, firefly);
            if (code) process.exit(code);
        }
        pnpmRun(appRoot, firefly.sync.extractScript);
        pnpmRun(appRoot, firefly.sync.compileScript);
    } else {
        console.error('Unknown command:', cmd);
        usage();
        process.exit(1);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
