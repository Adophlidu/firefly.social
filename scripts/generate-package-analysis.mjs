import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import yaml from 'js-yaml';

// Read package.json to know which packages are direct dependencies
const pkgJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const directDeps = new Set([...Object.keys(pkgJson.dependencies || {}), ...Object.keys(pkgJson.devDependencies || {})]);

// Read and parse pnpm-lock.yaml
const lockFileContent = readFileSync('pnpm-lock.yaml', 'utf-8');
const lockData = yaml.load(lockFileContent);

// Helper function to extract package name and version from pnpm path
function parsePackagePath(pkgPath) {
    // Format: /package-name@version(peer1@version1)(peer2@version2)...
    const match = pkgPath.match(/^\/(@[^/@]+\/[^/@]+|[^/@]+)@([^/(]+)/);
    if (match) {
        return { name: match[1], version: match[2] };
    }
    // Alternative format: /package-name/version
    const altMatch = pkgPath.match(/^\/(@[^/]+\/[^/]+|[^/@]+)\/([^/(]+)/);
    if (altMatch) {
        return { name: altMatch[1], version: altMatch[2] };
    }
    return null;
}

// Build dependency graph: package -> set of packages it depends on
const packageDependencies = new Map(); // pkgPath -> Set of dependency pkgPaths
// Build reverse dependency graph: package -> set of packages that depend on it
const reverseDependencies = new Map(); // pkgPath -> Set of parent pkgPaths
// Map package name to all its versions (pkgPath)
const packageVersions = new Map(); // packageName -> Set of pkgPaths
// Map pkgPath to package info
const packageInfo = new Map(); // pkgPath -> { name, version, isDirect }

// First pass: collect all packages and their basic info
if (lockData.packages) {
    for (const [pkgPath, pkgData] of Object.entries(lockData.packages)) {
        const parsed = parsePackagePath(pkgPath);
        if (!parsed || parsed.name.startsWith('workspace:')) continue;

        const { name, version } = parsed;

        packageInfo.set(pkgPath, {
            name,
            version,
            isDirect: directDeps.has(name),
        });

        if (!packageVersions.has(name)) {
            packageVersions.set(name, new Set());
        }
        packageVersions.get(name).add(pkgPath);

        // Initialize dependency maps
        if (!packageDependencies.has(pkgPath)) {
            packageDependencies.set(pkgPath, new Set());
        }
    }
}

// Helper function to resolve a dependency to package path(s)
// depVersion format: "version" or "version(peer1@v1)(peer2@v2)"
function resolveDependencyPath(depName, depVersion) {
    // Extract base version (before peer dependencies)
    const baseVersion = depVersion.split('(')[0];
    const matchingPaths = [];

    for (const [depPath, depInfo] of packageInfo.entries()) {
        if (depInfo.name === depName && depInfo.version === baseVersion) {
            matchingPaths.push(depPath);
        }
    }

    return matchingPaths;
}

// Second pass: build dependency relationships
if (lockData.packages) {
    for (const [pkgPath, pkgData] of Object.entries(lockData.packages)) {
        const parsed = parsePackagePath(pkgPath);
        if (!parsed || parsed.name.startsWith('workspace:')) continue;

        // Process dependencies
        const allDeps = {
            ...(pkgData.dependencies || {}),
            ...(pkgData.optionalDependencies || {}),
        };

        for (const [depName, depVersion] of Object.entries(allDeps)) {
            // Resolve dependency to actual package path(s)
            const depPaths = resolveDependencyPath(depName, depVersion);

            for (const depPath of depPaths) {
                packageDependencies.get(pkgPath)?.add(depPath);

                // Build reverse graph
                if (!reverseDependencies.has(depPath)) {
                    reverseDependencies.set(depPath, new Set());
                }
                reverseDependencies.get(depPath).add(pkgPath);
            }
        }
    }
}

// Get root package paths (packages directly listed in package.json)
// Also check importers section to get the exact versions used
const rootPackagePaths = new Set();
const rootPackageVersions = new Map(); // packageName -> version from importers

if (lockData.importers && lockData.importers['.']) {
    const rootImporter = lockData.importers['.'];
    if (rootImporter.dependencies) {
        for (const [pkgName, pkgRef] of Object.entries(rootImporter.dependencies)) {
            if (pkgRef.version && typeof pkgRef.version === 'string' && !pkgRef.version.startsWith('workspace:')) {
                rootPackageVersions.set(pkgName, pkgRef.version);
            }
        }
    }
    if (rootImporter.devDependencies) {
        for (const [pkgName, pkgRef] of Object.entries(rootImporter.devDependencies)) {
            if (pkgRef.version && typeof pkgRef.version === 'string' && !pkgRef.version.startsWith('workspace:')) {
                rootPackageVersions.set(pkgName, pkgRef.version);
            }
        }
    }
}

// Match root package versions to actual package paths
for (const [pkgPath, info] of packageInfo.entries()) {
    if (info.isDirect) {
        // Check if this version matches the root version
        const rootVersion = rootPackageVersions.get(info.name);
        if (rootVersion) {
            // Extract base version from rootVersion (might have peer deps)
            const baseRootVersion = rootVersion.split('(')[0];
            if (info.version === baseRootVersion) {
                rootPackagePaths.add(pkgPath);
            }
        } else {
            // Fallback: if it's a direct dependency, add it
            rootPackagePaths.add(pkgPath);
        }
    }
}

// Function to find dependency chains from a package to root dependencies
function findDependencyChains(targetPkgPath, visited = new Set(), currentPath = []) {
    const chains = [];

    // If we've already visited this node in this path, skip (avoid cycles)
    if (visited.has(targetPkgPath)) {
        return chains;
    }

    const newVisited = new Set(visited);
    newVisited.add(targetPkgPath);
    const newPath = [...currentPath, targetPkgPath];

    // If this is a root dependency, we found a chain
    if (rootPackagePaths.has(targetPkgPath)) {
        chains.push(newPath);
        return chains;
    }

    // Otherwise, continue searching up the dependency tree
    const parents = reverseDependencies.get(targetPkgPath) || new Set();
    for (const parent of parents) {
        const parentChains = findDependencyChains(parent, newVisited, newPath);
        chains.push(...parentChains);
    }

    return chains;
}

// Function to escape HTML entities in text
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Function to format a dependency chain
function formatChain(chain) {
    const parts = [];
    for (let i = chain.length - 1; i >= 0; i--) {
        const pkgPath = chain[i];
        const info = packageInfo.get(pkgPath);
        if (info) {
            const isRoot = rootPackagePaths.has(pkgPath);
            let specifier;
            if (isRoot) {
                // Use the specifier from package.json
                specifier = pkgJson.dependencies?.[info.name] || pkgJson.devDependencies?.[info.name] || info.version;
                parts.push(`\`${escapeHtml(info.name)}@${escapeHtml(specifier)}\``);
            } else {
                parts.push(`\`${escapeHtml(info.name)}@${escapeHtml(info.version)}\``);
            }
        }
    }
    return parts.join(' &gt; ');
}

// Build package data with dependency chains
const packages = new Map(); // packageName -> { versions: Set, isDirect: bool, chains: Map<version, chains[]> }

for (const [pkgPath, info] of packageInfo.entries()) {
    const { name, version } = info;

    if (!packages.has(name)) {
        packages.set(name, {
            versions: new Set(),
            isDirect: info.isDirect,
            chainsByVersion: new Map(), // version -> chains[]
        });
    }

    const pkgData = packages.get(name);
    pkgData.versions.add(version);

    // Find dependency chains for this package
    const chains = findDependencyChains(pkgPath);

    // Store chains for this version
    if (!pkgData.chainsByVersion.has(version)) {
        pkgData.chainsByVersion.set(version, []);
    }
    pkgData.chainsByVersion.get(version).push(...chains);
}

// Sort packages
const sortedPackages = Array.from(packages.entries()).sort((a, b) => a[0].localeCompare(b[0]));

// Separate packages with multiple versions
const multipleVersions = sortedPackages.filter(([name, info]) => info.versions.size > 1);
const singleVersion = sortedPackages.filter(([name, info]) => info.versions.size === 1);

// Function to format description with dependency chains
function formatDescription(pkgName, pkgData, version = null) {
    if (pkgData.isDirect) {
        const specifier = pkgJson.dependencies?.[pkgName] || pkgJson.devDependencies?.[pkgName];
        const depsType = pkgJson.dependencies?.[pkgName] ? 'dependencies' : 'devDependencies';
        return `Listed in package.json (${escapeHtml(depsType)}): \`${escapeHtml(specifier)}\``;
    }

    // Get chains for this version (or all versions if version is null)
    let chains = [];
    if (version) {
        chains = pkgData.chainsByVersion.get(version) || [];
    } else {
        // For multiple versions, get chains from all versions
        for (const chainsForVersion of pkgData.chainsByVersion.values()) {
            chains.push(...chainsForVersion);
        }
    }

    // Get unique chains (limit to first 3 to avoid too long descriptions)
    const uniqueChains = Array.from(new Set(chains.map(formatChain))).slice(0, 3);

    if (uniqueChains.length === 0) {
        return 'Not listed in package.json';
    }

    if (uniqueChains.length === 1) {
        return uniqueChains[0];
    }

    // Multiple chains - show first one and indicate there are more
    return `${uniqueChains[0]}${uniqueChains.length > 1 ? ` (+${escapeHtml(String(uniqueChains.length - 1))} more)` : ''}`;
}

// Generate markdown
let markdown = `# Package Analysis

This document lists all packages installed in the codebase (excluding workspace packages).

**Total packages:** ${sortedPackages.length}
**Packages with multiple versions:** ${multipleVersions.length}

**Legend:**
- Listed in package.json: Package is directly specified in package.json
- Dependency chain: Shows the path from root dependency to this package (e.g., \`a@x.x.x > b@x.x.x > c@x.x.x\`)

## Packages with Multiple Versions

| Package Name | Versions | Description |
|--------------|----------|-------------|
`;

// Add multiple versions
for (const [name, info] of multipleVersions) {
    const versions = Array.from(info.versions)
        .sort()
        .map((v) => `\`${escapeHtml(v)}\``)
        .join(', ');
    const description = formatDescription(name, info);
    markdown += `| \`${escapeHtml(name)}\` | ${versions} | ${description} |\n`;
}

markdown += `\n## Packages with Single Version\n\n`;
markdown += `| Package Name | Version | Description |\n`;
markdown += `|--------------|---------|-------------|\n`;

// Add single versions
for (const [name, info] of singleVersion) {
    const version = Array.from(info.versions)[0];
    const description = formatDescription(name, info, version);
    markdown += `| \`${escapeHtml(name)}\` | \`${escapeHtml(version)}\` | ${description} |\n`;
}

// Ensure docs directory exists
mkdirSync('docs', { recursive: true });

// Write to file
writeFileSync('docs/PACKAGE_ANALYSIS.md', markdown);
console.log(`Generated docs/PACKAGE_ANALYSIS.md with ${sortedPackages.length} packages`);
