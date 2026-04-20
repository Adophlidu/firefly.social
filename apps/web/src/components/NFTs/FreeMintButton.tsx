'use client';

import WebsiteIcon from '@dimensiondev/assets/website-circle.svg';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { chains } from '@dimensiondev/web3/chains';
import { NetworkType } from '@dimensiondev/web3/enums';
import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import type { Address } from 'viem';
import { useChainId, useConnection, useSwitchChain } from 'wagmi';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { MintStatus } from '@/constants/enum.js';
import { useSponsorMintStatus } from '@/hooks/useSponsorMintStatus.js';
import { FreeMintModal } from '@/modals/FreeMintModal/FreeMintModal.js';
import { FreeMintModalRef } from '@/modals/FreeMintModal/refs.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { captureNFTMintClickEvent, captureNFTViewWebsiteClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import type { SponsorMintOptions } from '@/providers/types/Firefly.js';

function getMintButtonText(mintStatus?: MintStatus) {
    if (!mintStatus) return <Trans>Unknown status</Trans>;

    switch (mintStatus) {
        case MintStatus.Mintable:
            return <Trans>Mint</Trans>;
        case MintStatus.MintAgain:
            return <Trans>Mint Again</Trans>;
        case MintStatus.NotStarted:
            return <Trans>Not Started</Trans>;
        case MintStatus.Ended:
            return <Trans>Mint Ended</Trans>;
        case MintStatus.Minted:
            return <Trans>Minted</Trans>;
        case MintStatus.SoldOut:
            return <Trans>Sold Out</Trans>;
        default:
            safeUnreachable(mintStatus);
            return <Trans>Unknown status</Trans>;
    }
}

function getMintButtonAriaLabel(mintStatus?: MintStatus) {
    if (!mintStatus) return 'Mint';

    switch (mintStatus) {
        case MintStatus.Mintable:
            return 'Mint NFT';
        case MintStatus.MintAgain:
            return 'Mint Again';
        case MintStatus.NotStarted:
            return 'Not Started';
        case MintStatus.Ended:
            return 'Mint Ended';
        case MintStatus.Minted:
            return 'Minted';
        case MintStatus.SoldOut:
            return 'Sold Out';
        default:
            safeUnreachable(mintStatus);
            return 'Mint';
    }
}

interface FreeMintButtonProps extends Omit<ClickableButtonProps, 'ref'> {
    contractAddress: string;
    tokenId: string;
    chainId: number;
    externalUrl?: string | null;
    collectionId?: string;
}

export function FreeMintButton({
    contractAddress,
    tokenId,
    chainId,
    collectionId,
    externalUrl,
    className,
    ...rest
}: FreeMintButtonProps) {
    const account = useConnection();
    const currentChainId = useChainId();
    const { switchChainAsync } = useSwitchChain();

    const mintTarget: SponsorMintOptions = useMemo(
        () => ({
            walletAddress: account.address || '',
            contractAddress: contractAddress || '',
            tokenId,
            chainId,
            buyCount: 1,
        }),
        [account.address, contractAddress, tokenId, chainId],
    );
    const { isLoading, isRefetching, data, refetch } = useSponsorMintStatus(mintTarget);

    const connected = !!account.address;
    const [{ loading: handlerLoading }, handleClick] = useAsyncFn(async () => {
        if (!connected) {
            WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
            return;
        }
        if (!data) return;
        await captureNFTMintClickEvent(data.chainId, contractAddress);
        if (currentChainId !== data.chainId) {
            await switchChainAsync({ chainId: data.chainId });
        }
        FreeMintModalRef.open({
            mintTarget: {
                ...mintTarget,
                collectionId,
                walletAddress: account.address as Address,
            },
            mintParams: data,
            onSuccess: refetch,
        });
    }, [
        connected,
        data,
        contractAddress,
        currentChainId,
        mintTarget,
        collectionId,
        account.address,
        refetch,
        switchChainAsync,
    ]);

    if (data?.mintStatus === MintStatus.NotSupported || (!isLoading && !data)) {
        return externalUrl ? (
            <Link
                href={externalUrl}
                target="_blank"
                className={classNames(
                    'border-main text-main flex h-8 items-center justify-center gap-1.5 rounded-full border text-sm font-bold',
                    className,
                )}
                onClick={() => {
                    captureNFTViewWebsiteClickEvent(chainId, contractAddress);
                }}
            >
                <WebsiteIcon width={20} height={20} />
                <Trans>View on Website</Trans>
            </Link>
        ) : null;
    }

    const isSupportedChain = chains.some((chain) => chain.id === chainId);
    const loading = isLoading || isRefetching || handlerLoading;
    const disabled = connected && (loading || (data && data.mintStatus > 2) || !isSupportedChain);

    if (isLoading) return null;

    return (
        <>
            <FreeMintModal ref={FreeMintModalRef.register} />
            <div className={classNames('flex items-center gap-3', className)}>
                {isSupportedChain ? (
                    <ClickableButton
                        {...rest}
                        className="bg-main text-lightBottom dark:text-darkBottom flex h-8 flex-1 items-center justify-center rounded-full px-5 text-sm font-bold"
                        disabled={disabled}
                        onClick={handleClick}
                        aria-label={loading ? 'Minting' : getMintButtonAriaLabel(data?.mintStatus)}
                    >
                        {loading ? <LoadingIcon size={20} /> : getMintButtonText(data?.mintStatus)}
                    </ClickableButton>
                ) : null}
                {externalUrl ? (
                    <Link
                        href={externalUrl}
                        target="_blank"
                        className="border-main text-main flex size-8 shrink-0 items-center justify-center rounded-full border"
                    >
                        <WebsiteIcon width={20} height={20} />
                    </Link>
                ) : null}
            </div>
        </>
    );
}
