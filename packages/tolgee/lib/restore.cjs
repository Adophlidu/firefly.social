'use strict';

const fs = require('fs');
const path = require('path');
const { isTolgeeEmptyPluralPlaceholder } = require('./tolgee-empty-plural-placeholder.cjs');

const PO = require(
    require.resolve('pofile', {
        paths: [require.resolve('@lingui/format-po-gettext/package.json')],
    }),
);

const EXPLICIT_COMMENT = 'js-lingui-explicit-id';

/**
 * @param {object} tolgeerc
 * @param {string} appRoot
 * @returns {string[]}
 */
function listLocalesFromPull(tolgeerc, appRoot) {
    const pull = tolgeerc.pull;
    if (!pull?.path) return [];
    const base = path.resolve(appRoot, pull.path);
    const template = pull.fileStructureTemplate || '{languageTag}/messages.{extension}';
    const m = String(template).match(/messages\.(\w+)/);
    const ext = m ? m[1] : 'po';
    if (!fs.existsSync(base)) return [];
    const locales = [];
    for (const e of fs.readdirSync(base, { withFileTypes: true })) {
        if (!e.isDirectory()) continue;
        const poPath = path.join(base, e.name, `messages.${ext}`);
        if (fs.existsSync(poPath)) locales.push(e.name);
    }
    return locales.sort();
}

function refKey(refs) {
    const paths = [...refs].map((r) => r.replace(/:\d+$/, ''));
    return [...new Set(paths)].sort().join('\n');
}

/**
 * @param {string} metadataPath
 */
function loadMetadata(metadataPath) {
    const raw = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const base = raw.byRefKey && raw.byTolgeeDuplicateIcuMsgid ? raw : { byRefKey: raw, byTolgeeDuplicateIcuMsgid: {} };
    return {
        ...base,
        explicitMsgids: Array.isArray(base.explicitMsgids) ? base.explicitMsgids : [],
    };
}

/**
 * @param {import('pofile').Item} item
 * @param {object} meta
 * @returns {string | undefined}
 */
function findComment(item, meta) {
    if (item.msgid_plural) {
        const key = JSON.stringify([item.msgid, item.msgid_plural, refKey(item.references)]);
        const fromRef = meta.byRefKey[key];
        if (fromRef) return fromRef;
        if (item.msgid === item.msgid_plural && meta.byTolgeeDuplicateIcuMsgid[item.msgid]) {
            return meta.byTolgeeDuplicateIcuMsgid[item.msgid];
        }
        return undefined;
    }
    return undefined;
}

/**
 * Re-insert Lingui gettext comments Tolgee `pull` strips, using app-root metadata or a custom path.
 *
 * @param {string} appRoot
 * @param {object} tolgeerc
 * @param {{ linguiGettextPluralMetadataPath?: string } | null | undefined} [firefly] from getFireflyTolgee(tolgeerc)
 * @param {string[] | null} [localeOverride] If set, use this list instead of scanning `pull.path`.
 * @returns {{ code: 0 | 1 }}
 */
function restoreLinguiGettextPluralMetadata(appRoot, tolgeerc, firefly, localeOverride) {
    const metadataPath = (() => {
        if (firefly?.linguiGettextPluralMetadataPath) {
            const p = path.resolve(appRoot, firefly.linguiGettextPluralMetadataPath);
            if (!fs.existsSync(p)) {
                throw new Error(`linguiGettextPluralMetadataPath not found: ${p}`);
            }
            return p;
        }
        const defaultPath = path.join(appRoot, 'lingui-gettext-plural-metadata.json');
        if (!fs.existsSync(defaultPath)) {
            throw new Error(
                `lingui-gettext-plural-metadata.json not found. Expected at ${defaultPath} (or set fireflyTolgee.linguiGettextPluralMetadataPath in .tolgeerc). For the web app, run: pnpm run --filter @dimensiondev/firefly-web lingui:regenerate-gettext-plural-metadata`,
            );
        }
        return defaultPath;
    })();
    const LOCALES = localeOverride ?? listLocalesFromPull(tolgeerc, appRoot);
    const template = (tolgeerc.pull && tolgeerc.pull.fileStructureTemplate) || '{languageTag}/messages.{extension}';
    const m = String(template).match(/messages\.(\w+)/);
    const ext = m ? m[1] : 'po';
    const pullBase = tolgeerc.pull ? path.resolve(appRoot, tolgeerc.pull.path) : path.join(appRoot, 'src', 'locales');

    const meta = loadMetadata(metadataPath);
    const explicitSet = new Set(meta.explicitMsgids);
    let insertedPlural = 0;
    let insertedExplicit = 0;
    let missingPlural = 0;
    let strippedTolgeeEmptyPlural = 0;

    for (const locale of LOCALES) {
        const poPath = path.join(pullBase, locale, `messages.${ext}`);
        if (!fs.existsSync(poPath)) continue;

        const po = PO.parse(fs.readFileSync(poPath, 'utf8'));
        let changed = false;

        for (const item of po.items) {
            if (item.msgid_plural) {
                const has = item.extractedComments.some((c) => c.startsWith('js-lingui:icu='));
                if (!has) {
                    const comment = findComment(item, meta);
                    if (!comment) {
                        missingPlural += 1;
                        console.warn(
                            'restore-lingui-gettext-plural-metadata: missing plural metadata for',
                            locale,
                            JSON.stringify(item.msgid).slice(0, 100),
                            'msgid_plural:',
                            JSON.stringify(item.msgid_plural).slice(0, 80),
                            'refs:',
                            refKey(item.references).slice(0, 120),
                        );
                    } else {
                        item.extractedComments.push(comment);
                        changed = true;
                        insertedPlural += 1;
                    }
                }

                let stripPlural = false;
                item.msgstr = item.msgstr.map((s) => {
                    if (isTolgeeEmptyPluralPlaceholder(s)) {
                        stripPlural = true;
                        return '';
                    }
                    return s;
                });
                if (stripPlural) {
                    changed = true;
                    strippedTolgeeEmptyPlural += 1;
                }
            }

            if (explicitSet.has(item.msgid) && !item.extractedComments.includes(EXPLICIT_COMMENT)) {
                item.extractedComments.unshift(EXPLICIT_COMMENT);
                changed = true;
                insertedExplicit += 1;
            }
        }

        if (changed) {
            fs.writeFileSync(poPath, po.toString());
        }
    }

    console.log(
        `restore-lingui-gettext-plural-metadata: inserted ${insertedPlural} plural + ${insertedExplicit} explicit-id comment(s)${
            strippedTolgeeEmptyPlural ? `; cleared ${strippedTolgeeEmptyPlural} Tolgee empty-plural placeholder(s)` : ''
        }${missingPlural ? `; ${missingPlural} plural unmatched (regenerate lingui-gettext-plural-metadata.json)` : ''}`,
    );
    return { code: missingPlural ? 1 : 0 };
}

module.exports = { restoreLinguiGettextPluralMetadata, listLocalesFromPull, loadMetadata };
