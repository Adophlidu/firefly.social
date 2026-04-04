'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { Image } from '@/components/Image.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { formatTokenItemAmount } from '@/components/Tips/formatTokenItemAmount.js';
import { TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { resolveNetworkProvider } from '@/helpers/resolveTokenTransfer.js';
import { useTipsStore } from '@/store/useTipsStore.js';

export const TipsTokenInput = memo(function TipsTokenInput() {
    const router = useRouter();
    const { token, recipient } = useTipsStore();

    const [{ loading }, handleSelectToken] = useAsyncFn(async () => {
        if (!recipient) return;

        const networkProvider = resolveNetworkProvider(recipient.networkType);
        const account = await networkProvider.getAccount();
        if (!account) return;

        router.navigate({ to: TipsRoutePath.SELECT_TOKEN });
    }, [router, recipient]);

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-input dark:bg-lightBg mt-3 flex h-[68px] cursor-pointer items-center gap-3 rounded-xl px-4"
            onClick={async () => {
                if (loading) return;
                await handleSelectToken();
            }}
        >
            {!token ? (
                <span className="text-medium text-second flex-1 text-left">
                    <Trans>Choose a token to send</Trans>
                </span>
            ) : (
                <>
                    {token.logo_url ? (
                        <div className="relative size-9">
                            <div
                                className="flex size-full items-center justify-center rounded-full"
                                style={{
                                    boxShadow: '0px 8px 16px 0px rgba(28, 104, 243, 0.20)',
                                    backdropFilter: 'blur(11px)',
                                }}
                            >
                                <Image
                                    width={36}
                                    height={36}
                                    alt={token.name}
                                    src={token.logo_url}
                                    className="size-full rounded-full object-cover"
                                />
                            </div>
                            {token.chainLogoUrl ? (
                                <div className="z-1 absolute -right-1 bottom-0 size-[18px] rounded-full border border-white bg-white">
                                    <Image
                                        width={16}
                                        height={16}
                                        className="size-full"
                                        alt={token.chain}
                                        src={token.chainLogoUrl}
                                    />
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                        <span className="text-medium text-main w-full truncate font-bold">{token.name}</span>
                        <span className="text-second text-[13px]">
                            <Trans>
                                Balance:{' '}
                                {`${token.amount ? formatTokenItemAmount(token.amount) : '-'} ${token.symbol?.toUpperCase()}`}
                            </Trans>
                        </span>
                    </div>
                </>
            )}
            {loading ? <LoadingIcon size={18} /> : <ArrowDownIcon width={18} height={18} />}
        </motion.div>
    );
});
