'use client';

import MoreIcon from '@dimensiondev/assets/more-fill.svg';
import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { formatAddress, isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { MenuItem, type MenuProps } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { compact, sum } from 'lodash-es';
import { memo } from 'react';
import type { Address } from 'viem';

import { MuteAllByWallet } from '@/components/Actions/MuteAllProfile.js';
import { MuteWalletButton } from '@/components/Actions/MuteWalletButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tips } from '@/components/Tips/index.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useFireflyProfileByIdentity } from '@/hooks/useFireflyProfileByIdentity.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useIsWalletMuted } from '@/hooks/useIsWalletMuted.js';
import type { FireflyIdentity, WalletProfile } from '@/providers/types/Firefly.js';

interface MoreProps extends Omit<MenuProps<'div'>, 'className'> {
    profile: WalletProfile;
    className?: string;
    buttonClassName?: string;
}

export const WalletMoreAction = memo<MoreProps>(function WalletMoreAction({ profile, className, buttonClassName }) {
    const { data: ens } = useEnsName(profile.address);
    const { data: isMuted } = useIsWalletMuted(profile.address);

    const identity = useFireflyIdentity(Source.Wallet, profile.address);
    const isMyWallet = useIsMyRelatedProfile(identity.source, identity.id);

    const ensOrAddress = profile.primary_ens || ens || formatAddress(profile.address, 4, undefined, false);

    return (
        <MoreActionMenu
            button={<MoreIcon width={22} height={22} className="shrink-0" />}
            className={className}
            buttonClassName={classNames(
                'size-8 justify-center rounded-lg bg-primaryBottom !text-highlight dark:bg-white dark:bg-opacity-[0.08] dark:text-main',
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
                {!isMyWallet ? (
                    <MuteAllByWalletMenuItem
                        identity={identity}
                        address={profile.address}
                        ensOrAddress={ensOrAddress}
                    />
                ) : null}
                {isValidAddressEthereum(profile.address) ? (
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
                ) : null}
            </MenuGroup>
        </MoreActionMenu>
    );
});

function MuteAllByWalletMenuItem({
    address,
    ensOrAddress,
    identity,
}: {
    address: Address;
    ensOrAddress?: string;
    identity: FireflyIdentity;
}) {
    const { data } = useFireflyProfileByIdentity(identity);
    const profileCount = sum(
        compact([
            data?.twitterProfiles?.length,
            data?.bskyProfiles?.length,
            data?.farcasterProfiles?.length,
            data?.lensProfilesV3?.length,
            data?.walletProfiles?.length,
            data?.solanaWalletProfiles?.length,
        ]),
    );
    const fireflyProfile = data?.account;
    const noFireflyAccount =
        !fireflyProfile || (!fireflyProfile?.displayName && !fireflyProfile?.avatar) || !fireflyProfile?.uid;
    return (
        <MenuItem>
            {({ close }) => (
                <MuteAllByWallet
                    className={classNames({ hidden: !noFireflyAccount || profileCount <= 1 })}
                    address={address}
                    handle={ensOrAddress}
                    onClose={close}
                />
            )}
        </MenuItem>
    );
}
