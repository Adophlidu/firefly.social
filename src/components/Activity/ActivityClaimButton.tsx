'use client';

import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type ReactNode, use, useContext, useState } from 'react';
import { useAsyncFn } from 'react-use';

import { ActivityContext } from '@/components/Activity/ActivityContext.js';
import { ActivityMintSuccessDialog } from '@/components/Activity/ActivityMintSuccessDialog.js';
import { ActivityPremiumListContext } from '@/components/Activity/ActivityPremiumListContext.js';
import { useActivityClaimCondition } from '@/components/Activity/hooks/useActivityClaimCondition.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import type { SocialSource } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { enqueueMessageFromError } from '@/helpers/enqueueMessage.js';
import { safeUnreachable } from '@/helpers/unreachable.js';
import { FireflyActivityProvider } from '@/providers/firefly/Activity.js';
import { captureActivityClaimEvent } from '@/providers/telemetry/captureActivityEvent.js';
import { ActivityStatus } from '@/providers/types/Firefly.js';
import type { Chars } from '@/types/chars.js';
import { EthereumChainId } from '@/web3-shared/evm/types.js';

interface Props {
    status: ActivityStatus;
    claimApiExtraParams?: Record<string, unknown>;
    claimType?: string;
    shareContent: Chars;
    disabled?: boolean;
    source: SocialSource | SocialSource[];
    buttonText?: ReactNode;
    onSuccess?: (tx?: string) => void;
    hasSuccessDialog?: boolean; // TODO: move success dialog to outside
}

export function ActivityClaimButton({
    source,
    shareContent,
    status,
    claimApiExtraParams,
    hasSuccessDialog = true,
    onSuccess,
    ...rest
}: Props) {
    const { address, name } = useContext(ActivityContext);
    const { data, refetch } = useActivityClaimCondition(source);
    const [hash, setHash] = useState<string | undefined>(undefined);
    const [chainId, setChainId] = useState<EthereumChainId | 'solana' | undefined>(undefined);
    const { list } = use(ActivityPremiumListContext);

    const isPremium = list.some((x) => x.verified);
    const disabled = status === ActivityStatus.Ended || !data?.canClaim || !address || rest.disabled;

    const [{ loading }, claim] = useAsyncFn(async () => {
        if (disabled || !address) return;
        try {
            const { hash, chainId } = await FireflyActivityProvider.claimActivitySBT(
                address,
                name,
                claimApiExtraParams,
            );
            await refetch();
            setHash(hash);
            setChainId(chainId);
            onSuccess?.(hash);
            captureActivityClaimEvent(address, isPremium);
        } catch (error) {
            await refetch();
            enqueueMessageFromError(error, t`Failed to claim token`);
            throw error;
        }
    }, [disabled, address, name, claimApiExtraParams, refetch, onSuccess, isPremium]);

    const buttonText = (() => {
        switch (status) {
            case ActivityStatus.Upcoming:
                return <Trans>Not Started</Trans>;
            case ActivityStatus.Ended:
                return <Trans>Ended</Trans>;
            case ActivityStatus.Active:
                if (data?.alreadyClaimed) {
                    return <Trans>Claimed</Trans>;
                }
                if (!disabled || data?.canClaim) {
                    return isPremium ? <Trans>Claim Premium</Trans> : <Trans>Claim Basic</Trans>;
                }
                return <Trans>Claim Now</Trans>;
            default:
                safeUnreachable(status);
                return null;
        }
    })();

    return (
        <>
            {hasSuccessDialog ? (
                <ActivityMintSuccessDialog
                    shareContent={shareContent}
                    hash={hash}
                    open={!!hash}
                    chainId={chainId}
                    onClose={() => setHash(undefined)}
                />
            ) : null}
            <button
                className="leading-12 relative flex h-12 w-full items-center justify-center rounded-full bg-main text-center text-base font-bold text-primaryBottom disabled:opacity-60"
                disabled={disabled || loading}
                onClick={claim}
            >
                {loading ? (
                    <span className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
                        <LoadingIcon size={16} />
                    </span>
                ) : null}
                <span
                    className={classNames('flex items-center', {
                        'opacity-0': loading,
                    })}
                >
                    {rest.buttonText || buttonText}
                </span>
            </button>
        </>
    );
}
