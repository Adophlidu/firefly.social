import type { Web3Helper } from '@masknet/web3-helpers';
import {
    EthereumChainId,
    EthereumSchemaType,
    isENSContractAddress,
    resolveImageURL,
    WNATIVE,
} from '@masknet/web3-shared-evm';
import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { NetworkPluginID, TokenType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { fetchSquashedJSON } from '@/helpers/fetchJSON.js';
import { formatPercentage } from '@/helpers/formatPercentage.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import { scale10 } from '@/helpers/number.js';
import { parseJSON } from '@/helpers/parseJSON.js';
import type { NonFungibleTokenAPI } from '@/mask_pkgs/web3-providers/entry-types.js';
import { getAssetFullName } from '@/mask_pkgs/web3-providers/helpers/getAssetFullName.js';
import { NFTSCAN_BASE, NFTSCAN_LOGO_BASE, NFTSCAN_URL } from '@/mask_pkgs/web3-providers/NFTScan/constants.js';
import type { EVM } from '@/mask_pkgs/web3-providers/NFTScan/types.js';
import { EVMChainResolver } from '@/mask_pkgs/web3-providers/Web3/EVM/apis/ResolverAPI.js';
import {
    type NonFungibleAsset,
    type NonFungibleCollection,
    type NonFungibleTokenTrait,
    resolveResourceURL,
    SourceType,
} from '@/mask_pkgs/web3-shared/base/index.js';

function resolveNFTScanHostName(pluginId: NetworkPluginID, chainId: Web3Helper.ChainIdAll) {
    if (pluginId === NetworkPluginID.PLUGIN_SOLANA) return 'https://solana.nftscan.com';

    switch (chainId) {
        case EthereumChainId.Mainnet:
            return 'https://www.nftscan.com';
        case EthereumChainId.Polygon:
            return 'https://polygon.nftscan.com';
        case EthereumChainId.BSC:
            return 'https://bnb.nftscan.com';
        case EthereumChainId.Arbitrum:
            return 'https://arbitrum.nftscan.com';
        case EthereumChainId.Avalanche:
            return 'https://avax.nftscan.com';
        case EthereumChainId.Optimism:
            return 'https://optimism.nftscan.com';
        case EthereumChainId.xDai:
            return 'https://gnosis.nftscan.com';
        default:
            return '';
    }
}

export async function fetchFromNFTScanV2<T>(chainId: EthereumChainId, pathname: string, init?: RequestInit) {
    return fetchSquashedJSON<T>(urlcat(NFTSCAN_URL, pathname), {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...init?.headers,
            ...(chainId ? { 'x-app-chainid': chainId.toString() } : {}),
        },
        cache: 'no-cache',
    });
}

function createPermalink(chainId: EthereumChainId, address: string, tokenId: string) {
    return urlcat(
        resolveNFTScanHostName(NetworkPluginID.PLUGIN_EVM, chainId) || 'https://www.nftscan.com',
        '/:address/:tokenId',
        {
            address,
            tokenId,
        },
    );
}

function getAssetTraits(asset: EVM.Asset): NonFungibleTokenTrait[] {
    if (asset.attributes.length) {
        return asset.attributes.map((x) => ({
            type: x.attribute_name,
            value: x.attribute_value,
            rarity: x.percentage,
        }));
    }
    // Manually get traits from metadata, since NFTScan doesn't return
    // attributes at this time.
    if (isENSContractAddress(asset.contract_address)) {
        const payload = parseJSON<EVM.Payload>(asset.metadata_json);
        return (
            payload?.attributes?.map((x) => ({
                type: x.trait_type,
                value: x.value,
            })) ?? EMPTY_LIST
        );
    }
    return EMPTY_LIST;
}

function createNonFungibleAsset(
    chainId: EthereumChainId,
    asset: EVM.Asset,
    collection?: NonFungibleTokenAPI.Collection | EVM.AssetsGroup,
): NonFungibleAsset<EthereumChainId, EthereumSchemaType> {
    const payload = parseJSON<EVM.Payload>(asset.metadata_json);
    const contractName = asset.contract_name;
    const description = payload?.description ?? collection?.description ?? '';
    const uri = asset.imageURL ?? asset.image_uri;
    const mediaURL = resolveResourceURL(uri);

    const creator = asset.minter;
    const owner = asset.owner;
    const schema = asset.erc_type === 'erc1155' ? EthereumSchemaType.ERC1155 : EthereumSchemaType.ERC721;
    const symbol = asset.contract_name;
    const name = isValidDomainEthereum(asset.name)
        ? asset.name
        : getAssetFullName(asset.contract_address, contractName, payload?.name || asset.name, asset.token_id);

    return {
        id: asset.contract_address,
        chainId,
        link: createPermalink(chainId, asset.contract_address, asset.token_id),
        tokenId: asset.token_id,
        type: TokenType.NonFungible,
        address: asset.contract_address,
        schema,
        creator: {
            address: creator,
            link: urlcat(NFTSCAN_BASE, creator),
        },
        owner: owner
            ? {
                  address: owner,
                  link: urlcat(NFTSCAN_BASE, owner),
              }
            : undefined,
        traits: getAssetTraits(asset),
        priceInToken: asset.latest_trade_price
            ? {
                  amount: scale10(asset.latest_trade_price, WNATIVE[chainId].decimals).toFixed(),
                  // FIXME: cannot get payment token
                  token:
                      asset.latest_trade_symbol === 'ETH'
                          ? (EVMChainResolver.nativeCurrency(chainId) ?? WNATIVE[chainId])
                          : WNATIVE[chainId],
              }
            : undefined,
        metadata: {
            chainId,
            name,
            symbol,
            description,
            imageURL: resolveImageURL(mediaURL, name, asset.contract_address),
            mediaURL,
        },
        contract: {
            chainId,
            schema,
            address: asset.contract_address,
            name: contractName,
            symbol,
            creatorEarning:
                collection && 'royalty' in collection ? formatPercentage(collection.royalty / 100 / 100) : undefined,
        },
        collection: {
            chainId,
            name: contractName,
            slug: contractName,
            description,
            address: asset.contract_address,
            // If collectionContext.logo_url is null, we will directly render a fallback logo instead.
            // So do not fallback to the constructed NFTScan logo url
            iconURL: collection ? collection.logo_url : `${urlcat(NFTSCAN_LOGO_BASE, asset.contract_address)}.png`,
            verified: collection?.verified || collection?.opensea_verified,
            createdAt: asset.mint_timestamp,
        },
        source: SourceType.NFTScan,
    };
}

export function createNonFungibleCollectionFromGroup(
    chainId: EthereumChainId,
    group: EVM.AssetsGroup,
): NonFungibleCollection<EthereumChainId, EthereumSchemaType> {
    const sample = first(group.assets);
    const payload = parseJSON<EVM.Payload>(sample?.metadata_json);
    return {
        id: group.contract_address,
        chainId,
        assets: group.assets.map((x) => createNonFungibleAsset(chainId, x)),
        schema: sample?.erc_type === 'erc1155' ? EthereumSchemaType.ERC1155 : EthereumSchemaType.ERC721,
        name: group.contract_name || group.symbol || '',
        symbol: group.symbol,
        slug: group.contract_name || '',
        address: group.contract_address,
        description: group.description || payload?.description,
        iconURL: group.logo_url,
        balance: group.assets.length,
        source: SourceType.NFTScan,
    };
}
