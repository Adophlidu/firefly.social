'use strict';

const path = require('path');
const { findRepoRoot } = require('./repo-root.cjs');

/**
 * Ensures the Tolgee project has every language listed in tolgeerc `push.files`.
 * Without this, `tolgee push` fails with EXISTING_LANGUAGE_NOT_SELECTED when a
 * locale exists locally but was never added on the platform (common for new projects).
 */
const root = findRepoRoot(__dirname);
const base32Decode = require(
    require.resolve('base32-decode', {
        paths: [path.join(root, 'apps/wallet/node_modules'), path.join(root, 'apps/web/node_modules')],
    }),
);

const API_KEY_PAK_PREFIX = 'tgpak_';

/** @type {Record<string, string>} */
const DEFAULT_LANGUAGE_LABELS = {
    en: 'English',
    ko: 'Korean',
    ja: 'Japanese',
    es: 'Spanish',
    'zh-Hans': 'Chinese (Simplified)',
    'zh-Hant': 'Chinese (Traditional)',
};

/**
 * @param {string | undefined} key
 * @returns {number | undefined}
 */
function projectIdFromPak(key) {
    if (!key || !key.startsWith(API_KEY_PAK_PREFIX)) return undefined;
    const keyBuffer = base32Decode(key.slice(API_KEY_PAK_PREFIX.length).toUpperCase(), 'RFC4648');
    const decoded = Buffer.from(keyBuffer).toString('utf8');
    return Number(decoded.split('_')[0]);
}

/**
 * @param {object} opts
 * @param {string} opts.apiUrl
 * @param {string} opts.apiKey
 * @param {number} opts.projectId
 * @param {string[]} opts.requiredTags
 */
async function ensureTolgeeLanguages(opts) {
    const { apiUrl, apiKey, projectId, requiredTags } = opts;
    const base = String(apiUrl).replace(/\/$/, '');
    const headers = {
        'x-api-key': apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    const listRes = await fetch(`${base}/v2/projects/${projectId}/languages?size=500`, { headers });
    if (!listRes.ok) {
        const text = await listRes.text();
        throw new Error(`Tolgee list languages failed: ${listRes.status} ${text}`);
    }
    /** @type {{ _embedded?: { languages?: { tag: string }[] } }} */
    const listJson = await listRes.json();
    const existing = new Set((listJson._embedded?.languages ?? []).map((l) => l.tag));
    const missing = [...new Set(requiredTags)].filter((t) => t && !existing.has(t));

    for (const tag of missing) {
        const name = DEFAULT_LANGUAGE_LABELS[tag] ?? tag;
        const body = JSON.stringify({ tag, name, originalName: name });
        const postRes = await fetch(`${base}/v2/projects/${projectId}/languages`, {
            method: 'POST',
            headers,
            body,
        });
        if (postRes.ok) {
            console.log(`[tolgee-ensure-languages] Added language "${tag}" to project ${projectId}`);
            continue;
        }
        const errText = await postRes.text();
        /** @type {{ CUSTOM_VALIDATION?: { language_tag_exists?: unknown[] } }} */
        let parsed;
        try {
            parsed = JSON.parse(errText);
        } catch {
            throw new Error(`Tolgee add language "${tag}" failed: ${postRes.status} ${errText}`);
        }
        const tagExists = parsed.CUSTOM_VALIDATION?.language_tag_exists?.length;
        if (tagExists) {
            continue;
        }
        throw new Error(`Tolgee add language "${tag}" failed: ${postRes.status} ${errText}`);
    }
}

module.exports = { ensureTolgeeLanguages, projectIdFromPak, DEFAULT_LANGUAGE_LABELS };
