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
