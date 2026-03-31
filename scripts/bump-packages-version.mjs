#!/usr/bin/env node
/**
 * Sets the same semver on every package under packages/* (bump from current max).
 * Usage: node scripts/bump-packages-version.mjs major|minor|patch
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bumpType = process.argv[2];
if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('Usage: node scripts/bump-packages-version.mjs <major|minor|patch>');
    process.exit(1);
}

/** @param {string} v */
function parseSemver(v) {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
    if (!m) {
        throw new Error(`Invalid semver: ${v}`);
    }
    return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

/** @param {string} a */
/** @param {string} b */
function compareSemver(a, b) {
    const pa = parseSemver(a);
    const pb = parseSemver(b);
    if (pa.major !== pb.major) return pa.major - pb.major;
    if (pa.minor !== pb.minor) return pa.minor - pb.minor;
    return pa.patch - pb.patch;
}

/** @param {string} version */
/** @param {'major' | 'minor' | 'patch'} type */
function bump(version, type) {
    const { major, minor, patch } = parseSemver(version);
    if (type === 'major') return `${major + 1}.0.0`;
    if (type === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
}

const packagesDir = path.join(__dirname, '..', 'packages');
const dirs = fs.readdirSync(packagesDir, { withFileTypes: true }).filter((d) => d.isDirectory());

/** @type {{ path: string, name: string, version: string }[]} */
const targets = [];
for (const d of dirs) {
    const jsonPath = path.join(packagesDir, d.name, 'package.json');
    if (!fs.existsSync(jsonPath)) continue;
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const pkg = JSON.parse(raw);
    if (typeof pkg.version !== 'string') continue;
    targets.push({ path: jsonPath, name: pkg.name ?? d.name, version: pkg.version });
}

if (targets.length === 0) {
    console.error('No packages with a version field found under packages/');
    process.exit(1);
}

let maxVersion = targets[0].version;
for (const t of targets) {
    if (compareSemver(t.version, maxVersion) > 0) maxVersion = t.version;
}

for (const t of targets) {
    if (t.version !== maxVersion) {
        console.warn(`Warning: ${t.name} was ${t.version}; aligning bump from workspace max ${maxVersion}`);
    }
}

const newVersion = bump(maxVersion, bumpType);

for (const t of targets) {
    const jsonPath = t.path;
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const pkg = JSON.parse(raw);
    pkg.version = newVersion;
    fs.writeFileSync(jsonPath, `${JSON.stringify(pkg, null, 4)}\n`, 'utf8');
}

console.log(newVersion);
