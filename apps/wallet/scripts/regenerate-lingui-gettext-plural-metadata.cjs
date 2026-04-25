#!/usr/bin/env node
/**
 * Rebuild apps/wallet/lingui-gettext-plural-metadata.json from the English catalog.
 * Run after `lingui extract` when gettext plural entries change.
 *
 * Works with both Lingui output (split msgid / msgid_plural + js-lingui) and
 * Tolgee pull output (identical ICU strings in msgid and msgid_plural, no comment).
 */
const fs = require('fs');
const path = require('path');

const PO = require(
    require.resolve('pofile', {
        paths: [require.resolve('@lingui/format-po-gettext/package.json')],
    }),
);

const APP_ROOT = path.resolve(__dirname, '..');
const EN_PO = path.join(APP_ROOT, 'src/locales/en/messages.po');
const OUT = path.join(APP_ROOT, 'lingui-gettext-plural-metadata.json');

function refKey(refs) {
    const paths = [...refs].map((r) => r.replace(/:\d+$/, ''));
    return [...new Set(paths)].sort().join('\n');
}

/** Match @lingui/format-po-gettext serializePlurals URLSearchParams output */
function makeJsLinguiComment(icu, pluralizeOn) {
    const u = new URLSearchParams();
    u.set('icu', icu);
    u.set('pluralize_on', String(pluralizeOn));
    u.sort();
    return 'js-lingui:' + u.toString();
}

function pluralArgFromIcu(icu) {
    const m = /^\{([^,}]+),\s*plural/.exec(icu);
    return m ? m[1] : '0';
}

function icuFromExistingComment(ling) {
    const raw = ling.startsWith('js-lingui:') ? ling.slice('js-lingui:'.length) : ling;
    return new URLSearchParams(raw).get('icu');
}

const po = PO.parse(fs.readFileSync(EN_PO, 'utf8'));
const byRefKey = {};
const byTolgeeDuplicateIcuMsgid = {};

for (const item of po.items) {
    if (!item.msgid_plural) continue;

    const ling = item.extractedComments.find((c) => c.startsWith('js-lingui:icu='));
    const tolgeeDuplicate =
        item.msgid === item.msgid_plural && item.msgid.startsWith('{') && item.msgid.includes(', plural,');

    if (tolgeeDuplicate) {
        const synthetic = makeJsLinguiComment(item.msgid, pluralArgFromIcu(item.msgid));
        byTolgeeDuplicateIcuMsgid[item.msgid] = synthetic;
        continue;
    }

    if (!ling) {
        console.warn('Missing js-lingui comment for plural:', item.msgid, item.msgid_plural);
        continue;
    }

    const refK = JSON.stringify([item.msgid, item.msgid_plural, refKey(item.references)]);
    byRefKey[refK] = ling;

    const icu = icuFromExistingComment(ling);
    if (icu) byTolgeeDuplicateIcuMsgid[icu] = ling;
}

for (const item of po.items) {
    if (item.msgid_plural) continue;
    if (!item.msgid.startsWith('{') || !item.msgid.includes(', plural,')) continue;
    if (byTolgeeDuplicateIcuMsgid[item.msgid]) continue;

    const pluralizeOn = pluralArgFromIcu(item.msgid);
    byTolgeeDuplicateIcuMsgid[item.msgid] = makeJsLinguiComment(item.msgid, pluralizeOn);
}

const EXPLICIT_COMMENT = 'js-lingui-explicit-id';
const explicitFromPo = new Set();
for (const item of po.items) {
    if (item.extractedComments.includes(EXPLICIT_COMMENT)) explicitFromPo.add(item.msgid);
}

function collectTransExplicitIds(srcDir) {
    const ids = new Set();

    function walk(dir) {
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue;
                walk(p);
            } else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) {
                const s = fs.readFileSync(p, 'utf8');
                const re = /<Trans\b[^>\n]*\sid=["']([^"']+)["']/g;
                let m;
                while ((m = re.exec(s))) ids.add(m[1]);
            }
        }
    }

    walk(srcDir);
    return ids;
}

const explicitFromSrc = collectTransExplicitIds(path.join(APP_ROOT, 'src'));
const explicitMsgids = [...new Set([...explicitFromPo, ...explicitFromSrc])].sort();

const payload = { byRefKey, byTolgeeDuplicateIcuMsgid, explicitMsgids };
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
console.log(
    'Wrote',
    Object.keys(byRefKey).length,
    'ref keys,',
    Object.keys(byTolgeeDuplicateIcuMsgid).length,
    'Tolgee ICU keys,',
    explicitMsgids.length,
    'explicit msgid(s) to',
    path.relative(process.cwd(), OUT),
);
