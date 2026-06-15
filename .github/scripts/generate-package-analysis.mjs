import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

/** Each entry produces `docs/PACKAGE_ANALYSIS.txt` for one application under `apps/`. */
const APPS = [
    {
        label: 'apps/web',
        outRelative: 'apps/web/docs/PACKAGE_ANALYSIS.txt',
        pkgJsonPaths: ['package.json', 'apps/web/package.json'],
        importerKeys: ['.', 'apps/web'],
    },
    {
        label: 'apps/wallet',
        outRelative: 'apps/wallet/docs/PACKAGE_ANALYSIS.txt',
        pkgJsonPaths: ['package.json', 'apps/wallet/package.json'],
        importerKeys: ['.', 'apps/wallet', 'apps/wallet/scripts'],
    },
];

function loadDirectDepNames(pkgJsonPaths) {
    const names = new Set();
    for (const rel of pkgJsonPaths) {
        const j = JSON.parse(readFileSync(path.join(repoRoot, rel), 'utf-8'));
        for (const k of Object.keys(j.dependencies || {})) names.add(k);
        for (const k of Object.keys(j.devDependencies || {})) names.add(k);
    }
    return names;
}

function collectRootPackageVersions(lockData, importerKeys) {
    const rootPackageVersions = new Map();
    for (const importerKey of importerKeys) {
        const importer = lockData.importers?.[importerKey];
        if (!importer) continue;
        for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
            const deps = importer[section];
            if (!deps) continue;
            for (const [pkgName, pkgRef] of Object.entries(deps)) {
                if (
                    pkgRef.version &&
                    typeof pkgRef.version === 'string' &&
                    !pkgRef.version.startsWith('workspace:') &&
                    !pkgRef.version.startsWith('link:')
                ) {
                    rootPackageVersions.set(pkgName, pkgRef.version);
                }
            }
        }
    }
    return rootPackageVersions;
}

// Read and parse pnpm-lock.yaml
const lockFileContent = readFileSync(path.join(repoRoot, 'pnpm-lock.yaml'), 'utf-8');
const lockData = yaml.load(lockFileContent);

// Extract package name and version from a pnpm lockfile key.
// Handles lockfileVersion 6.0 (`/name@version(peers)`) and 9.0
// (`name@version(peers)`, no leading slash), including scoped names.
function parsePackagePath(pkgPath) {
    let key = pkgPath.replace(/^\//, '');
    // Drop any peer-dependency or patch context, e.g. "(react@19.0.0)" / "(patch_hash=...)".
    const parenIndex = key.indexOf('(');
    if (parenIndex !== -1) key = key.slice(0, parenIndex);
    // Split on the last "@" so scoped names like "@scope/pkg@1.2.3" parse correctly.
    const atIndex = key.lastIndexOf('@');
    if (atIndex <= 0) return null;
    const name = key.slice(0, atIndex);
    const version = key.slice(atIndex + 1);
    if (!name || !version) return null;
    return { name, version };
}

// lockfileVersion 9.0 moves the resolved dependency graph into `snapshots`;
// 6.0 keeps it inline in `packages`. Use whichever this lockfile provides.
const dependencyGraph = lockData.snapshots ?? lockData.packages ?? {};

const packageDependencies = new Map();
const reverseDependencies = new Map();
const packageInfo = new Map();

if (dependencyGraph) {
    for (const [pkgPath] of Object.entries(dependencyGraph)) {
        const parsed = parsePackagePath(pkgPath);
        if (!parsed || parsed.name.startsWith('workspace:')) continue;

        const { name, version } = parsed;

        packageInfo.set(pkgPath, { name, version });

        if (!packageDependencies.has(pkgPath)) {
            packageDependencies.set(pkgPath, new Set());
        }
    }
}

const pathsByNameVersion = new Map();

function nameVersionKey(name, version) {
    return `${name}@${version}`;
}

for (const [pkgPath, info] of packageInfo.entries()) {
    const key = nameVersionKey(info.name, info.version);
    if (!pathsByNameVersion.has(key)) {
        pathsByNameVersion.set(key, []);
    }
    pathsByNameVersion.get(key).push(pkgPath);
}

function resolveDependencyPath(depName, depVersion) {
    const baseVersion = depVersion.split('(')[0];
    return pathsByNameVersion.get(nameVersionKey(depName, baseVersion)) ?? [];
}

if (dependencyGraph) {
    for (const [pkgPath, pkgData] of Object.entries(dependencyGraph)) {
        const parsed = parsePackagePath(pkgPath);
        if (!parsed || parsed.name.startsWith('workspace:')) continue;

        const allDeps = {
            ...(pkgData.dependencies || {}),
            ...(pkgData.optionalDependencies || {}),
        };

        for (const [depName, depVersion] of Object.entries(allDeps)) {
            const depPaths = resolveDependencyPath(depName, depVersion);

            for (const depPath of depPaths) {
                packageDependencies.get(pkgPath)?.add(depPath);

                if (!reverseDependencies.has(depPath)) {
                    reverseDependencies.set(depPath, new Set());
                }
                reverseDependencies.get(depPath).add(pkgPath);
            }
        }
    }
}

/** Stop after this many complete chains (downstream only shows a few unique chains). */
const MAX_CHAINS_PER_PACKAGE = 16;

function computeRootPackagePaths(directDeps, rootPackageVersions) {
    const rootPackagePaths = new Set();
    for (const [pkgPath, info] of packageInfo.entries()) {
        if (!directDeps.has(info.name)) continue;
        const rootVersion = rootPackageVersions.get(info.name);
        if (rootVersion) {
            const baseRootVersion = rootVersion.split('(')[0];
            if (info.version === baseRootVersion) {
                rootPackagePaths.add(pkgPath);
            }
        } else {
            rootPackagePaths.add(pkgPath);
        }
    }
    return rootPackagePaths;
}

function findDependencyChains(
    targetPkgPath,
    rootPackagePaths,
    visited = new Set(),
    currentPath = [],
    state = { found: 0 },
) {
    if (state.found >= MAX_CHAINS_PER_PACKAGE) {
        return [];
    }

    const chains = [];

    if (visited.has(targetPkgPath)) {
        return chains;
    }

    const newVisited = new Set(visited);
    newVisited.add(targetPkgPath);
    const newPath = [...currentPath, targetPkgPath];

    if (rootPackagePaths.has(targetPkgPath)) {
        state.found += 1;
        chains.push(newPath);
        return chains;
    }

    const parents = reverseDependencies.get(targetPkgPath) || new Set();
    for (const parent of parents) {
        if (state.found >= MAX_CHAINS_PER_PACKAGE) break;
        const parentChains = findDependencyChains(parent, rootPackagePaths, newVisited, newPath, state);
        chains.push(...parentChains);
    }

    return chains;
}

function generateAnalysisText(appLabel, directDeps, rootPackagePaths) {
    const packages = new Map();

    for (const [pkgPath, info] of packageInfo.entries()) {
        const { name, version } = info;

        if (!packages.has(name)) {
            packages.set(name, {
                versions: new Set(),
                isDirect: directDeps.has(name),
                chainsByVersion: new Map(),
            });
        }

        const pkgData = packages.get(name);
        pkgData.versions.add(version);
        pkgData.isDirect = directDeps.has(name);

        const chains = findDependencyChains(pkgPath, rootPackagePaths, new Set(), [], { found: 0 });

        if (!pkgData.chainsByVersion.has(version)) {
            pkgData.chainsByVersion.set(version, []);
        }
        pkgData.chainsByVersion.get(version).push(...chains);
    }

    const sortedPackages = Array.from(packages.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    const multipleVersions = sortedPackages.filter(([, info]) => info.versions.size > 1);
    const singleVersion = sortedPackages.filter(([, info]) => info.versions.size === 1);

    let output = `Package Analysis
================

Application: ${appLabel}

Total packages: ${sortedPackages.length}
Packages with multiple versions: ${multipleVersions.length}

Legend:
  * = Direct dependency (listed in package.json for this app's scope)
  Multiple versions shown as: package-name@version1,version2

Packages with Multiple Versions
--------------------------------
`;

    for (const [name, info] of multipleVersions) {
        const versions = Array.from(info.versions)
            .sort((a, b) => a.localeCompare(b))
            .join(',');
        const prefix = info.isDirect ? '*' : ' ';
        output += `${prefix}${name}@${versions}\n`;
    }

    output += `\nPackages with Single Version\n----------------------------\n`;

    for (const [name, info] of singleVersion) {
        const version = Array.from(info.versions)[0];
        const prefix = info.isDirect ? '*' : ' ';
        output += `${prefix}${name}@${version}\n`;
    }

    return output;
}

for (const app of APPS) {
    const directDeps = loadDirectDepNames(app.pkgJsonPaths);
    const rootPackageVersions = collectRootPackageVersions(lockData, app.importerKeys);
    const rootPackagePaths = computeRootPackagePaths(directDeps, rootPackageVersions);
    const output = generateAnalysisText(app.label, directDeps, rootPackagePaths);

    const outFile = path.join(repoRoot, app.outRelative);
    mkdirSync(path.dirname(outFile), { recursive: true });
    writeFileSync(outFile, output);
    console.log(`Generated ${outFile} (${app.label})`);
}
