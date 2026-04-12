'use client';

import QuestionIcon from '@dimensiondev/assets/question.svg';
import SendIcon from '@dimensiondev/assets/send.svg';
import WalletIcon from '@dimensiondev/assets/wallet.svg';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useCallback } from 'react';

import { ActionButton } from '@/components/ActionButton.js';
import { Tooltip } from '@/components/Tooltip.js';
import { NetworkType } from '@/constants/enum.js';
import { getNetworkTypeFromRpPayload } from '@/helpers/getNetworkTypeFromRpPayload.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { usePrivyAppkitAccountByNetwork } from '@/hooks/appkit/usePrivyAppkitAccountByNetwork.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useOpenFireflyWallet } from '@/hooks/useOpenFireflyWallet.js';
import { useProfileStore } from '@/hooks/useProfileStore.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import type { RedPacketJSONPayload } from '@/providers/types/FireflyRedPacket.js';
import type { Post } from '@/providers/types/SocialMedia.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

interface Props {
    post: Post;
    canClaim: boolean;
    isClaimed: boolean;
    isEmpty: boolean;
    isExpired: boolean;
    isClaiming: boolean;
    isRefunded: boolean;
    isBlacklist: boolean;
    isSponsorable: boolean;
    canRefund: boolean;
    handleShare: () => void;
    handleRefund: () => void;
    refundLoading: boolean;
    balance: number | bigint;
    estimateLoading: boolean;
    payload: RedPacketJSONPayload;
    onClaim: () => void;
}

export const RedPacketCardFooter = memo<Props>(function RedPacketCardFooter({
    post,
    canClaim,
    isClaimed,
    isEmpty,
    isExpired,
    isClaiming,
    isRefunded,
    isBlacklist,
    isSponsorable,
    canRefund,
    handleShare,
    handleRefund,
    refundLoading,
    balance,
    estimateLoading,
    payload,
    onClaim,
}) {
    const networkType = getNetworkTypeFromRpPayload(payload);

    const { currentProfile } = useProfileStore(post.source);
    const isLogin = useIsLogin();
    const appkitAccount = usePrivyAppkitAccountByNetwork(networkType);
    const account = appkitAccount.account?.address || '';

    const connectWallet = useCallback(() => {
        switch (networkType) {
            case NetworkType.Solana:
            case NetworkType.Ethereum:
                WalletConnectModalRef.open({ networkType });
                break;
            default:
                safeUnreachable(networkType);
                break;
        }
    }, [networkType]);

    const openFireflyWallet = useOpenFireflyWallet();

    if (isRefunded || isEmpty) return null;

    if (isExpired) {
        return canRefund ? (
            <div className="light">
                <ActionButton
                    className="flex w-full items-center justify-center"
                    onClick={handleRefund}
                    loading={refundLoading}
                >
                    <Trans>Refund</Trans>
                </ActionButton>
            </div>
        ) : null;
    }

    if (!currentProfile)
        return (
            <div className="light">
                <ActionButton className="w-full" onClick={() => openLoginModal({ source: post.source })}>
                    <Trans>Connect to {resolveSourceName(post.source)}</Trans>
                </ActionButton>
            </div>
        );
    if (!account) {
        return (
            <div className="light">
                <ActionButton className="flex w-full items-center justify-center gap-1" onClick={connectWallet}>
                    <WalletIcon width={16} height={14} />
                    <Trans>Connect Wallet</Trans>
                </ActionButton>
            </div>
        );
    }

    if ((!canClaim || isClaimed || isExpired) && isLogin && !canRefund) {
        return (
            <div className="light">
                <ActionButton
                    variant="secondary"
                    className="flex w-full items-center justify-center gap-x-1"
                    onClick={handleShare}
                >
                    <SendIcon width={16} height={16} />
                    <Trans>Share</Trans>
                </ActionButton>
            </div>
        );
    }

    if (isBlacklist) {
        return (
            <div className="light flex gap-3">
                <ActionButton
                    variant="secondary"
                    className="flex w-full items-center justify-center gap-x-1 text-sm leading-[18px]"
                    onClick={handleShare}
                >
                    <SendIcon width={16} height={16} />
                    <Trans>Share</Trans>
                </ActionButton>
                <ActionButton
                    disabled
                    className="flex w-full items-center justify-center gap-x-1 text-sm leading-[18px]"
                >
                    <Tooltip
                        placement="top"
                        content={
                            <Trans>
                                Oops! Your account is currently blocked. Reach out to support for more details.
                            </Trans>
                        }
                    >
                        <QuestionIcon width={14} height={14} />
                    </Tooltip>
                    <Trans>Access Denied</Trans>
                </ActionButton>
            </div>
        );
    }

    return (
        <div className="light flex gap-3">
            <ActionButton
                variant="secondary"
                className="flex w-full items-center justify-center gap-x-1 text-sm leading-[18px]"
                onClick={handleShare}
            >
                <SendIcon width={16} height={16} />
                <Trans>Share</Trans>
            </ActionButton>
            {balance > 0 || isSponsorable ? (
                <ActionButton
                    loading={estimateLoading || isClaiming}
                    onClick={onClaim}
                    className="flex w-full items-center justify-center gap-x-1 text-sm leading-[18px]"
                >
                    <WalletIcon width={16} height={14} />
                    <Trans>Claim Now</Trans>
                </ActionButton>
            ) : (
                <ActionButton
                    className="flex w-full items-center justify-center gap-x-1 text-sm leading-[18px]"
                    loading={estimateLoading}
                    onClick={() => {
                        const chainId =
                            payload.chainId ||
                            (networkType === NetworkType.Solana ? SolanaChainId.Mainnet : EthereumChainId.Mainnet);
                        openFireflyWallet({
                            path: `/receive?chain=${chainId}`,
                        });
                    }}
                >
                    <Trans>Insufficient Balance for Gas Fee</Trans>
                </ActionButton>
            )}
        </div>
    );
});
