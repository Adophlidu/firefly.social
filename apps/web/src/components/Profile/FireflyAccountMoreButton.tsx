'use client';

import MoreIcon from '@dimensiondev/assets/more.svg';
import { Source } from '@dimensiondev/enums';
import { SITE_URL } from '@dimensiondev/envs/web';
import { formatAddress } from '@dimensiondev/web3/utils';
import { MenuItem, MenuItems } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import urlcat from 'urlcat';

import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MuteAllByProfile, MuteAllByWallet } from '@/components/Actions/MuteAllProfile.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { useEnsName } from '@/hooks/useEnsName.js';
import { useFireflyIdentity } from '@/hooks/useFireflyIdentity.js';
import { useIsMyRelatedProfile } from '@/hooks/useIsMyRelatedProfile.js';
import { useShareUrl } from '@/hooks/useShareUrl.js';
import { useShortShareUrl } from '@/hooks/useShortShareUrl.js';
import type { FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    walletProfile?: WalletProfile;
    profile?: Profile;
    profiles?: FireflyProfile[];
}

function MuteAllByWalletProfileMenuItem({ profile }: { profile: WalletProfile }) {
    const identity = useFireflyIdentity(Source.Wallet, profile.address);
    const isMyWallet = useIsMyRelatedProfile(identity.source, identity.id);
    const { data: ens } = useEnsName(profile.address);
    if (isMyWallet) return null;
    const ensOrAddress = profile.primary_ens || ens || formatAddress(profile.address, 4);
    return (
        <MenuItem>
            {({ close }) => <MuteAllByWallet address={profile.address} handle={ensOrAddress} onClose={close} />}
        </MenuItem>
    );
}

export function FireflyAccountMoreButton({ profile, walletProfile, profiles = [] }: Props) {
    const profileUrl = useShareUrl(profile ? urlcat(SITE_URL, getProfileUrl(profile)) : '');
    const { register: registerProfileLink } = useShortShareUrl(profileUrl);
    const walletProfileUrl = useShareUrl(
        walletProfile
            ? urlcat(SITE_URL, getProfileUrl({ source: Source.Wallet, profileId: walletProfile.address }))
            : '',
    );
    const { register: registerWalletProfileLink } = useShortShareUrl(walletProfileUrl);

    return (
        <MoreActionMenu
            useTransition={false}
            button={<MoreIcon width={22} height={22} className="shrink-0" />}
            buttonProps={{
                className:
                    'bg-bg text-second inline-flex size-8 items-center justify-center rounded-lg active:opacity-50 md:hover:opacity-60',
            }}
        >
            <MenuItems
                anchor="bottom end"
                transition
                className="z-[1000] flex w-max flex-col gap-2 overflow-hidden rounded-2xl border border-line bg-primaryBottom py-3 text-base text-main duration-100 data-[closed]:scale-95 data-[closed]:opacity-0"
            >
                {profile ? (
                    <>
                        <MenuItem>
                            {({ close }) => (
                                <CopyLinkButton getLink={registerProfileLink} onClick={close}>
                                    <Trans>Copy link to profile</Trans>
                                </CopyLinkButton>
                            )}
                        </MenuItem>
                        {profiles?.length > 1 ? (
                            <MenuItem>{({ close }) => <MuteAllByProfile profile={profile} onClose={close} />}</MenuItem>
                        ) : null}
                    </>
                ) : null}
                {walletProfile ? (
                    <>
                        <MenuItem>
                            {({ close }) => (
                                <CopyLinkButton getLink={registerWalletProfileLink} onClick={close}>
                                    <Trans>Copy link to profile</Trans>
                                </CopyLinkButton>
                            )}
                        </MenuItem>
                        {profiles?.length > 1 ? <MuteAllByWalletProfileMenuItem profile={walletProfile} /> : null}
                    </>
                ) : null}
            </MenuItems>
        </MoreActionMenu>
    );
}
