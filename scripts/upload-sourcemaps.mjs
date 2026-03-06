#!/usr/bin/env node
/**
 * Upload sourcemaps to Exception Tracker after build
 *
 * Usage:
 *   node scripts/upload-sourcemaps.mjs [options]
 *
 * Environment variables:
 *   EXCEPTION_TRACKER_URL - Base URL of the exception tracker (default: https://firefly-exception-tracker.r2d2.to)
 *   EXCEPTION_TRACKER_API_KEY - API key for authentication (required)
 *   VERCEL_GIT_COMMIT_SHA - Commit hash (auto-detected from git if not set)
 *   VERCEL_GIT_REPO_SLUG - Repository name for service_name
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { createWriteStream, mkdirSync, existsSync, rmSync } from 'fs';
import archiver from 'archiver';

const EXCEPTION_TRACKER_URL = process.env.EXCEPTION_TRACKER_URL || 'https://firefly-exception-tracker.r2d2.to';
const API_KEY = process.env.EXCEPTION_TRACKER_API_KEY;

if (!API_KEY) {
    console.error('ERROR: EXCEPTION_TRACKER_API_KEY environment variable is required');
    process.exit(1);
}

// Get commit hash
const commitHash = process.env.VERCEL_GIT_COMMIT_SHA || execSync('git rev-parse HEAD').toString().trim();

// Get service name
const serviceName = process.env.VERCEL_GIT_REPO_SLUG || process.env.SERVICE_NAME || 'mask.social';

console.log(`Uploading sourcemaps for commit: ${commitHash.slice(0, 7)}`);
console.log(`Service: ${serviceName}`);
console.log(`Target: ${EXCEPTION_TRACKER_URL}`);

// Find all .map files in .next directory
const nextDir = path.join(process.cwd(), '.next');
const mapFiles = await glob('**/*.js.map', { cwd: nextDir, absolute: true });

if (mapFiles.length === 0) {
    console.log('No sourcemap files found in .next directory');
    process.exit(0);
}

console.log(`Found ${mapFiles.length} sourcemap files`);

// Calculate total size
let totalSize = 0;
for (const filePath of mapFiles) {
    const stat = await fs.stat(filePath);
    totalSize += stat.size;
}
console.log(`Total sourcemap size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

// Create temp directory for zip
const tempDir = path.join(process.cwd(), '.sourcemap-temp');
const zipPath = path.join(tempDir, 'sourcemaps.zip');

// Clean up temp dir if exists
if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true });
}
mkdirSync(tempDir, { recursive: true });

// Create zip file
console.log('Creating zip archive...');
await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`Zip created: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
        resolve();
    });

    archive.on('error', reject);
    archive.pipe(output);

    for (const filePath of mapFiles) {
        const relativePath = path.relative(nextDir, filePath);
        archive.file(filePath, { name: relativePath });
    }

    archive.finalize();
});

// Upload zip file
const zipContent = await fs.readFile(zipPath);
const zipSizeMB = (zipContent.length / 1024 / 1024).toFixed(2);
console.log(`Uploading zip archive (${zipSizeMB} MB)...`);
const formData = new FormData();
formData.append('commit_hash', commitHash);
formData.append('service_name', serviceName);
formData.append('zip', new Blob([zipContent]), 'sourcemaps.zip');

const response = await fetch(`${EXCEPTION_TRACKER_URL}/api/v1/sourcemaps/upload-zip`, {
    method: 'POST',
    headers: {
        'X-API-Key': API_KEY,
    },
    body: formData,
});

// Clean up temp files
rmSync(tempDir, { recursive: true });

if (!response.ok) {
    const error = await response.text();
    console.error(`Upload failed: ${response.status} ${response.statusText}`);
    console.error(error);
    process.exit(1);
}

const result = await response.json();
console.log(`✓ Uploaded ${result.files_stored} sourcemap files`);

if (result.errors && result.errors.length > 0) {
    console.warn('Warnings:');
    for (const err of result.errors) {
        console.warn(`  - ${err}`);
    }
}
