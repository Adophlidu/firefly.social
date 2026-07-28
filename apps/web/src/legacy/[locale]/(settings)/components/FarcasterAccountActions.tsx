'use client';

import MoreIcon from '@dimensiondev/assets/more-fill.svg';
import SecurityIcon from '@dimensiondev/assets/security2.svg';
import WalletBoldIcon from '@dimensiondev/assets/wallet-bold2.svg';
import { MenuItem } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { memo } from 'react';

import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { openRecoveryPhraseModal } from '@/controllers/openRecoveryPhraseModal.js';
import { openVerifiedAddressModal } from '@/controllers/openVerifiedAddressModal.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    profile: Profile;
    isCustodyWallet: boolean;
}

export const FarcasterAccountActions = memo<Props>(function FarcasterAccountActions({ profile, isCustodyWallet }) {
    return (
        <MoreActionMenu
            button={
                <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="inline-flex size-5 items-center justify-center rounded-full hover:bg-link/[0.2] hover:text-link"
                >
                    <MoreIcon width={20} height={20} className="size-5 shrink-0 text-second" />
                </motion.div>
            }
            loginRequired={false}
        >
            <MenuGroup>
                <MenuItem>
                    {({ close }) => (
                        <MenuButton
                            onClick={() => {
                                openVerifiedAddressModal({
                                    fid: profile.profileId,
                                });
                                close();
                            }}
                        >
                            <span className="flex items-center gap-2 font-bold leading-[22px] text-main">
                                <WalletBoldIcon className="size-[18px]" />
                                <Trans>Verified addresses</Trans>
                            </span>
                        </MenuButton>
                    )}
                </MenuItem>
                {isCustodyWallet ? (
                    <MenuItem>
                        {({ close }) => (
                            <MenuButton
                                onClick={() => {
                                    close();
                                    openRecoveryPhraseModal({
                                        fid: profile.profileId,
                                    });
                                }}
                            >
                                <span className="flex items-center gap-2 font-bold leading-[22px] text-main">
                                    <SecurityIcon className="size-[18px]" />
                                    <Trans>Export recovery phrase</Trans>
                                </span>
                            </MenuButton>
                        )}
                    </MenuItem>
                ) : null}
            </MenuGroup>
        </MoreActionMenu>
    );
});
