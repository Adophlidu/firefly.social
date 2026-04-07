#!/usr/bin/env node
/**
 * Safe wrapper for `tolgee push --force-mode OVERRIDE`.
 *
 * Problem: For languages with nplurals=1 (ja, ko, zh-Hans, zh-Hant), Tolgee's
 * PO_ICU parser converts an untranslated plural entry (msgstr[0] = "") into an
 * empty ICU plural string like `{value, plural, other {}}` instead of treating
 * it as untranslated. This corrupts the translation state in Tolgee.
 *
 * Fix: Before pushing, create temp copies of non-en PO files where untranslated
 * plural entries (all msgstr values empty) are removed entirely. Tolgee then
 * sees those keys as absent for that language and keeps them untranslated.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { findRepoRoot } = require('./repo-root.cjs');
const { isTolgeeEmptyPluralPlaceholder } = require('./tolgee-empty-plural-placeholder.cjs');

const ROOT = findRepoRoot(__dirname);
const { ensureTolgeeLanguages, projectIdFromPak } = require(
    path.join(ROOT, 'packages/scripts/tolgee-ensure-languages.cjs'),
);

const PO = require(
    require.resolve('pofile', {
        paths: [require.resolve('@lingui/format-po-gettext/package.json')],
    }),
);
/** @type {string} Path relative to repo root, e.g. `apps/web` or `apps/wallet` */
const APP_ROOT_REL = process.env.TOLGEE_APP_ROOT || 'apps/web';
const APP_ROOT = path.join(ROOT, APP_ROOT_REL);
const TOLGEERC_PATH = path.join(APP_ROOT, '.tolgeerc.json');

const tolgeerc = JSON.parse(fs.readFileSync(TOLGEERC_PATH, 'utf8'));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tolgee-push-'));

(async () => {
    try {
        const apiKey = process.env.TOLGEE_API_KEY;
        const projectId = tolgeerc.projectId !== undefined ? Number(tolgeerc.projectId) : projectIdFromPak(apiKey);
        const requiredTags = (tolgeerc.push?.files ?? []).map((f) => f.language).filter(Boolean);
        if (apiKey && projectId && requiredTags.length) {
            await ensureTolgeeLanguages({
                apiUrl: tolgeerc.apiUrl || 'https://app.tolgee.io',
                apiKey,
                projectId,
                requiredTags,
            });
        }

        const pushFiles = tolgeerc.push.files.map((entry) => {
            if (entry.language === 'en') return entry;

            const srcPath = path.resolve(APP_ROOT, entry.path);
            if (!fs.existsSync(srcPath)) return entry;

            const po = PO.parse(fs.readFileSync(srcPath, 'utf8'));

            const before = po.items.length;
            po.items = po.items.filter((item) => {
                if (!item.msgid_plural) return true;
                // Drop plural entries where every msgstr is empty or Tolgee’s bogus empty ICU.
                // Keeping them causes Tolgee to record "{var, plural, other {}}"
                // instead of leaving the translation empty.
                return item.msgstr.some((s) => s !== '' && !isTolgeeEmptyPluralPlaceholder(s));
            });
            const removed = before - po.items.length;

            if (removed > 0) {
                console.log(
                    `[tolgee-push-sources] ${entry.language}: skipping ${removed} untranslated plural entry/entries`,
                );
            }

            const tmpFile = path.join(tmpDir, `${entry.language}-messages.po`);
            fs.writeFileSync(tmpFile, po.toString());

            return { ...entry, path: tmpFile };
        });

        const tempRc = { ...tolgeerc, push: { ...tolgeerc.push, files: pushFiles } };
        const tempRcPath = path.join(tmpDir, '.tolgeerc.json');
        fs.writeFileSync(tempRcPath, JSON.stringify(tempRc, null, 2));

        const extraArgs = process.argv.slice(2).join(' ');
        execSync(`node_modules/.bin/tolgee push --config "${tempRcPath}" ${extraArgs}`, {
            stdio: 'inherit',
            cwd: APP_ROOT,
        });
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
