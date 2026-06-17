'use client';

import MoreIcon from '@dimensiondev/assets/more.svg';
import { Source, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { formatAddress, isValidAddressEthereum } from '@dimensiondev/web3/utils';
import { MenuItem } from '@headlessui/react';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import type { Address } from 'viem';

import { MuteWalletButton } from '@/components/Actions/MuteWalletButton.js';
import { WatchWalletButton } from '@/components/Actions/WatchWalletButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { Tips } from '@/components/Tips/index.js';
import { Tooltip } from '@/components/Tooltip.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useIsWalletMuted } from '@/hooks/useIsWalletMuted.js';

interface Props {
    address: Address;
    ens?: string;
    showTips?: boolean;
    autoQueryEns?: boolean;
    icon?: React.ReactElement;
}

export function WalletBaseMoreAction({
    ens: originalEns,
    address,
    showTips = true,
    autoQueryEns = false,
    icon,
}: Props) {
    const { data: isMuted } = useIsWalletMuted(address);
    const profiles = useCurrentFireflyProfilesAll();

    const identity = useFireflyIdentity(Source.Wallet, address);
    const isMyProfile = useIsMyRelatedProfile(identity.source, identity.id);

    const { data: ensFromQuery } = useEnsName(address, autoQueryEns);

    const ens = originalEns || ensFromQuery;
    const ensOrAddress = ens || formatAddress(address, 4);

    const shouldShowTips =
        envs.external.NEXT_PUBLIC_TIPS === STATUS.Enabled &&
        showTips &&
        isValidAddressEthereum(address) &&
        !profiles.some((profile) => isSameFireflyIdentity(profile.identity, identity));

    if (!shouldShowTips && isMyProfile) {
        return null;
    }

    return (
        <MoreActionMenu
            button={
                <Tooltip content={<Trans>More</Trans>} placement="top">
                    {icon ?? <MoreIcon width={24} height={24} className="text-secondary" />}
                </Tooltip>
            }
        >
            <MenuGroup>
                {!isMyProfile ? (
                    <>
                        <MenuItem>
                            {({ close }) => (
                                <WatchWalletButton
                                    handleOrEnsOrAddress={ensOrAddress}
                                    address={address}
                                    onSuccess={close}
                                />
                            )}
                        </MenuItem>
                        <MenuItem>
                            {({ close }) => (
                                <MuteWalletButton
                                    handleOrEnsOrAddress={ensOrAddress}
                                    address={address}
                                    isMuted={isMuted}
                                    onClick={close}
                                />
                            )}
                        </MenuItem>
                    </>
                ) : null}
                {shouldShowTips ? (
                    <MenuItem>
                        {({ close }) => (
                            <Tips
                                className="px-3 py-1 !text-main hover:bg-bg"
                                identity={identity}
                                handle={ens}
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
}
