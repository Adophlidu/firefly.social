import { ChainId, ChainId as EVMChainId } from '@masknet/web3-shared-evm';
import { ChainId as SolanaChainId, isValidChainId as isSolanaChainId } from '@masknet/web3-shared-solana';
import { first } from 'lodash-es';

import { LinkDigestType, NetworkType } from '@/constants/enum.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/index.js';
import { isValidSolanaAddress } from '@/helpers/isValidSolanaAddress.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { resolveSimpleHashChain } from '@/helpers/resolveSimpleHashChain.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { SimpleHashProvider } from '@/providers/simplehash/index.js';

const NFTSCAN_EVM_DOMAINS = [
    {
        domain: 'eth.nftscan.com',
        chainId: ChainId.Mainnet,
    },
    {
        domain: 'bnb.nftscan.com',
        chainId: ChainId.BSC,
    },
    {
        domain: 'polygon.nftscan.com',
        chainId: ChainId.Polygon,
    },
    {
        domain: 'ava.nftscan.com',
        chainId: ChainId.Avalanche,
    },
    {
        domain: 'arbitrum.nftscan.com',
        chainId: ChainId.Arbitrum,
    },
    {
        domain: 'optimism.nftscan.com',
        chainId: ChainId.Optimism,
    },
    {
        domain: 'zksync.nftscan.com',
        chainId: ChainId.ZkSyncEra,
    },
    {
        domain: 'linea.nftscan.com',
        chainId: ChainId.Linea,
    },
    {
        domain: 'base.nftscan.com',
        chainId: ChainId.Base,
    },
] as const;

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
        chainId: EVMChainId.Mainnet,
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
                tokenId: rule.tokenId ? rule.tokenId(matched) : isSolanaChainId(rule.chainId) ? '0' : matched[2],
            };
        }
    }

    return null;
}

export async function getNFTFromUrl(url: string) {
    const nftParams = resolveNFTData(url);

    if (nftParams) {
        const chain = isValidSolanaAddress(nftParams.address) ? 'solana' : resolveSimpleHashChain(nftParams.chainId);
        const nft = !nftParams.isPoap
            ? await SimpleHashProvider.getNFTByAddress(nftParams.address, nftParams.tokenId, chain || 'ethereum')
            : first(
                  await SimpleHashProvider.getNFTByIds(
                      ['gnosis', 'ethereum'].map((chain) => `${chain}.${nftParams.address}.${nftParams.tokenId}`),
                  ),
              );
        return nft;
    }

    const digest = await FireflyEndpointProvider.linkDigest(url);
    if (digest.type === LinkDigestType.NFT && digest.nft?.name) {
        return digest.nft;
    }

    return;
}
