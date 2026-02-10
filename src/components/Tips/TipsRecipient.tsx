import { Trans } from '@lingui/react/macro';
import { useRouter } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';

import ArrowDownIcon from '@/assets/arrow-line-down.svg';
import SmallFireflyAvatar from '@/assets/small-firefly.svg';
import { RecipientAvatar } from '@/components/Tips/RecipientAvatar.js';
import { TipsRoutePath } from '@/components/Tips/TipsModalRouter.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { isMPCWallet } from '@/helpers/isMPCWallet.js';
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
    const isFireflyWallet = recipient.__origin__ ? isMPCWallet(recipient.__origin__ as WalletProfile) : false;

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            className="flex h-[77px] cursor-pointer items-center gap-3 rounded-xl bg-input p-4 dark:bg-lightBg"
            onClick={openRecipientSelector}
        >
            <RecipientAvatar recipient={recipient} />
            <div className="min-w-0 flex-1">
                {!ensName ? (
                    <div className="break-all text-left text-medium font-medium text-main">
                        {recipient.address}
                        {isPrimary ? (
                            <span className="ml-1 inline-flex h-4 -translate-y-0.5 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium text-highlight">
                                <Trans>Primary</Trans>
                            </span>
                        ) : null}
                        {isFireflyWallet ? (
                            <span className="ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium text-highlight">
                                <SmallFireflyAvatar width={13} height={13} />
                            </span>
                        ) : null}
                    </div>
                ) : (
                    <div className="flex flex-col items-start text-left">
                        <span className="text-medium font-bold text-main">{ensName}</span>
                        <div className="flex items-center">
                            <span className="text-[13px] text-second">{formatAddress(recipient.address, 4)}</span>
                            {isPrimary ? (
                                <span className="ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium text-highlight">
                                    <Trans>Primary</Trans>
                                </span>
                            ) : null}
                            {isFireflyWallet ? (
                                <span className="ml-1 inline-flex h-4 items-center rounded bg-[#DDDFFF] px-2 text-[10px] font-medium text-highlight">
                                    <SmallFireflyAvatar width={13} height={13} />
                                </span>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
            {recipientList.length > 1 ? <ArrowDownIcon width={18} height={18} className="shrink-0 text-main" /> : null}
        </motion.div>
    );
});
