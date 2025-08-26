import { LinkDigestType, NetworkType } from '@/constants/enum.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/index.js';
import { isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { NFTSCAN_CHAIN_IDS } from '@/providers/nft-scan/constants.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

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
    pathname: RegExp;
    network: NetworkType;
    chainId: number;
    isPoap?: boolean;
    address?: (matches: RegExpMatchArray) => string;
    tokenId?: (matches: RegExpMatchArray) => string;
}

const rules: Rule[] = [
    // https://magiceden.io/item-details/2fsTwf4ZYHPRkfyYEAEr93hgq3qnpHZHTLQYQd92JP1E
    {
        hosts: ['magiceden.io', 'magiceden.us'],
        pathname: /^\/item-details\/([^/]+)$/,
        network: NetworkType.Solana,
        chainId: SolanaChainId.Mainnet,
    },
    // https://collectors.poap.xyz/token/6329208
    {
        hosts: ['collectors.poap.xyz', 'app.poap.xyz'],
        pathname: /^\/token\/(\d+)$/,
        network: NetworkType.Ethereum,
        chainId: EthereumChainId.Mainnet,
        isPoap: true,
        address: () => POAP_CONTRACT_ADDRESS,
        tokenId: (matches) => matches[1],
    },
    // https://{domain}/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/0
    ...NFTSCAN_EVM_DOMAINS.map(({ domain, chainId }) => {
        return {
            hosts: [domain],
            pathname: /^\/(0x[a-fA-F0-9]{40})\/(\d+)\/?$/,
            network: NetworkType.Ethereum,
            chainId,
            address: (matches) => matches[1],
            tokenId: (matches) => matches[2],
        } as Rule;
    }),
];

function resolveNFTData(url: string) {
    const parsed = parseUrl(url);
    if (!parsed) return null;

    const { hostname, pathname } = parsed;

    for (const rule of rules) {
        const isHostMatched = rule.hosts.includes(hostname);
        const matched = rule.pathname && pathname.match(rule.pathname);

        if (isHostMatched && matched) {
            return {
                chainId: rule.chainId,
                network: rule.network,
                isPoap: rule.isPoap,
                address: rule.address ? rule.address(matched) : matched[1],
                tokenId: rule.tokenId ? rule.tokenId(matched) : isValidChainIdSolana(rule.chainId) ? '0' : matched[2],
            };
        }
    }

    return null;
}

export async function getNFTFromUrl(url: string) {
    const nftParams = resolveNFTData(url);

    if (nftParams) {
        if (!NFTSCAN_CHAIN_IDS.includes(nftParams.chainId)) return;
        const nft = await FireflyEndpointProvider.getNFTDetail(nftParams.chainId, nftParams.address, nftParams.tokenId);
        return nft;
    }

    const digest = await FireflyEndpointProvider.linkDigest(url);
    if (digest.type === LinkDigestType.NFT && digest.nft?.name) {
        return digest.nft;
    }

    return;
}
