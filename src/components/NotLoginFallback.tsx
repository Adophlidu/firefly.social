'use client';

import { classNames, createLookupTableResolver } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { type HTMLProps, memo, type ReactNode } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { type LoginFallbackSource, type ProfileSource, Source } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { openLoginModal } from '@/helpers/openLoginModal.js';
import { resolveFallbackImageUrl } from '@/helpers/resolveFallbackImageUrl.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useAsyncStatus } from '@/hooks/useAsyncStatus.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';

const resolveConnectButtonClass = createLookupTableResolver<LoginFallbackSource, string>(
    {
        [Source.Lens]:
            'text-lensPrimary ring-lensPrimary hover:bg-[rgba(154,227,42,0.20)] hover:shadow-[0_0_16px_0_rgba(101,119,134,0.20)]',
        [Source.Farcaster]:
            'text-farcasterPrimary ring-farcasterPrimary hover:bg-fireflyBrand/20 hover:shadow-[0_0_16px_0_rgba(101,119,134,0.20)]',
        [Source.Twitter]: 'w-[203px] text-main ring-main hover:bg-main/20 hover:shadow-[rgba(101,119,134,0.20)]',
        [Source.Wallet]: 'w-[203px] text-main ring-main hover:bg-main/20 hover:shadow-[rgba(101,119,134,0.20)]',
        [Source.Bsky]:
            'w-[203px] text-[#0A7AFF] ring-[#0A7AFF] hover:bg-[#1C68F333] hover:shadow-[0_0_16px_0_rgba(101,119,134,0.20)]',
        [Source.Article]:
            'w-[203px] text-[#AD7BFF] ring-[#AD7BFF] shadow-[0_0_16px_0_rgba(101,119,134,0.2)] hover:bg-[#AD7BFF33]/20',
        [Source.DAOs]:
            'w-[203px] text-[#AD7BFF] ring-[#AD7BFF] shadow-[0_0_16px_0_rgba(101,119,134,0.2)] hover:bg-[#AD7BFF33]/20',
        [Source.Prediction]:
            'w-[203px] text-[#AD7BFF] ring-[#AD7BFF] shadow-[0_0_16px_0_rgba(101,119,134,0.2)] hover:bg-[#AD7BFF33]/20',
        [Source.Posts]:
            'w-[203px] text-[#AD7BFF] ring-[#AD7BFF] shadow-[0_0_16px_0_rgba(101,119,134,0.2)] hover:bg-[#AD7BFF33]/20',
        [Source.Notifications]:
            'w-[203px] text-[#AD7BFF] ring-[#AD7BFF] shadow-[0_0_16px_0_rgba(101,119,134,0.2)] hover:bg-[#AD7BFF33]/20',
        [Source.NFTs]:
            'w-[203px] text-[#AD7BFF] ring-[#AD7BFF] shadow-[0_0_16px_0_rgba(101,119,134,0.2)] hover:bg-[#AD7BFF33]/20',
        [Source.Swap]:
            'w-[203px] text-[#AD7BFF] ring-[#AD7BFF] shadow-[0_0_16px_0_rgba(101,119,134,0.2)] hover:bg-[#AD7BFF33]/20',
        [Source.Tokens]:
            'w-[203px] text-[#AD7BFF] ring-[#AD7BFF] shadow-[0_0_16px_0_rgba(101,119,134,0.2)] hover:bg-[#AD7BFF33]/20',
    },
    '',
);

interface NotLoginFallbackProps extends HTMLProps<HTMLDivElement> {
    source: LoginFallbackSource;
    message?: ReactNode;
}

export const NotLoginFallback = memo<NotLoginFallbackProps>(function NotLoginFallback({
    source,
    message,
    className,
    ...rest
}) {
    const fallbackImageUrl = resolveFallbackImageUrl(source);
    const isNotSocialSource = [
        Source.Article,
        Source.DAOs,
        Source.Prediction,
        Source.NFTs,
        Source.Posts,
        Source.Notifications,
        Source.Swap,
        Source.Tokens,
    ].includes(source);
    const isWallet = source === Source.Wallet;
    const isTwitter = source === Source.Twitter;

    const asyncStatusTwitter = useAsyncStatus(Source.Twitter);
    const isTwitterConnecting = source === Source.Twitter && asyncStatusTwitter;

    return (
        <div
            {...rest}
            className={classNames(
                'flex grow flex-col items-center justify-center space-y-9 pb-12 pt-[15vh]',
                className,
            )}
        >
            <Image
                src={fallbackImageUrl}
                width={isNotSocialSource ? 302 : 200}
                height={isNotSocialSource ? 208 : 200}
                alt={`${resolveSourceName(source)} login`}
            />
            <span className="leading-3.5 px-6 text-center text-base text-secondary">
                {message ??
                    (isNotSocialSource ? (
                        <Trans>Login to enable all features</Trans>
                    ) : isTwitter ? (
                        <Trans>Your sign-in process was interrupted, please try again</Trans>
                    ) : (
                        <Trans>You need to connect your {resolveSourceName(source)} account to use this feature.</Trans>
                    ))}
            </span>
            <ClickableButton
                className={classNames(
                    'rounded-[10px] bg-transparent px-5 py-3.5 text-sm font-bold shadow-sm ring-1 ring-inset',
                    source ? resolveConnectButtonClass(source) : undefined,
                )}
                disabled={isTwitterConnecting}
                onClick={() => {
                    if (isWallet) {
                        WalletConnectModalRef.open();
                        return;
                    }
                    openLoginModal({ source: isNotSocialSource ? undefined : (source as ProfileSource) });
                }}
                aria-label={
                    isWallet
                        ? 'Connect Wallet'
                        : isNotSocialSource || isTwitter
                          ? 'Sign In'
                          : isTwitterConnecting
                            ? 'Connecting'
                            : `Connect to ${resolveSourceName(source)}`
                }
            >
                {isWallet ? (
                    <Trans>Connect Wallet</Trans>
                ) : isNotSocialSource || isTwitter ? (
                    <Trans>Sign In</Trans>
                ) : isTwitterConnecting ? (
                    <Trans>Connecting...</Trans>
                ) : (
                    <Trans>Connect to {resolveSourceName(source)}</Trans>
                )}
            </ClickableButton>
        </div>
    );
});
