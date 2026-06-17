'use strict';

/**
 * Safe wrapper for `tolgee push` with temp PO copies for nplurals=1 languages.
 * Tolgee push-sources flow (PO temp files, ensure-languages, tolgee push).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ensureLanguagesFromTolgeerc } = require('./ensure-languages.cjs');
const { isTolgeeEmptyPluralPlaceholder } = require('./tolgee-empty-plural-placeholder.cjs');
const { readTolgeerc } = require('./context.cjs');
const { runTolgeeSync } = require('./run-tolgee.cjs');

const PO = require(
    require.resolve('pofile', {
        paths: [require.resolve('@lingui/format-po-gettext/package.json')],
    }),
);

/**
 * @param {string} appRoot
 * @param {string[]} [extraTolgeeArgs] — forwarded to the Tolgee CLI after `push` and `--config <tmp>`.
 */
async function runPushSources(appRoot, extraTolgeeArgs) {
    const { config: tolgeerc } = readTolgeerc(appRoot);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tolgee-push-'));
    const extra = Array.isArray(extraTolgeeArgs) ? extraTolgeeArgs : [];

    try {
        await ensureLanguagesFromTolgeerc(tolgeerc, process.env.TOLGEE_API_KEY);

        const pushFiles = tolgeerc.push.files.map((entry) => {
            if (entry.language === 'en') return entry;

            const srcPath = path.resolve(appRoot, entry.path);
            if (!fs.existsSync(srcPath)) return entry;

            const po = PO.parse(fs.readFileSync(srcPath, 'utf8'));

            const before = po.items.length;
            po.items = po.items.filter((item) => {
                if (!item.msgid_plural) return true;
                return item.msgstr.some((s) => s !== '' && !isTolgeeEmptyPluralPlaceholder(s));
            });
            const removed = before - po.items.length;

            if (removed > 0) {
                console.log(
                    `[firefly-tolgee] push-sources ${entry.language}: skipping ${removed} untranslated plural entry/entries`,
                );
            }

            const tmpFile = path.join(tmpDir, `${entry.language}-messages.po`);
            fs.writeFileSync(tmpFile, po.toString());

            return { ...entry, path: tmpFile };
        });

        const tempRc = { ...tolgeerc, push: { ...tolgeerc.push, files: pushFiles } };
        const tempRcPath = path.join(tmpDir, '.tolgeerc.json');
        fs.writeFileSync(tempRcPath, JSON.stringify(tempRc, null, 2));

        const r = runTolgeeSync(appRoot, ['push', '--config', tempRcPath, ...extra]);
        if (r.status !== 0) {
            process.exitCode = r.status ?? 1;
        }
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

module.exports = { runPushSources };
