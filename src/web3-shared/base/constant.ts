import { type ChainIdEnum, type Constants, type Primitive } from '@/web3-shared/base/types.js';

function replaceAll(input: string, values: Record<string, string>) {
    if (!input.includes('${')) return input;
    return input.replaceAll(/\${([^}]+)}/g, (match, p1) => values[p1] ?? match);
}

export function transformAll<ChainId extends number, T extends Constants>(
    chainIdEnum: ChainIdEnum<ChainId>,
    constants: T,
    environment: Record<string, string> = {},
) {
    type Entries = Readonly<{
        [key in keyof T]?: T[key]['Mainnet'];
    }>;
    return (chainId: ChainId = 1 as ChainId) => {
        const chainName = chainIdEnum[chainId] as 'Mainnet';
        // unknown chain id
        if (!chainName) return {} as Entries;
        const entries = Object.keys(constants).map((name: keyof T) => {
            let value = constants[name][chainName];
            if (Array.isArray(value)) {
                value = value.map((item) => {
                    if (typeof item === 'string') {
                        return replaceAll(item, environment);
                    }
                    return item;
                });
            } else if (typeof value === 'string') {
                value = replaceAll(value, environment);
            }
            return [name, value] as [string, Primitive | Primitive[]];
        });
        return Object.fromEntries(entries) as Entries;
    };
}

function transform<ChainId extends number, T extends Constants>(
    chainIdEnum: ChainIdEnum<ChainId>,
    constants: T,
    environment: Record<string, string> = {},
) {
    type Entries = {
        [key in keyof T]?: T[key]['Mainnet'];
    };
    const getAllConstants = transformAll(chainIdEnum, constants, environment);
    return <K extends keyof Entries, F extends Entries[K], R = F extends undefined ? Entries[K] : Required<Entries>[K]>(
        chainId: ChainId,
        key: K,
        fallback?: F,
    ) => (getAllConstants(chainId)[key] ?? fallback) as R;
}

export function transformFromJSON<ChainId extends number, T extends Constants>(
    chainIdEnum: ChainIdEnum<ChainId>,
    json: string,
    fallbackConstants: T,
    environment: Record<string, string> = {},
) {
    if (!json) return transform(chainIdEnum, fallbackConstants, environment);

    try {
        const constants = JSON.parse(json) as T;
        return transform(chainIdEnum, constants, environment);
    } catch {
        return transform(chainIdEnum, fallbackConstants, environment);
    }
}
