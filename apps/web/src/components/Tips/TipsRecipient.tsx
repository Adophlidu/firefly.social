'use client';

import ArrowDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import SmallFireflyAvatar from '@dimensiondev/assets/small-firefly.svg';
import { WalletProfileDataSource } from '@dimensiondev/enums';
import { formatAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';

import { RecipientAvatar } from '@/components/Tips/RecipientAvatar.js';
import { TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';
import { useTipsStore } from '@/store/useTipsStore.js';

export const TipsRecipient = memo(function TipsRecipient() {
    const router = useRouter();
    const { recipient, recipientList } = useTipsStore();

    const openRecipientSelector = useCallback(() => {
        if (recipientList.length < 2) return;

        router.navigate({ to: TipsRoutePath.SELECT_RECIPIENT });
    }, [router, recipientList.length]);

    if (!recipient) return null;

    const ensName = recipient.ens;
    const isPrimary = recipient.__origin__?.isDefault;
    const isFireflyWallet =
        (recipient.__origin__ as WalletProfile | null)?.dataSource === WalletProfileDataSource.Privy;

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-input dark:bg-lightBg flex h-[77px] cursor-pointer items-center gap-3 rounded-xl p-4"
            onClick={openRecipientSelector}
        >
            <RecipientAvatar recipient={recipient} />
            <div className="min-w-0 flex-1">
                {!ensName ? (
                    <div className="text-medium text-main break-all text-left font-medium">
                        {recipient.address}
                        {isPrimary ? (
                            <span className="text-highlight ml-1 inline-flex h-4 -translate-y-0.5 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                <Trans>Primary</Trans>
                            </span>
                        ) : null}
                        {isFireflyWallet ? (
                            <span className="text-highlight ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                <SmallFireflyAvatar width={13} height={13} />
                            </span>
                        ) : null}
                    </div>
                ) : (
                    <div className="flex flex-col items-start text-left">
                        <span className="text-medium text-main font-bold">{ensName}</span>
                        <div className="flex items-center">
                            <span className="text-second text-[13px]">{formatAddress(recipient.address, 4)}</span>
                            {isPrimary ? (
                                <span className="text-highlight ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                    <Trans>Primary</Trans>
                                </span>
                            ) : null}
                            {isFireflyWallet ? (
                                <span className="text-highlight ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium">
                                    <SmallFireflyAvatar width={13} height={13} />
                                </span>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
            {recipientList.length > 1 ? <ArrowDownIcon width={18} height={18} className="text-main shrink-0" /> : null}
        </motion.div>
    );
});
