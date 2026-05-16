import { isValidAddressEthereum } from '@/shared/src/helpers/isAddress.js';
import { parseUrl } from '@/shared/src/helpers/parseUrl.js';
import { EthereumChainId } from '@/shared/src/types/ethereum.js';
import { SolanaChainId } from '@/shared/src/types/solana.js';

const NFTSCAN_CHAIN_IDS = [
    EthereumChainId.Mainnet,
    EthereumChainId.BSC,
    EthereumChainId.Polygon,
    EthereumChainId.Base,
    EthereumChainId.Optimism,
];

const NFTSCAN_EVM_DOMAINS = [
    {
        domain: 'eth.nftscan.com',
        chainId: EthereumChainId.Mainnet,
    },
    {
        domain: 'bnb.nftscan.com',
        chainId: EthereumChainId.BSC,
    },
    {
        domain: 'polygon.nftscan.com',
        chainId: EthereumChainId.Polygon,
    },
    {
        domain: 'ava.nftscan.com',
        chainId: EthereumChainId.Avalanche,
    },
    {
        domain: 'arbitrum.nftscan.com',
        chainId: EthereumChainId.Arbitrum,
    },
    {
        domain: 'optimism.nftscan.com',
        chainId: EthereumChainId.Optimism,
    },
    {
        domain: 'base.nftscan.com',
        chainId: EthereumChainId.Base,
    },
    {
        domain: 'mantle.nftscan.com',
        chainId: EthereumChainId.Mantle,
    },
].filter((x) => NFTSCAN_CHAIN_IDS.includes(x.chainId));

interface Rule {
    hosts: string[];
    resolver: (
        url: URL,
        link: string,
    ) => null | {
        chainId: number;
        address: string;
        tokenId: string;
    };
}

const openseaChainIdMap: Record<string, number> = {
    ethereum: 1,
    matic: 137,
    polygon: 137,
    arbitrum: 42161,
    bsc: 56,
    arbitrum_nova: 42170,
    avalanche: 43114,
    optimism: 10,
    solana: 101,
    base: 8453,
    zora: 7777777,
};
const blurChainIdMap: Record<string, number> = {
    eth: 1,
};

const rules: Rule[] = [
    // https://magiceden.io/item-details/2fsTwf4ZYHPRkfyYEAEr93hgq3qnpHZHTLQYQd92JP1E
    {
        hosts: ['magiceden.io', 'magiceden.us'],
        resolver: (u) => {
            const matched = u.pathname.match(/^\/item-details\/([^/]+)$/);
            if (!matched) return null;

            return { chainId: SolanaChainId.Mainnet, address: matched[1], tokenId: '0' };
        },
    },
    // https://collectors.poap.xyz/token/6329208
    {
        hosts: ['collectors.poap.xyz', 'app.poap.xyz'],
        resolver: (u) => {
            const matched = u.pathname.match(/^\/token\/(\d+)$/);
            if (!matched) return null;

            return {
                chainId: EthereumChainId.Mainnet,
                address: '0x22C1f6050E56d2876009903609a2cC3fEf83B415',
                tokenId: matched[1],
            };
        },
    },
    // https://opensea.io/item/base/0xba5e05cb26b78eda3a2f8e3b3814726305dcac83/285
    {
        hosts: ['opensea.io'],
        resolver: (u) => {
            const matched = u.pathname.match(/^\/item\/([^/]+)\/(0x[a-fA-F0-9]{40})\/(\d+)\/?$/);
            if (!matched) return null;

            const chainId = openseaChainIdMap[matched[1]];
            if (!chainId) return null;

            return { chainId, address: matched[2], tokenId: matched[3] };
        },
    },
    // https://blur.io/blast/asset/0x0085f5f82090478d8d840159bd91a3b07a37fc50/394
    // https://blur.io/eth/asset/0x23581767a106ae21c074b2276d25e5c3e136a68b/9430
    {
        hosts: ['blur.io'],
        resolver: (u) => {
            const matched = u.pathname.match(/^\/([^/]+)\/asset\/(0x[a-fA-F0-9]{40})\/(\d+)\/?$/);
            if (!matched) return null;

            const chainId = blurChainIdMap[matched[1]];
            if (!chainId) return null;

            return { chainId, address: matched[2], tokenId: matched[3] };
        },
    },
    {
        hosts: ['zora.co'],
        resolver: () => null,
    },
    // chain://eip155:1/erc721:0xd8EA7A2F786a8baDdfd14DfC4A836bd4761E05fa/1577
    {
        hosts: ['chain:'],
        resolver: (_, link) => {
            const matched = link.match(/^chain:\/\/eip155:(\d+)\/([^/]+)\/(\d+)\/?$/);
            if (!matched) return null;

            const chainId = Number.parseInt(matched[1], 10);
            if (Number.isNaN(chainId)) return null;

            const address = matched[2].split(':')[1];
            if (!isValidAddressEthereum(address)) return null;

            return { chainId, address, tokenId: matched[3] };
        },
    },
    // nft://7777777/0x30b8cD2E3Аc893e237577999760652a847509E39/4
    {
        hosts: ['nft:'],
        resolver: (_, link) => {
            const matched = link.match(/^nft:\/\/(\d+)\/([^/]+)\/(\d+)\/?$/);
            if (!matched) return null;

            const chainId = Number.parseInt(matched[1], 10);
            if (Number.isNaN(chainId)) return null;

            return { chainId, address: matched[2], tokenId: matched[3] };
        },
    },
    // https://{domain}/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/0
    ...NFTSCAN_EVM_DOMAINS.map(({ domain, chainId }) => {
        return {
            hosts: [domain],
            resolver: (u) => {
                const matched = u.pathname.match(/^\/(0x[a-fA-F0-9]{40})\/(\d+)\/?$/);
                if (!matched) return null;

                return { chainId, address: matched[1], tokenId: matched[2] };
            },
        } satisfies Rule;
    }),
];

export function resolveNFTDataFromUrl(url: string) {
    const parsed = parseUrl(url);
    if (!parsed) return null;

    const { hostname, protocol } = parsed;
    const matchedRule = rules.find((rule) => rule.hosts.some((h) => h === hostname || h === protocol));

    return matchedRule?.resolver(parsed, url);
}
