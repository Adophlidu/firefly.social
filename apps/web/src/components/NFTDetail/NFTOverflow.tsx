'use client';

import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { safeUnreachable } from '@dimensiondev/utils';
import { isValidChainIdEthereum, isValidChainIdSolana } from '@dimensiondev/web3/chains';
import { EthExplorerResolver, SolanaExplorerResolver } from '@dimensiondev/web3/resolvers';
import { resolveWagmiChain } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { type ReactNode, useMemo } from 'react';

import { ChainIcon } from '@/components/ChainIcon.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Link } from '@/components/Link.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { EthereumSchemaType } from '@/web3-shared/evm/types.js';

function DetailsGroup(props: { field: ReactNode; value: ReactNode }) {
    return (
        <div className="flex w-full gap-4 text-base font-normal leading-6">
            <div className="text-secondary w-[100px] min-w-[100px] whitespace-nowrap">{props.field}:</div>
            <div className="flex-1 text-base">{props.value}</div>
        </div>
    );
}

function ExplorerLink(props: { address: string; type: 'address' | 'tx'; chainId?: number; useBlockScan?: boolean }) {
    const { address, type, chainId, useBlockScan } = props;
    const href = useMemo(() => {
        if (!chainId) return;

        switch (type) {
            case 'tx':
                return isValidChainIdSolana(chainId)
                    ? SolanaExplorerResolver.transactionLink(chainId, address)
                    : EthExplorerResolver.transactionLink(chainId, address);
            case 'address':
                if (useBlockScan) return BlockScanExplorerResolver.addressLink(chainId, address);
                return isValidChainIdSolana(chainId)
                    ? SolanaExplorerResolver.addressLink(chainId, address)
                    : EthExplorerResolver.addressLink(chainId, address);
            default:
                safeUnreachable(type);
                return '';
        }
    }, [address, type, chainId, useBlockScan]);

    if (!href) return <span className="break-all">{address}</span>;
    return (
        <span className="inline-flex items-center gap-1 break-all">
            {address}
            <CopyTextButton size={14} text={address} />
            <a href={href} target="_blank" className="inline-block">
                <LinkIcon width={14} height={14} />
            </a>
        </span>
    );
}

function convertDescriptionToArray(description: string): ReactNode[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = description.split(urlRegex);

    return parts.map((part, i) => {
        if (/(https?:\/\/[^\s]+)/.test(part)) {
            return (
                <Link key={`${part}-${i}`} href={part} target="_blank" className="text-highlight break-all underline">
                    {part}
                </Link>
            );
        }
        return part;
    });
}

interface NFTOverflowProps {
    description: string;
    tokenId?: string;
    creator?: string;
    mintingTxnHash?: string;
    mintingDate?: string;
    contractAddress?: string;
    chainId?: number;
    schemaType?: number;
}

const evmStandardMap: Record<number, string> = {
    [EthereumSchemaType.Native]: 'Native',
    [EthereumSchemaType.ERC721]: 'ERC721',
    [EthereumSchemaType.ERC1155]: 'ERC1155',
    [EthereumSchemaType.ERC20]: 'ERC20',
    [EthereumSchemaType.SBT]: 'SBT',
};

export function NFTOverflow(props: NFTOverflowProps) {
    const description = useMemo(() => convertDescriptionToArray(props.description), [props.description]);
    const standard = useMemo(() => {
        if (!props.schemaType) return;
        if (isValidChainIdEthereum(props.chainId)) return evmStandardMap[props.schemaType];
        return;
    }, [props.schemaType, props.chainId]);

    return (
        <div className="space-y-8">
            {props.description ? (
                <div className="space-y-2">
                    <h3 className="text-xl font-bold leading-6">
                        <Trans>Description</Trans>
                    </h3>
                    <p className="w-full whitespace-pre-line break-words text-sm font-normal leading-5 sm:break-normal">
                        {description}
                    </p>
                </div>
            ) : null}
            <div className="space-y-2">
                <h3 className="text-xl font-bold leading-6">
                    <Trans>Details</Trans>
                </h3>
                <div className="flex flex-col gap-4">
                    {standard ? (
                        <DetailsGroup
                            field={<Trans>Standard</Trans>}
                            value={<div className="flex items-center">{standard}</div>}
                        />
                    ) : null}
                    {props.tokenId ? (
                        <DetailsGroup
                            field={<Trans>NFT ID</Trans>}
                            value={<span className="break-all">#{props.tokenId}</span>}
                        />
                    ) : null}
                    {props.chainId ? (
                        <DetailsGroup
                            field={<Trans>Blockchain</Trans>}
                            value={
                                <div className="flex items-center gap-1">
                                    <ChainIcon chainId={props.chainId} size={20} />
                                    <span className="capitalize">{resolveWagmiChain(props.chainId)?.name}</span>
                                </div>
                            }
                        />
                    ) : null}
                    {props.contractAddress ? (
                        <DetailsGroup
                            field={<Trans>Contract</Trans>}
                            value={
                                <ExplorerLink address={props.contractAddress} type="address" chainId={props.chainId} />
                            }
                        />
                    ) : null}
                    {props.creator ? (
                        <DetailsGroup
                            field={<Trans>Creator</Trans>}
                            value={
                                <ExplorerLink
                                    useBlockScan
                                    address={props.creator}
                                    type="address"
                                    chainId={props.chainId}
                                />
                            }
                        />
                    ) : null}
                    {props.mintingTxnHash ? (
                        <DetailsGroup
                            field={<Trans>Minting Txn Hash</Trans>}
                            value={<ExplorerLink address={props.mintingTxnHash} type="tx" chainId={props.chainId} />}
                        />
                    ) : null}
                    {props.mintingDate ? (
                        <DetailsGroup field={<Trans>Minting Date</Trans>} value={props.mintingDate} />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
