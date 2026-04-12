'use client';

import PoapIcon from '@dimensiondev/assets/poap.svg';
import { classNames } from '@dimensiondev/utils';
import type { GridItemProps, GridListProps } from 'react-virtuoso';
import type { Hex } from 'viem';

import { ChainIcon } from '@/components/ChainIcon.js';
import { GridListInPage } from '@/components/GridListInPage.js';
import { Link } from '@/components/Link.js';
import { NFTImage } from '@/components/NFTImage.js';
import { BookmarkInIcon } from '@/components/NFTs/BookmarkButton.js';
import { Source } from '@/constants/enum.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/static.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { resolveNFTUrl } from '@/helpers/resolveNFTUrl.js';
import { usePoapsByWallet } from '@/hooks/nft/usePoapsByWallet.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import type { EVM } from '@/providers/nftscan/types.js';
import type { NFTDetail } from '@/providers/types/Firefly.js';
import type { Poap } from '@/providers/types/NFTs.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

function GridList({ className, children, ...props }: GridListProps) {
    return (
        <div {...props} className={classNames('grid grid-cols-3 gap-3.5 md:grid-cols-4 lg:grid-cols-3', className)}>
            {children}
        </div>
    );
}

function GridItem({ children, ...props }: GridItemProps) {
    return <div {...props}>{children}</div>;
}

function Owner({ address }: { address: Hex }) {
    const { data: ensName } = useEnsName(address);
    return (
        <Link
            href={getProfileUrl({ source: Source.Wallet, profileId: address })}
            className="absolute left-2 top-2 max-w-[100px] truncate rounded-full bg-[rgba(24,26,32,0.50)] px-2 py-1 text-[10px] font-medium leading-4 text-white backdrop-blur-md"
            onClickCapture={(e) => e.stopPropagation()}
        >
            {ensName ? ensName : formatAddressEthereum(address, 4)}
        </Link>
    );
}

function NFTItemContent({
    index,
    item,
    ...props
}: {
    index: number;
    item: NFTDetail | EVM.Asset;
    isPoap?: boolean;
    isShowOwner?: boolean;
    isShowChainIcon?: boolean;
    ownerCount?: number;
}) {
    const nftUrl = resolveNFTUrl(item.chain_id, item.contract_address, item.token_id || '0');
    const nftId = `${item.chain_id}.${item.contract_address}.${item.token_id}`.toLowerCase();

    return (
        <div className="relative">
            <Link
                href={nftUrl}
                key={`${index}-${item.contract_address}-${item.token_id}`}
                className="bg-bg flex cursor-pointer flex-col rounded-lg pb-1 sm:rounded-2xl"
            >
                <div className="relative aspect-square h-auto w-full overflow-hidden">
                    {props.isShowChainIcon ? (
                        <ChainIcon chainId={item.chain_id} size={20} className="absolute left-2 top-2 size-4" />
                    ) : null}
                    {props.isPoap ? <PoapIcon className="absolute left-2 top-2 size-6" /> : null}
                    {props.isShowOwner && item.owner ? <Owner address={item.owner as Hex} /> : null}
                    {props.ownerCount ? (
                        <div className="bg-primaryBottom absolute left-2 top-2 z-10 h-5 rounded-lg px-1 text-xs font-bold leading-5">
                            × {nFormatter(props.ownerCount)}
                        </div>
                    ) : null}
                    <NFTImage
                        width={500}
                        height={500}
                        className="size-full rounded-lg object-cover"
                        src={item.image_uri! || item.nftscan_uri!}
                        alt="nft_image"
                    />
                </div>
                <div className="mt-1 line-clamp-2 h-8 w-full px-1 text-center text-xs font-medium leading-4 sm:mt-2 sm:px-2 sm:py-0">
                    {item.name}
                </div>
            </Link>
            <BookmarkInIcon className="absolute right-2 top-2 z-10" nftId={nftId} ownerAddress={item.owner} />
        </div>
    );
}
function PoapItemContent({
    index,
    item,
    ...props
}: {
    index: number;
    item: Poap;
    isPoap?: boolean;
    isShowOwner?: boolean;
    isShowChainIcon?: boolean;
    ownerCount?: number;
}) {
    const nftUrl = resolveNFTUrl(EthereumChainId.xDai, POAP_CONTRACT_ADDRESS, item.tokenId || '0');

    return (
        <div className="relative">
            <Link
                href={nftUrl}
                key={`${index}-${item.tokenId}`}
                className="bg-bg flex cursor-pointer flex-col rounded-lg pb-1 sm:rounded-2xl"
            >
                <div className="relative aspect-square h-auto w-full overflow-hidden">
                    {props.isShowChainIcon ? (
                        <ChainIcon chainId={EthereumChainId.xDai} size={20} className="absolute left-2 top-2 size-4" />
                    ) : null}
                    {props.isPoap ? <PoapIcon className="absolute left-2 top-2 size-6" /> : null}
                    {props.isShowOwner && item.owner ? <Owner address={item.owner as Hex} /> : null}
                    {props.ownerCount ? (
                        <div className="light bg-primaryBottom absolute left-2 top-2 z-10 h-5 rounded-lg px-1 text-xs font-bold leading-5">
                            × {nFormatter(props.ownerCount)}
                        </div>
                    ) : null}
                    <NFTImage
                        width={500}
                        height={500}
                        className="size-full rounded-lg object-cover"
                        src={item.event.image_url}
                        alt="nft_image"
                    />
                </div>
                <div className="mt-1 line-clamp-2 h-8 w-full px-1 text-center text-xs font-medium leading-4 sm:mt-2 sm:px-2 sm:py-0">
                    {item.event.name}
                </div>
            </Link>
        </div>
    );
}

export function getNFTItemContent(
    index: number,
    item: NFTDetail | EVM.Asset,
    options?: {
        isPoap?: boolean;
        isShowOwner?: boolean;
        isShowChainIcon?: boolean;
        ownerCount?: number;
    },
) {
    return <NFTItemContent index={index} item={item} {...options} />;
}

function getPoapItemContent(
    index: number,
    item: Poap,
    options?: {
        isPoap?: boolean;
        isShowOwner?: boolean;
        isShowChainIcon?: boolean;
        ownerCount?: number;
    },
) {
    return <PoapItemContent index={index} item={item} {...options} />;
}

export const POAPGridListComponent = {
    List: GridList,
    Item: GridItem,
};

export function POAPList({ address }: { address: string }) {
    const queryResult = usePoapsByWallet(address);

    return (
        <div className="px-3">
            <GridListInPage
                queryResult={queryResult}
                className="mt-5"
                VirtualGridListProps={{
                    components: POAPGridListComponent,
                    itemContent: (index, item) => {
                        return getPoapItemContent(index, item, {
                            isPoap: true,
                        });
                    },
                }}
                NoResultsFallbackProps={{
                    className: 'mt-20',
                }}
            />
        </div>
    );
}
