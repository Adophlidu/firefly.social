interface PerpsMetadata {
    universe: Array<{ name: string }>;
}

export function getPerpsDexes(markets: PerpsMetadata[] | undefined) {
    const dexes = new Set(['']);
    for (const metadata of markets ?? []) {
        for (const { name } of metadata.universe) {
            const separatorIndex = name.indexOf(':');
            if (separatorIndex > 0) dexes.add(name.slice(0, separatorIndex));
        }
    }

    return [...dexes];
}
