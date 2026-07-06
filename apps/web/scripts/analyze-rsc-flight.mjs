#!/usr/bin/env node
/**
 * Fetch and analyze RSC flight payloads for client-reference chunk-manifest bloat.
 *
 * Usage:
 *   node apps/web/scripts/analyze-rsc-flight.mjs https://firefly.social/profile/x/Gitega
 *   node apps/web/scripts/analyze-rsc-flight.mjs --file /tmp/payload.txt
 *   curl -s URL -H 'Accept: text/x-component' -H 'RSC: 1' | node apps/web/scripts/analyze-rsc-flight.mjs --stdin
 */
import fs from 'node:fs';

import { analyzeRscFlight, renderRscFlightMarkdown } from './lib/analyze-rsc-flight.mjs';

function printHelp() {
    console.log(`Analyze RSC flight payloads for chunk-manifest duplication.

Options:
  <url>              Fetch with Accept: text/x-component + RSC: 1
  --file <path>      Read payload from a saved file
  --stdin            Read payload from stdin
  --markdown         Print markdown report (default: JSON)
  --help             Show this help
`);
}

function parseArgs(argv) {
    const options = {
        url: null,
        file: null,
        stdin: false,
        markdown: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        switch (arg) {
            case '--file':
                options.file = argv[++index];
                break;
            case '--stdin':
                options.stdin = true;
                break;
            case '--markdown':
                options.markdown = true;
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                if (arg.startsWith('-')) {
                    throw new Error(`Unknown argument: ${arg}`);
                }
                options.url = arg;
        }
    }

    if (!options.url && !options.file && !options.stdin) {
        printHelp();
        process.exit(1);
    }

    return options;
}

async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

async function loadPayload(options) {
    if (options.stdin) {
        return readStdin();
    }
    if (options.file) {
        return fs.readFileSync(options.file, 'utf8');
    }
    const response = await fetch(options.url, {
        headers: {
            Accept: 'text/x-component',
            RSC: '1',
            'User-Agent': 'firefly-rsc-analyzer/1.0',
        },
    });
    const payload = await response.text();
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${options.url} (${payload.length} bytes)`);
    }
    return payload;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const payload = await loadPayload(options);
    const label = options.url ?? options.file ?? 'stdin';
    const analysis = analyzeRscFlight(payload);

    if (options.markdown) {
        process.stdout.write(renderRscFlightMarkdown(label, analysis));
        return;
    }

    process.stdout.write(`${JSON.stringify({ path: label, ...analysis }, null, 2)}\n`);
}

main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : error);
    process.exit(1);
});
