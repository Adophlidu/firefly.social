#!/usr/bin/env node

/**
 * Script to create a Jira issue from a firefly-exception-tracker exception.
 *
 * Fetches exception details from the tracker, formats them per JIRA_ISSUE_TEMPLATE,
 * and creates a Jira issue with the required tags.
 *
 * Usage:
 *   node scripts/create-jira-from-exception.mjs <exception_id> [options]
 *
 * Example:
 *   node scripts/create-jira-from-exception.mjs 349
 *   node scripts/create-jira-from-exception.mjs 349 --dry-run
 *
 * Environment variables:
 *   EXCEPTION_TRACKER_URL     Tracker base URL (default: https://firefly-exception-tracker.r2d2.to)
 *   EXCEPTION_TRACKER_USER    Admin username for tracker login
 *   EXCEPTION_TRACKER_PASS    Admin password for tracker login
 *   JIRA_EMAIL, JIRA_API_TOKEN, JIRA_BASE_URL  (from .env.local, same as create-jira-issue.mjs)
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findRepoRoot } from './repo-root.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(findRepoRoot(__dirname), '.env.local');
try {
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^(?:export\s+)?(\w+)=(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                if (!process.env[key]) process.env[key] = value;
            }
        }
    });
} catch {
    /* .env.local may not exist */
}

const TRACKER_URL = (process.env.EXCEPTION_TRACKER_URL || 'https://firefly-exception-tracker.r2d2.to').replace(
    /\/$/,
    '',
);
const TRACKER_USER = process.env.EXCEPTION_TRACKER_USER;
const TRACKER_PASS = process.env.EXCEPTION_TRACKER_PASS;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://mask.atlassian.net';

const { values, positionals } = parseArgs({
    options: {
        'dry-run': { type: 'boolean' },
        update: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
});

if (values.help || !positionals?.length) {
    console.log(`
Usage: node scripts/create-jira-from-exception.mjs <exception_id> [options]

Fetches exception #<exception_id> from firefly-exception-tracker, formats it
per .jira/ISSUE_TEMPLATE.md, and creates a Jira issue with:
  - Title: [firefly-exception-tracker] <error message>
  - Labels: ai, firefly-exception-tracker

Options:
  --dry-run           Show what would be created without creating
  --update <issue-key> Update existing Jira issue instead of creating
  -h, --help          Show this help

Environment variables:
  EXCEPTION_TRACKER_USER    Tracker admin username
  EXCEPTION_TRACKER_PASS    Tracker admin password
  JIRA_EMAIL, JIRA_API_TOKEN  (from .env.local)
`);
    process.exit(values.help ? 0 : 1);
}

const exceptionId = positionals[0];
const dryRun = values['dry-run'];
const updateIssueKey = values.update;

async function loginAndFetchException() {
    if (!TRACKER_USER || !TRACKER_PASS) {
        throw new Error('EXCEPTION_TRACKER_USER and EXCEPTION_TRACKER_PASS are required');
    }

    const loginRes = await fetch(`${TRACKER_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(TRACKER_USER)}&password=${encodeURIComponent(TRACKER_PASS)}`,
        redirect: 'manual',
    });

    const cookies = loginRes.headers.get('set-cookie');
    if (!cookies) {
        throw new Error('Login failed: no session cookie received');
    }

    const exceptionRes = await fetch(`${TRACKER_URL}/admin/exceptions/${exceptionId}`, {
        headers: { Cookie: cookies.split(';')[0] },
    });

    if (!exceptionRes.ok) {
        throw new Error(`Failed to fetch exception: ${exceptionRes.status} ${exceptionRes.statusText}`);
    }

    return exceptionRes.text();
}

function parseExceptionHtml(html) {
    const data = {};

    // Message: <pre>Cannot read properties of null (reading 'info')</pre>
    const msgMatch = html.match(/<h3[^>]*>runtime_error<\/h3>\s*<pre>([^<]*)<\/pre>/);
    data.message = msgMatch ? msgMatch[1].trim() : '';

    // Stack trace: <pre>TypeError: ...
    const stackMatch = html.match(/<h3[^>]*>Stack Trace<\/h3>\s*<pre>([\s\S]*?)<\/pre>/);
    data.stackTrace = stackMatch ? stackMatch[1].trim() : '';

    // Meta: Service, Environment, Timestamp, Request URL
    const meta = (label, value) => {
        const re = new RegExp(`<label>${label}<\\/label>[\\s\\S]*?<p class="meta-item-value">([^<]*)<\\/p>`, 'i');
        const m = html.match(re);
        return m ? m[1].trim() : '';
    };
    data.service = meta('Service', '');
    data.environment = meta('Environment', '');
    data.timestamp = meta('Timestamp', '');
    data.requestUrl = meta('Request URL', '');
    data.occurrences = meta('Occurrences', '');
    data.firstSeen = meta('First Seen', '');
    data.lastSeen = meta('Last Seen', '');

    return data;
}

function markdownToADF(markdown) {
    const content = [];
    const lines = markdown.split('\n');
    let i = 0;
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    let codeBlockContent = [];

    const parseInline = (text) => {
        const out = [];
        let cur = '';
        let j = 0;
        while (j < text.length) {
            if (text.substring(j, j + 2) === '**') {
                if (cur) {
                    out.push({ type: 'text', text: cur });
                    cur = '';
                }
                const end = text.indexOf('**', j + 2);
                if (end !== -1) {
                    out.push({ type: 'text', text: text.substring(j + 2, end), marks: [{ type: 'strong' }] });
                    j = end + 2;
                    continue;
                }
            }
            if (text[j] === '`') {
                if (cur) {
                    out.push({ type: 'text', text: cur });
                    cur = '';
                }
                const end = text.indexOf('`', j + 1);
                if (end !== -1) {
                    out.push({ type: 'text', text: text.substring(j + 1, end), marks: [{ type: 'code' }] });
                    j = end + 1;
                    continue;
                }
            }
            cur += text[j];
            j++;
        }
        if (cur) out.push({ type: 'text', text: cur });
        return out.length ? out : [{ type: 'text', text }];
    };

    while (i < lines.length) {
        const line = lines[i];
        const t = line.trim();

        if (t.startsWith('```')) {
            if (inCodeBlock) {
                content.push({
                    type: 'codeBlock',
                    attrs: { language: codeBlockLanguage || 'text' },
                    content: [{ type: 'text', text: codeBlockContent.join('\n') }],
                });
                codeBlockContent = [];
                codeBlockLanguage = '';
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
                codeBlockLanguage = t.slice(3).trim() || null;
            }
            i++;
            continue;
        }
        if (inCodeBlock) {
            codeBlockContent.push(line);
            i++;
            continue;
        }

        if (t.startsWith('###')) {
            content.push({
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: t.slice(3).trim() }],
            });
            i++;
            continue;
        }
        if (t.startsWith('##')) {
            content.push({
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: t.slice(2).trim() }],
            });
            i++;
            continue;
        }
        if (t.startsWith('#')) {
            content.push({
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: t.slice(1).trim() }],
            });
            i++;
            continue;
        }

        if (t.startsWith('- ') || t.startsWith('* ')) {
            const items = [];
            while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
                items.push({
                    type: 'listItem',
                    content: [{ type: 'paragraph', content: parseInline(lines[i].trim().slice(2).trim()) }],
                });
                i++;
            }
            if (items.length) content.push({ type: 'bulletList', content: items });
            continue;
        }

        if (t === '') {
            i++;
            continue;
        }

        content.push({ type: 'paragraph', content: parseInline(t) });
        i++;
    }

    if (inCodeBlock && codeBlockContent.length) {
        content.push({
            type: 'codeBlock',
            attrs: { language: codeBlockLanguage || 'text' },
            content: [{ type: 'text', text: codeBlockContent.join('\n') }],
        });
    }

    return content.length ? content : [{ type: 'paragraph', content: [] }];
}

function buildDescription(data) {
    const trackerUrl = `${TRACKER_URL}/admin/exceptions/${exceptionId}`;
    const requestUrl = data.requestUrl || 'unknown URL';
    const occurrences = data.occurrences || 'multiple';
    const firstSeen = data.firstSeen || 'N/A';
    const lastSeen = data.lastSeen || 'N/A';
    const env = data.environment || 'production';

    return `# Problem

Runtime error occurs when visiting \`${requestUrl}\` in firefly-web. The error "${data.message}" is thrown. Occurred ${occurrences} times.

**Tracker:** Exception #${exceptionId} - ${trackerUrl}

# Error Details

**Error Message:**

\`\`\`
${data.message}
\`\`\`

**Stack Trace:**

\`\`\`
${data.stackTrace}
\`\`\`

**Timestamp:** ${data.timestamp || 'N/A'} (First: ${firstSeen}, Last: ${lastSeen})

**Environment:** ${env} (Vercel Production)

# Expected Behavior

- The page at \`${requestUrl}\` should load without errors
- The underlying service/component should handle edge cases safely
- No runtime errors should be thrown

# Current Behavior

- Visiting \`${requestUrl}\` triggers an error: "${data.message}"
- Error is captured and reported to firefly-exception-tracker
- ${occurrences} occurrence(s) observed (First: ${firstSeen}, Last: ${lastSeen})

# Impact

- Users may experience broken functionality or degraded experience
- Error affects production environment and real users`;
}

async function main() {
    console.log(`Fetching exception #${exceptionId} from ${TRACKER_URL}...`);
    const html = await loginAndFetchException();
    const data = parseExceptionHtml(html);

    if (!data.message) {
        // Try alternative patterns - error type may vary (e.g. "Error" instead of "runtime_error")
        const msgMatchAlt = html.match(/<h3[^>]*>([^<]*)<\/h3>\s*<pre>([^<]*)<\/pre>/);
        if (msgMatchAlt) {
            data.message = msgMatchAlt[2].trim();
        }
    }
    if (!data.message) {
        console.error('Could not parse exception details from HTML');
        process.exit(1);
    }

    const title = `[firefly-exception-tracker] ${data.message}`;
    const description = buildDescription(data);
    const adfContent = markdownToADF(description);

    const issueData = {
        fields: {
            project: { key: 'FW' },
            summary: title,
            description: { type: 'doc', version: 1, content: adfContent },
            issuetype: { name: 'Task' },
            priority: { name: 'Medium' },
            labels: ['ai', 'firefly-exception-tracker'],
        },
    };

    console.log('\nCreating Jira issue with:');
    console.log(JSON.stringify(issueData, null, 2));

    if (dryRun) {
        console.log('\n[Dry-run] Issue not created.');
        process.exit(0);
    }

    if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
        console.error('JIRA_EMAIL and JIRA_API_TOKEN are required. Set them in .env.local');
        process.exit(1);
    }

    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const headers = {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };

    if (updateIssueKey) {
        const updateData = {
            fields: {
                summary: title,
                description: { type: 'doc', version: 1, content: adfContent },
            },
        };
        const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${updateIssueKey}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateData),
        });
        if (!res.ok) {
            const errText = await res.text();
            let msg = `Failed to update issue: ${res.status} ${res.statusText}`;
            try {
                const j = JSON.parse(errText);
                if (j.errorMessages) msg += '\n' + j.errorMessages.join('\n');
                if (j.errors) msg += '\n' + JSON.stringify(j.errors, null, 2);
            } catch {
                msg += '\n' + errText;
            }
            console.error(msg);
            process.exit(1);
        }
        console.log('\n✅ Issue updated successfully!');
        console.log(`Issue Key: ${updateIssueKey}`);
        console.log(`Issue URL: ${JIRA_BASE_URL}/browse/${updateIssueKey}`);
    } else {
        const res = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
            method: 'POST',
            headers,
            body: JSON.stringify(issueData),
        });

        if (!res.ok) {
            const errText = await res.text();
            let msg = `Failed to create issue: ${res.status} ${res.statusText}`;
            try {
                const j = JSON.parse(errText);
                if (j.errorMessages) msg += '\n' + j.errorMessages.join('\n');
                if (j.errors) msg += '\n' + JSON.stringify(j.errors, null, 2);
            } catch {
                msg += '\n' + errText;
            }
            console.error(msg);
            process.exit(1);
        }

        const result = await res.json();
        console.log('\n✅ Issue created successfully!');
        console.log(`Issue Key: ${result.key}`);
        console.log(`Issue URL: ${JIRA_BASE_URL}/browse/${result.key}`);
    }
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
