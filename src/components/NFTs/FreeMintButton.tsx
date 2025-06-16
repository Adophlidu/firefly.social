'use client';

import { Trans } from '@lingui/react/macro';
import { useMemo } from 'react';
import { useAsyncFn } from 'react-use';
import type { Address } from 'viem';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

import WebsiteIcon from '@/assets/website-circle.svg';
import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { Link } from '@/components/Link.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { chains } from '@/configs/wagmiClient.js';
import { MintStatus, NetworkType } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { useSponsorMintStatus } from '@/hooks/useSponsorMintStatus.js';
import { FreeMintModalRef, WalletConnectModalRef } from '@/modals/controls.js';

function getMintButtonText(connected: boolean, isSupportedChain: boolean, mintStatus?: MintStatus) {
    if (!connected) return <Trans>Connect Wallet</Trans>;
    if (!isSupportedChain) return <Trans>Unsupported Chain</Trans>;

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
            return <Trans>Unknown status</Trans>;
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
    const account = useAccount();
    const currentChainId = useChainId();
    const { switchChainAsync } = useSwitchChain();
    const isLogin = useIsLoginFirefly();

    const mintTarget = useMemo(
        () => ({
            walletAddress: account.address || '',
            contractAddress: contractAddress || '',
            tokenId,
            chainId,
            buyCount: 1,
        }),
        [account.address, contractAddress, tokenId, chainId],
    );
    const { isLoading, isRefetching, data, refetch } = useSponsorMintStatus(mintTarget, isLogin);

    const connected = !!account.address;
    const [{ loading: handlerLoading }, handleClick] = useAsyncFn(async () => {
        if (!connected) {
            WalletConnectModalRef.open({ networkType: NetworkType.Ethereum });
            return;
        }
        if (!data) return;
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
    }, [account.address, connected, mintTarget, data, currentChainId, collectionId, refetch, switchChainAsync]);

    if (data?.mintStatus === MintStatus.NotSupported || !isLogin || (!isLoading && !data)) {
        return externalUrl ? (
            <Link
                href={externalUrl}
                target="_blank"
                className={classNames(
                    'flex h-8 items-center justify-center gap-1.5 rounded-full border border-main text-sm font-bold text-main',
                    className,
                )}
            >
                <WebsiteIcon width={20} height={20} />
                <Trans>View on Website</Trans>
            </Link>
        ) : null;
    }

    const isSupportedChain = chains.some((chain) => chain.id === chainId);
    const loading = isLoading || isRefetching || handlerLoading;
    const disabled = connected && (loading || (!!data && data?.mintStatus > 2) || !isSupportedChain);

    if (isLoading) return null;

    return (
        <div className={classNames('flex items-center gap-3', className)}>
            <ClickableButton
                {...rest}
                className="flex h-8 flex-1 items-center justify-center rounded-full bg-main px-5 text-sm font-bold text-lightBottom dark:text-darkBottom"
                disabled={disabled}
                onClick={handleClick}
            >
                {loading ? <LoadingIcon size={20} /> : getMintButtonText(connected, isSupportedChain, data?.mintStatus)}
            </ClickableButton>
            {externalUrl ? (
                <Link
                    href={externalUrl}
                    target="_blank"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-main text-main"
                >
                    <WebsiteIcon width={20} height={20} />
                </Link>
            ) : null}
        </div>
    );
}
