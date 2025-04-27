import { first, isEmpty } from 'lodash-es';
import urlcat from 'urlcat';

import { NetworkPluginID, TokenType } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import { isValidDomainEthereum } from '@/helpers/isValidDomain.js';
import { scale10 } from '@/helpers/number.js';
import { parseJSON } from '@/helpers/parseJSON.js';
import { EVMChainResolver } from '@/mask/index.js';
import type { NonFungibleTokenAPI } from '@/mask_pkgs/web3-providers/entry-types.js';
import { getAssetFullName } from '@/mask_pkgs/web3-providers/helpers/getAssetFullName.js';
import {
    type NonFungibleAsset,
    type NonFungibleCollection,
    type NonFungibleTokenTrait,
    resolveResourceURL,
    SourceType,
} from '@/mask_pkgs/web3-shared/base/index.js';
import { NFTSCAN_BASE, NFTSCAN_LOGO_BASE, NFTSCAN_URL } from '@/providers/nft-scan/constants.js';
import type { EVM, Solana } from '@/providers/nft-scan/types.js';
import { resolveNFTScanHostName } from '@/providers/nft-scan/utils.js';
import type { NFTAsset } from '@/providers/types/Firefly.js';
import {
    EthereumChainId as ChainId,
    EthereumSchemaType as SchemaType,
    isENSContractAddress,
    resolveImageURL,
    WNATIVE,
} from '#masknet/web3-shared-evm';

export function createNonFungibleAsset(
    chainId: ChainId,
    asset: EVM.Asset,
    collection?: EVM.AssetsGroup | NonFungibleTokenAPI.Collection,
): NonFungibleAsset<ChainId, SchemaType> {
    const payload = parseJSON<EVM.Payload>(asset.metadata_json);
    const contractName = asset.contract_name;
    const description = payload?.description ?? collection?.description ?? '';
    const uri = asset.imageURL ?? asset.image_uri;
    const mediaURL = resolveResourceURL(uri);

    const creator = asset.minter;
    const owner = asset.owner;
    const schema = asset.erc_type === 'erc1155' ? SchemaType.ERC1155 : SchemaType.ERC721;
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
            isSpam: collection && 'is_spam' in collection ? collection.is_spam : false,
        },
        source: SourceType.NFTScan,
    };
}
export function createNonFungibleCollectionFromGroup(
    chainId: ChainId,
    group: EVM.AssetsGroup,
): NonFungibleCollection<ChainId, SchemaType> {
    const sample = first(group.assets);
    const payload = parseJSON<EVM.Payload>(sample?.metadata_json);
    return {
        id: group.contract_address,
        chainId,
        assets: group.assets.map((x) => createNonFungibleAsset(chainId, x)),
        schema: sample?.erc_type === 'erc1155' ? SchemaType.ERC1155 : SchemaType.ERC721,
        name: group.contract_name || group.symbol || '',
        symbol: group.symbol,
        slug: group.contract_name || '',
        address: group.contract_address,
        description: group.description || payload?.description,
        iconURL: group.logo_url,
        balance: group.assets.length,
        source: SourceType.NFTScan,
        isSpam: undefined,
    };
}

export async function fetchFromNFTScanV2<T>(chainId: number, pathname: string, init?: RequestInit) {
    return fetchJSON<T>(urlcat(`${NFTSCAN_URL}/${chainId}`, pathname), {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...init?.headers,
        },
        cache: 'no-cache',
    });
}

export function createPermalink(chainId: ChainId, address: string, tokenId: string) {
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

export function formatNftscanNFT(nft: EVM.Asset | Solana.Asset): NFTAsset | undefined {
    if (isEmpty(nft)) return;
    const chainId = nft.chain_id;
    if ('erc_type' in nft) {
        return {
            id: nft.nftscan_id || nft.contract_address + nft.token_id,
            chainId,
            link: '',
            externalUrl: nft.nftscan_uri,
            tokenId: nft.token_id,
            type: TokenType.NonFungible,
            address: nft.contract_address,
            schema: nft.erc_type === 'erc1155' ? SchemaType.ERC1155 : SchemaType.ERC721,
            owner: {
                address: nft.owner,
            },
            priceInToken: {
                amount: nft.latest_trade_price || '0',
                tokenSymbol: nft.latest_trade_symbol,
            },
            metadata: {
                chainId,
                name: nft.name,
                tokenId: nft.token_id,
                symbol: nft.latest_trade_symbol,
                description: nft.description,
                imageURL: nft.imageURL || nft.image_uri,
                previewImageURL: nft.imageURL || nft.image_uri,
                mediaURL: nft.imageURL || nft.image_uri,
            },
            contract: {
                chainId,
                schema: nft.erc_type === 'erc1155' ? SchemaType.ERC1155 : SchemaType.ERC721,
                address: nft.contract_address,
                name: nft.contract_name,
                symbol: nft.contract_name,
            },
            collection: {
                id: nft.contract_address,
                chainId,
                name: nft.contract_name,
                slug: nft.contract_name,
                description: nft.description,
                address: nft.contract_address,
                iconURL: nft.imageURL || nft.image_uri,
                createdAt: nft.mint_timestamp,
            },
            source: SourceType.NFTScan,
            traits: nft.attributes.map((x) => ({
                type: x.attribute_name,
                value: x.attribute_value,
            })),
            tokenCount: nft.amount,
            __origin__: nft,
        };
    }
    const defaultImage = nft.image_uri;
    return {
        id: nft.token_address,
        chainId,
        link: '',
        externalUrl: nft.external_link,
        tokenId: nft.token_address,
        type: TokenType.NonFungible,
        address: nft.token_address,
        schema: SchemaType.ERC721,
        owner: {
            address: nft.owner,
        },
        metadata: {
            chainId,
            name: nft.name || '',
            tokenId: nft.token_address,
            symbol: nft.name,
            description: '',
            imageURL: defaultImage,
            previewImageURL: defaultImage,
            mediaURL: defaultImage,
        },
        contract: {
            chainId,
            schema: SchemaType.ERC721,
            address: nft.token_address,
            name: nft.name || nft.collection || '',
            symbol: nft.name,
        },
        source: SourceType.NFTScan,
        traits:
            nft.attributes?.map((x) => ({
                type: x.attribute_name,
                value: x.attribute_value,
            })) || [],
        __origin__: nft,
    };
}
