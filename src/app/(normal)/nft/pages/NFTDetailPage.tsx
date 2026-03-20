'use client';

import { EMPTY_LIST } from '@dimensiondev/constants';

import { PoapDetailPage } from '@/app/(normal)/nft/pages/PoapDetailPage.js';
import { Loading } from '@/components/Loading.js';
import { NFTInfo } from '@/components/NFTDetail/NFTInfo.js';
import { NFTOverflow } from '@/components/NFTDetail/NFTOverflow.js';
import { NFTProperties } from '@/components/NFTDetail/NFTProperties.js';
import { NFTNavbar } from '@/components/NFTs/NFTNavbar.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/static.js';
import { notFound } from '@/esm/navigation.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useNFTDetail } from '@/hooks/useNFTDetail.js';
import { ErcType } from '@/providers/nftscan/types.js';
import { EthereumChainId, EthereumSchemaType } from '@/web3-shared/evm/types.js';

export function NFTDetailPage({ chainId, address, tokenId }: { chainId: number; address: string; tokenId: string }) {
    const isPoap = chainId === EthereumChainId.xDai && isSameEthereumAddress(address, POAP_CONTRACT_ADDRESS);

    const { data, isLoading } = useNFTDetail(chainId, address, isPoap ? undefined : tokenId);

    if (isPoap) return <PoapDetailPage tokenId={tokenId} />;

    if (isLoading) {
        return <Loading />;
    }

    if (!data) {
        notFound();
    }

    return (
        <div className="min-h-screen">
            <NFTNavbar>{data.name || `${data.collection.name} #${tokenId}`}</NFTNavbar>
            <div className="space-y-4 px-4 py-3">
                <NFTInfo
                    imageURL={data.image_uri!}
                    videoURL={data.video_uri}
                    name={data.name ?? ''}
                    tokenId={data.token_id ?? ''}
                    ownerAddress={data.erc_type === ErcType.ERC1155 ? undefined : data.owner}
                    contractAddress={address || data.contract_address || ''}
                    collection={{
                        name: data.collection?.name ?? '',
                        icon: data.collection.large_image_url ?? data.collection?.logo_url ?? '',
                    }}
                    isPoap={isPoap}
                    chainId={chainId}
                    externalUrl={data.external_link}
                    traits={data.attributes ?? EMPTY_LIST}
                    platformLogo={data.deployPlatformLogo}
                />
                {!isPoap && data.attributes.length ? <NFTProperties items={data.attributes} /> : null}
                <NFTOverflow
                    description={data.description ?? ''}
                    tokenId={data.token_id}
                    contractAddress={data.contract_address ?? ''}
                    chainId={data.chain_id}
                    schemaType={
                        data.erc_type === ErcType.ERC721 ? EthereumSchemaType.ERC721 : EthereumSchemaType.ERC1155
                    }
                />
            </div>
        </div>
    );
}
