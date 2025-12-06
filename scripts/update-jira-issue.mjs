#!/usr/bin/env node

/**
 * Script to update a Jira issue description using the REST API
 */

import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = resolve(__dirname, '..', '.env.local');
try {
    const envFile = readFileSync(envPath, 'utf-8');
    const envVars = {};
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
                envVars[key] = value;
            }
        }
    });
    Object.keys(envVars).forEach((key) => {
        if (!process.env[key]) {
            process.env[key] = envVars[key];
        }
    });
} catch (error) {
    if (error.code !== 'ENOENT') {
        console.warn(`Warning: Could not read .env.local: ${error.message}`);
    }
}

config({ path: envPath, override: false });

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://mask.atlassian.net';
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const ISSUE_KEY = process.argv[2] || 'FW-6275';

// Properly formatted ADF content
const adfDescription = {
    type: 'doc',
    version: 1,
    content: [
        {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Problem' }],
        },
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: 'Error occurs when visiting ' },
                { type: 'text', text: '/profile/lens/mkoijjlloo', marks: [{ type: 'code' }] },
                {
                    type: 'text',
                    text: ' on Vercel, resulting in a 502 Bad Gateway error and preventing the profile page from loading.',
                },
            ],
        },
        {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Error Details' }],
        },
        {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Error Message:', marks: [{ type: 'strong' }] }],
        },
        {
            type: 'codeBlock',
            attrs: { language: 'text' },
            content: [
                {
                    type: 'text',
                    text: '[fetch error]: https://firefly.r2d2.to/metadata/post?source=twitter&postId=1906718935778545964&pathname=%2Fpost%2Ftwitter%2F1906718935778545964 502 Bad Gateway [fetch] failed to fetch: GET 502 Bad Gateway https://firefly.r2d2.to/metadata/post?source=twitter&postId=1906718935778545964&pathname=%2Fpost%2Ftwitter%2F1906718935778545964\n\n{"success":false,"error":{"code":40001,"message":"Cannot read properties of undefined (reading \'match\')"}}',
                },
            ],
        },
        {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Stack Trace:', marks: [{ type: 'strong' }] }],
        },
        {
            type: 'codeBlock',
            attrs: { language: 'text' },
            content: [
                {
                    type: 'text',
                    text: '2025-12-06 10:22:33.218 [error] [fetch error]: https://firefly.r2d2.to/metadata/post?source=twitter&postId=1906718935778545964&pathname=%2Fpost%2Ftwitter%2F1906718935778545964 502 Bad Gateway [fetch] failed to fetch: GET 502 Bad Gateway https://firefly.r2d2.to/metadata/post?source=twitter&postId=1906718935778545964&pathname=%2Fpost%2Ftwitter%2F1906718935778545964\n\n{"success":false,"error":{"code":40001,"message":"Cannot read properties of undefined (reading \'match\')"}}\n\n{"success":false,"error":{"code":40001,"message":"Cannot read properties of undefined (reading \'match\')"}}',
                },
            ],
        },
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: 'Timestamp:', marks: [{ type: 'strong' }] },
                { type: 'text', text: ' 2025-12-06 10:22:33' },
            ],
        },
        {
            type: 'paragraph',
            content: [
                { type: 'text', text: 'Environment:', marks: [{ type: 'strong' }] },
                { type: 'text', text: ' Vercel Production' },
            ],
        },
        {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Expected Behavior' }],
        },
        {
            type: 'bulletList',
            content: [
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                { type: 'text', text: 'The profile page at ' },
                                { type: 'text', text: '/profile/lens/mkoijjlloo', marks: [{ type: 'code' }] },
                                { type: 'text', text: ' should load successfully' },
                            ],
                        },
                    ],
                },
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Metadata API calls should return valid responses' }],
                        },
                    ],
                },
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'No 502 Bad Gateway errors should occur' }],
                        },
                    ],
                },
            ],
        },
        {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Current Behavior' }],
        },
        {
            type: 'bulletList',
            content: [
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                { type: 'text', text: 'Visiting ' },
                                { type: 'text', text: '/profile/lens/mkoijjlloo', marks: [{ type: 'code' }] },
                                { type: 'text', text: ' results in a 502 Bad Gateway error' },
                            ],
                        },
                    ],
                },
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                { type: 'text', text: 'The metadata API endpoint ' },
                                {
                                    type: 'text',
                                    text: 'https://firefly.r2d2.to/metadata/post',
                                    marks: [{ type: 'code' }],
                                },
                                { type: 'text', text: ' returns an error with code 40001' },
                            ],
                        },
                    ],
                },
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Error message indicates: "Cannot read properties of undefined (reading \'match\')"',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'The error appears to be related to processing Twitter post metadata',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Impact' }],
        },
        {
            type: 'bulletList',
            content: [
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Users cannot view the profile page for the specified Lens profile',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'The error suggests a potential issue with metadata processing for Twitter posts',
                                },
                            ],
                        },
                    ],
                },
                {
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Affects user experience and functionality of the profile viewing feature',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

const updateData = {
    fields: {
        description: adfDescription,
    },
};

if (!JIRA_EMAIL || !JIRA_API_TOKEN) {
    console.error('Error: JIRA_EMAIL and JIRA_API_TOKEN environment variables are required');
    process.exit(1);
}

try {
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${ISSUE_KEY}`, {
        method: 'PUT',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(updateData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to update issue: ${response.status} ${response.statusText}`;

        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.errorMessages) {
                errorMessage += '\n' + errorJson.errorMessages.join('\n');
            }
            if (errorJson.errors) {
                errorMessage += '\nErrors: ' + JSON.stringify(errorJson.errors, null, 2);
            }
        } catch {
            errorMessage += '\n' + errorText;
        }

        console.error(errorMessage);
        process.exit(1);
    }

    console.log(`✅ Issue ${ISSUE_KEY} updated successfully!`);
    console.log(`Issue URL: ${JIRA_BASE_URL}/browse/${ISSUE_KEY}`);
} catch (error) {
    console.error('Error updating issue:', error.message);
    process.exit(1);
}
