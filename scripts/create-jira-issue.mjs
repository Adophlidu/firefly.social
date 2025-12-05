#!/usr/bin/env node

/**
 * Script to create a Jira issue using the REST API
 *
 * Usage:
 *   node scripts/create-jira-issue.mjs --title "Issue Title" --description "Issue description" [options]
 *
 * Options:
 *   --title, -t          Issue title/summary (required)
 *   --description, -d    Issue description (required)
 *   --type, -T           Issue type (default: Task)
 *   --priority, -p       Priority (default: Medium)
 *   --assignee, -a       Assignee email or accountId
 *   --labels, -l         Comma-separated labels
 *   --project, -P        Project key (default: FW)
 *   --dry-run            Show what would be created without actually creating
 *
 * Environment variables (loaded from .env.local or environment):
 *   JIRA_EMAIL           Your Jira email address
 *   JIRA_API_TOKEN       Your Jira API token (get from https://id.atlassian.com/manage-profile/security/api-tokens)
 *   JIRA_BASE_URL        Jira base URL (default: https://mask.atlassian.net)
 */

import { parseArgs } from 'node:util';
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
            // Handle both "export KEY=VALUE" and "KEY=VALUE" formats
            const match = trimmed.match(/^(?:export\s+)?(\w+)=(.*)$/);
            if (match) {
                const key = match[1];
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                envVars[key] = value;
            }
        }
    });
    // Set environment variables (don't override existing env vars)
    Object.keys(envVars).forEach((key) => {
        if (!process.env[key]) {
            process.env[key] = envVars[key];
        }
    });
} catch (error) {
    // .env.local might not exist, that's okay
    if (error.code !== 'ENOENT') {
        console.warn(`Warning: Could not read .env.local: ${error.message}`);
    }
}

// Also try loading with dotenv as fallback (for standard KEY=VALUE format)
config({ path: envPath, override: false });

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || 'https://mask.atlassian.net';
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const PROJECT_KEY = 'FW';

// Parse command line arguments
const { values, positionals } = parseArgs({
    options: {
        title: { type: 'string', short: 't' },
        description: { type: 'string', short: 'd' },
        type: { type: 'string', short: 'T', default: 'Task' },
        priority: { type: 'string', short: 'p', default: 'Medium' },
        assignee: { type: 'string', short: 'a' },
        labels: { type: 'string', short: 'l' },
        'fix-version': { type: 'string' },
        project: { type: 'string', short: 'P', default: PROJECT_KEY },
        'dry-run': { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
});

if (values.help) {
    console.log(`
Usage: node scripts/create-jira-issue.mjs [options]

Options:
  -t, --title <text>          Issue title/summary (required)
  -d, --description <text>    Issue description (required)
  -T, --type <type>           Issue type (default: Task)
  -p, --priority <priority>   Priority: Lowest, Low, Medium, High, Highest (default: Medium)
  -a, --assignee <email>      Assignee email or accountId
  -l, --labels <labels>       Comma-separated labels
      --fix-version <version> Fix version name
  -P, --project <key>         Project key (default: FW)
      --dry-run               Show what would be created without actually creating
  -h, --help                  Show this help message

Environment variables (loaded from .env.local or environment):
  JIRA_EMAIL                  Your Jira email address
  JIRA_API_TOKEN              Your Jira API token
  JIRA_BASE_URL               Jira base URL (default: https://mask.atlassian.net)

The script automatically loads environment variables from .env.local file.
You can also set them in your environment or pass them inline.

Example:
  node scripts/create-jira-issue.mjs \\
    --title "Fix bug in login" \\
    --description "Users cannot log in with email" \\
    --type Bug \\
    --priority High \\
    --labels "bug,urgent"
`);
    process.exit(0);
}

// Validate required arguments
if (!values.title || !values.description) {
    console.error('Error: --title and --description are required');
    console.error('Use --help for usage information');
    process.exit(1);
}

// Validate credentials
if (!values['dry-run'] && (!JIRA_EMAIL || !JIRA_API_TOKEN)) {
    console.error('Error: JIRA_EMAIL and JIRA_API_TOKEN environment variables are required');
    console.error('Get your API token from: https://id.atlassian.com/manage-profile/security/api-tokens');
    process.exit(1);
}

/**
 * Convert markdown text to Atlassian Document Format (ADF)
 */
function markdownToADF(markdown) {
    const content = [];
    const lines = markdown.split('\n');
    let i = 0;
    let inCodeBlock = false;
    let codeBlockLanguage = '';
    let codeBlockContent = [];

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Handle code blocks
        if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
                // End code block
                content.push({
                    type: 'codeBlock',
                    attrs: { language: codeBlockLanguage || null },
                    content: [
                        {
                            type: 'text',
                            text: codeBlockContent.join('\n'),
                        },
                    ],
                });
                codeBlockContent = [];
                codeBlockLanguage = '';
                inCodeBlock = false;
            } else {
                // Start code block
                inCodeBlock = true;
                codeBlockLanguage = trimmed.slice(3).trim() || null;
            }
            i++;
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            i++;
            continue;
        }

        // Handle headers
        if (trimmed.startsWith('###')) {
            content.push({
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: trimmed.slice(3).trim() }],
            });
            i++;
            continue;
        }

        if (trimmed.startsWith('##')) {
            content.push({
                type: 'heading',
                attrs: { level: 2 },
                content: [{ type: 'text', text: trimmed.slice(2).trim() }],
            });
            i++;
            continue;
        }

        if (trimmed.startsWith('#')) {
            content.push({
                type: 'heading',
                attrs: { level: 1 },
                content: [{ type: 'text', text: trimmed.slice(1).trim() }],
            });
            i++;
            continue;
        }

        // Handle bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listItems = [];
            while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
                const itemText = lines[i].trim().slice(2).trim();
                listItems.push({
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: parseInlineFormatting(itemText),
                        },
                    ],
                });
                i++;
            }
            if (listItems.length > 0) {
                content.push({
                    type: 'bulletList',
                    content: listItems,
                });
            }
            continue;
        }

        // Handle empty lines
        if (trimmed === '') {
            i++;
            continue;
        }

        // Regular paragraph
        const paragraphContent = parseInlineFormatting(trimmed);
        if (paragraphContent.length > 0) {
            content.push({
                type: 'paragraph',
                content: paragraphContent,
            });
        }
        i++;
    }

    // Handle trailing code block
    if (inCodeBlock && codeBlockContent.length > 0) {
        content.push({
            type: 'codeBlock',
            attrs: { language: codeBlockLanguage || null },
            content: [
                {
                    type: 'text',
                    text: codeBlockContent.join('\n'),
                },
            ],
        });
    }

    return content.length > 0 ? content : [{ type: 'paragraph', content: [] }];
}

/**
 * Parse inline formatting (bold, inline code)
 */
function parseInlineFormatting(text) {
    const content = [];
    let i = 0;
    let currentText = '';

    while (i < text.length) {
        // Handle inline code `code`
        if (text[i] === '`' && (i === 0 || text[i - 1] !== '\\')) {
            // Flush current text
            if (currentText) {
                content.push({ type: 'text', text: currentText });
                currentText = '';
            }

            // Find closing backtick
            const endIndex = text.indexOf('`', i + 1);
            if (endIndex !== -1) {
                const codeText = text.substring(i + 1, endIndex);
                content.push({
                    type: 'text',
                    text: codeText,
                    marks: [{ type: 'code' }],
                });
                i = endIndex + 1;
                continue;
            }
        }

        // Handle bold **text**
        if (text.substring(i, i + 2) === '**' && (i === 0 || text[i - 1] !== '\\')) {
            // Flush current text
            if (currentText) {
                content.push({ type: 'text', text: currentText });
                currentText = '';
            }

            // Find closing **
            const endIndex = text.indexOf('**', i + 2);
            if (endIndex !== -1) {
                const boldText = text.substring(i + 2, endIndex);
                content.push({
                    type: 'text',
                    text: boldText,
                    marks: [{ type: 'strong' }],
                });
                i = endIndex + 2;
                continue;
            }
        }

        currentText += text[i];
        i++;
    }

    // Flush remaining text
    if (currentText) {
        content.push({ type: 'text', text: currentText });
    }

    return content.length > 0 ? content : [{ type: 'text', text: text }];
}

// Prepare issue data
const adfDescription = markdownToADF(values.description);
const issueData = {
    fields: {
        project: {
            key: values.project || PROJECT_KEY,
        },
        summary: values.title,
        description: {
            type: 'doc',
            version: 1,
            content: adfDescription,
        },
        issuetype: {
            name: values.type || 'Task',
        },
        priority: {
            name: values.priority || 'Medium',
        },
    },
};

// Add labels if provided
if (values.labels) {
    issueData.fields.labels = values.labels.split(',').map((l) => l.trim());
}

// Add assignee if provided
if (values.assignee) {
    // Try to get accountId from email
    issueData.fields.assignee = {
        accountId: values.assignee,
    };
}

// Add fix version if provided
if (values['fix-version']) {
    issueData.fields.fixVersions = [
        {
            name: values['fix-version'],
        },
    ];
}

// Show what will be created
console.log('Creating Jira issue with the following data:');
console.log(JSON.stringify(issueData, null, 2));
console.log('');

if (values['dry-run']) {
    console.log('Dry-run mode: Issue not created');
    process.exit(0);
}

// Create the issue
try {
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(issueData),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to create issue: ${response.status} ${response.statusText}`;

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

    const result = await response.json();
    console.log('✅ Issue created successfully!');
    console.log(`Issue Key: ${result.key}`);
    console.log(`Issue URL: ${JIRA_BASE_URL}/browse/${result.key}`);
    console.log(`Issue ID: ${result.id}`);
} catch (error) {
    console.error('Error creating issue:', error.message);
    process.exit(1);
}
