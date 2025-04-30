'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { safeUnreachable } from '@masknet/kit';
import { type ReactNode, useMemo } from 'react';

import LinkIcon from '@/assets/link-square.svg';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Link } from '@/components/Link.js';
import { ChainIcon } from '@/components/NFTDetail/ChainIcon.js';
import { isValidChainIdEthereum, isValidChainIdSolana } from '@/helpers/isValidChainId.js';
import { resolveWagmiChain } from '@/helpers/resolveWagmiChain.js';
import { EVMExplorerResolver, SolanaExplorerResolver } from '@/mask/index.js';
import { BlockScanExplorerResolver } from '@/providers/ethereum/ExplorerResolver.js';
import { EthereumSchemaType } from '#masknet/web3-shared-evm';

function DetailsGroup(props: { field: ReactNode; value: ReactNode }) {
    return (
        <div className="flex w-full gap-[30px] text-base font-normal leading-6">
            <div className="w-[144px] min-w-[144px] whitespace-nowrap text-secondary">{props.field}:</div>
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
                    : EVMExplorerResolver.transactionLink(chainId, address);
            case 'address':
                if (useBlockScan) return BlockScanExplorerResolver.addressLink(chainId, address);
                return isValidChainIdSolana(chainId)
                    ? SolanaExplorerResolver.addressLink(chainId, address)
                    : EVMExplorerResolver.addressLink(chainId, address);
            default:
                safeUnreachable(type);
                return '';
        }
    }, [address, type, chainId, useBlockScan]);

    if (!href) return <span className="break-all">{address}</span>;
    return (
        <span className="break-all">
            {address}
            <span className="ml-1">
                <CopyTextButton size={14} text={address} />
            </span>
            <a href={href} target="_blank" className="ml-1 inline-block">
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
                <Link key={`${part}-${i}`} href={part} target="_blank" className="break-all text-highlight underline">
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
                <div className="space-y-4">
                    {standard ? (
                        <DetailsGroup
                            field={t`NFT Standard`}
                            value={<div className="flex items-center">{standard}</div>}
                        />
                    ) : null}
                    {props.tokenId ? (
                        <DetailsGroup field={t`NFT ID`} value={<span className="break-all">#{props.tokenId}</span>} />
                    ) : null}
                    {props.chainId ? (
                        <DetailsGroup
                            field={t`Blockchain`}
                            value={
                                <div className="flex items-center">
                                    <span className="mr-1">
                                        <ChainIcon chainId={props.chainId} size={20} />
                                    </span>
                                    <span className="capitalize">{resolveWagmiChain(props.chainId)?.name}</span>
                                </div>
                            }
                        />
                    ) : null}
                    {props.contractAddress ? (
                        <DetailsGroup
                            field={t`NFT Contract`}
                            value={
                                <ExplorerLink address={props.contractAddress} type="address" chainId={props.chainId} />
                            }
                        />
                    ) : null}
                    {props.creator ? (
                        <DetailsGroup
                            field={t`Creator`}
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
                            field={t`Minting Txn Hash`}
                            value={<ExplorerLink address={props.mintingTxnHash} type="tx" chainId={props.chainId} />}
                        />
                    ) : null}
                    {props.mintingDate ? <DetailsGroup field={t`Minting Date`} value={props.mintingDate} /> : null}
                </div>
            </div>
        </div>
    );
}
