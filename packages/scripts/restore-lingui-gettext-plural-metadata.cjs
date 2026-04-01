#!/usr/bin/env node
/**
 * Tolgee pull drops Lingui gettext metadata comments:
 * - `#. js-lingui:icu=…&pluralize_on=…` (plural → ICU)
 * - `#. js-lingui-explicit-id` (msgid is the catalog key; without it, extract
 *   hashes msgid and drops existing msgstr for ids like `nft-items`).
 *
 * Re-insert from scripts/lingui-gettext-plural-metadata.json.
 *
 * After adding new plural strings or new `<Trans id="…">` in code, run:
 *   NODE_ENV=development pnpm exec lingui extract
 * then: node scripts/regenerate-lingui-gettext-plural-metadata.cjs
 */
const fs = require('fs');
const path = require('path');
const { findRepoRoot } = require('./repo-root.cjs');
const PO = require(
    require.resolve('pofile', {
        paths: [require.resolve('@lingui/format-po-gettext/package.json')],
    }),
);

const ROOT = findRepoRoot(__dirname);
const LOCALES = ['en', 'es', 'ko', 'ja', 'zh-Hans', 'zh-Hant'];
const METADATA_PATH = path.join(__dirname, 'lingui-gettext-plural-metadata.json');
const EXPLICIT_COMMENT = 'js-lingui-explicit-id';
const { isTolgeeEmptyPluralPlaceholder } = require('./tolgee-empty-plural-placeholder.cjs');

function refKey(refs) {
    const paths = [...refs].map((r) => r.replace(/:\d+$/, ''));
    return [...new Set(paths)].sort().join('\n');
}

function loadMetadata() {
    const raw = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
    const base = raw.byRefKey && raw.byTolgeeDuplicateIcuMsgid ? raw : { byRefKey: raw, byTolgeeDuplicateIcuMsgid: {} };
    return {
        ...base,
        explicitMsgids: Array.isArray(base.explicitMsgids) ? base.explicitMsgids : [],
    };
}

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

function main() {
    const meta = loadMetadata();
    const explicitSet = new Set(meta.explicitMsgids);
    let insertedPlural = 0;
    let insertedExplicit = 0;
    let missingPlural = 0;
    let strippedTolgeeEmptyPlural = 0;

    for (const locale of LOCALES) {
        const poPath = path.join(ROOT, 'src/locales', locale, 'messages.po');
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
    if (missingPlural) process.exitCode = 1;
}

main();
