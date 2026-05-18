#!/usr/bin/env node
/**
 * One-time bootstrap: merge `rn-ui.*` prefixed translations from
 * `apps/wallet/src/locales/{locale}/messages.ts` (ghost keys produced
 * by Tolgee during prior planning) into the corresponding entries of
 * `packages/rn-ui/src/locales/{locale}/messages.po`.
 *
 * Prerequisite: run `lingui extract` first so rn-ui's .po files have
 * the active entries (with empty msgstr for non-source locales).
 *
 * Behavior:
 *   - For each ACTIVE entry in rn-ui's .po with an empty msgstr, look up
 *     the corresponding rn-ui.* entry in wallet's compiled .ts. If a
 *     non-empty translation exists, fill it in.
 *   - Removes obsolete (`#~`-prefixed) entries that this script wrote
 *     in earlier runs, so the .po stays clean.
 *
 * Run:
 *   pnpm --filter @dimensiondev/rn-ui exec lingui extract
 *   node packages/rn-ui/scripts/bootstrap-locales.mjs
 *
 * Safe to re-run. Only fills empty msgstr — never overwrites existing
 * translations.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../..');

const LOCALES = ['en', 'ko', 'ja', 'zh-Hans', 'zh-Hant'];

function extractMessagesObject(source) {
    const match = source.match(/JSON\.parse\("(.+?)"\)\s*as\s+Messages/s);
    if (!match) throw new Error('Could not find JSON.parse(...) in compiled catalog');
    const raw = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return JSON.parse(raw);
}

function renderAstSegment(seg) {
    if (typeof seg === 'string') return seg;
    if (!Array.isArray(seg)) return String(seg);
    if (seg.length === 1 && typeof seg[0] === 'string') return `{${seg[0]}}`;
    if (seg.length === 3 && typeof seg[1] === 'string') {
        const [name, kind, options] = seg;
        const opts = Object.entries(options)
            .map(([k, v]) => `${k} {${renderAst(v)}}`)
            .join(' ');
        return `{${name}, ${kind}, ${opts}}`;
    }
    return JSON.stringify(seg);
}

function renderAst(ast) {
    if (typeof ast === 'string') return ast;
    if (Array.isArray(ast)) return ast.map(renderAstSegment).join('');
    return String(ast);
}

function escapePo(str) {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function unescapePo(str) {
    return str.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

/**
 * Parse a PO file into a list of records: header + entries.
 * Returns { header: string[], entries: Entry[] }
 * Each entry is { comments: string[], msgid: string, msgstr: string, obsolete: boolean }
 */
function parsePo(source) {
    const lines = source.split('\n');
    let i = 0;
    // Header block ends at first blank line after initial msgid "".
    const header = [];
    // Skip blank lines at start.
    while (i < lines.length && lines[i] === '') i++;
    // Read header: lines until blank line.
    while (i < lines.length && lines[i] !== '') {
        header.push(lines[i]);
        i++;
    }
    const entries = [];
    while (i < lines.length) {
        // Skip blank lines.
        while (i < lines.length && lines[i] === '') i++;
        if (i >= lines.length) break;
        const comments = [];
        let obsolete = false;
        while (i < lines.length && lines[i].startsWith('#') && !lines[i].startsWith('#~')) {
            comments.push(lines[i]);
            i++;
        }
        // Obsolete entry: lines start with #~ msgid / #~ msgstr.
        if (i < lines.length && lines[i].startsWith('#~')) {
            obsolete = true;
            // Find #~ msgid line.
            while (i < lines.length && !lines[i].match(/^#~ msgid /)) {
                comments.push(lines[i]);
                i++;
            }
            if (i >= lines.length) break;
            const msgidMatch = lines[i].match(/^#~ msgid "(.*)"$/);
            const msgid = msgidMatch ? unescapePo(msgidMatch[1]) : '';
            i++;
            // Read msgstr (could span multiple lines but for our case it's single).
            let msgstr = '';
            if (i < lines.length && lines[i].match(/^#~ msgstr /)) {
                const m = lines[i].match(/^#~ msgstr "(.*)"$/);
                msgstr = m ? unescapePo(m[1]) : '';
                i++;
            }
            entries.push({ comments, msgid, msgstr, obsolete: true });
            continue;
        }
        if (i >= lines.length) break;
        if (!lines[i].startsWith('msgid ')) {
            // Unexpected line; skip.
            i++;
            continue;
        }
        const msgidMatch = lines[i].match(/^msgid "(.*)"$/);
        const msgid = msgidMatch ? unescapePo(msgidMatch[1]) : '';
        i++;
        let msgstr = '';
        if (i < lines.length && lines[i].startsWith('msgstr ')) {
            const m = lines[i].match(/^msgstr "(.*)"$/);
            msgstr = m ? unescapePo(m[1]) : '';
            i++;
        }
        entries.push({ comments, msgid, msgstr, obsolete: false });
    }
    return { header, entries };
}

function serializePo({ header, entries }) {
    const out = [];
    out.push(...header);
    out.push('');
    for (const e of entries) {
        if (e.obsolete) continue; // Drop obsolete entries entirely.
        out.push(...e.comments);
        out.push(`msgid "${escapePo(e.msgid)}"`);
        out.push(`msgstr "${escapePo(e.msgstr)}"`);
        out.push('');
    }
    return out.join('\n');
}

let totalFilled = 0;
let totalSkipped = 0;
for (const locale of LOCALES) {
    const walletCompiled = resolve(REPO_ROOT, `apps/wallet/src/locales/${locale}/messages.ts`);
    const rnUiPo = resolve(REPO_ROOT, `packages/rn-ui/src/locales/${locale}/messages.po`);

    const walletSource = readFileSync(walletCompiled, 'utf8');
    const walletMessages = extractMessagesObject(walletSource);

    const poSource = readFileSync(rnUiPo, 'utf8');
    const parsed = parsePo(poSource);

    let filled = 0;
    let skipped = 0;
    for (const entry of parsed.entries) {
        if (!entry.msgid.startsWith('rn-ui.')) continue;
        if (entry.msgstr !== '' && locale !== 'en') continue; // Don't overwrite existing translation.
        const ghost = walletMessages[entry.msgid];
        if (!ghost) {
            skipped++;
            continue;
        }
        const text = renderAst(ghost);
        if (text === '') {
            skipped++;
            continue;
        }
        entry.msgstr = text;
        filled++;
    }

    writeFileSync(rnUiPo, serializePo(parsed), 'utf8');
    console.log(`  ${locale}: filled ${filled} translations, ${skipped} skipped (no ghost match)`);
    totalFilled += filled;
    totalSkipped += skipped;
}

console.log(`\nMerge complete: ${totalFilled} translations filled, ${totalSkipped} unchanged.`);
console.log(
    'Next: run `pnpm --filter @dimensiondev/rn-ui exec lingui compile` (or rely on the vite plugin) to regenerate messages.ts.',
);
