'use client';

import { MenuItem, type MenuProps } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { memo } from 'react';
import { useEnsName } from 'wagmi';

import MoreIcon from '@/assets/more-fill.svg';
import { MuteWalletButton } from '@/components/Actions/MuteWalletButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tips } from '@/components/Tips/index.js';
import { Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsWalletMuted } from '@/hooks/useIsWalletMuted.js';
import type { WalletProfile } from '@/providers/types/Firefly.js';

interface MoreProps extends Omit<MenuProps<'div'>, 'className'> {
    profile: WalletProfile;
    className?: string;
    buttonClassName?: string;
}

export const WalletMoreAction = memo<MoreProps>(function WalletMoreAction({ profile, className, buttonClassName }) {
    const { data: ens } = useEnsName({ address: profile.address });
    const { data: isMuted } = useIsWalletMuted(profile.address);

    const identity = useFireflyIdentity(Source.Wallet, profile.address);

    const ensOrAddress = profile.primary_ens || ens || formatAddress(profile.address, 4);

    return (
        <MoreActionMenu
            button={<MoreIcon width={22} height={22} className="shrink-0" />}
            className={className}
            buttonClassName={classNames(
                'size-8 justify-center rounded-lg bg-primaryBottom !text-lightHighlight dark:bg-white dark:bg-opacity-[0.08] dark:text-main',
                buttonClassName,
            )}
        >
            <MenuGroup>
                <MenuItem>
                    {({ close }) => (
                        <MuteWalletButton
                            handleOrEnsOrAddress={ensOrAddress}
                            isMuted={isMuted}
                            address={profile.address}
                            onClick={close}
                        />
                    )}
                </MenuItem>
                <MenuItem>
                    {({ close }) => (
                        <Tips
                            className="px-3 py-1 !text-main hover:bg-bg"
                            identity={identity}
                            handle={profile.primary_ens || ens}
                            tooltipDisabled
                            label={t`Send a tip`}
                            onClick={close}
                            pureWallet
                        />
                    )}
                </MenuItem>
            </MenuGroup>
        </MoreActionMenu>
    );
});
