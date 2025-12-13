import { classNames } from '@dimensiondev/utils';
import { MenuItem, type MenuProps } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { compact, sum } from 'lodash-es';
import { memo } from 'react';

import MoreIcon from '@/assets/more-fill.svg';
import SearchIcon from '@/assets/search.svg';
import { CopyLinkButton } from '@/components/Actions/CopyLinkButton.js';
import { MenuButton } from '@/components/Actions/MenuButton.js';
import { MuteAllByProfile } from '@/components/Actions/MuteAllProfile.js';
import { MuteProfileButton } from '@/components/Actions/MuteProfileButton.js';
import { ReportProfileButton } from '@/components/Actions/ReportProfileButton.js';
import { MenuGroup } from '@/components/MenuGroup.js';
import { MoreActionMenu } from '@/components/MoreActionMenu.js';
import { SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES } from '@/constants/computed.js';
import { SearchType, Source } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { resolveFireflyProfileId } from '@/helpers/resolveFireflyProfileId.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useFireflyProfileByIdentity } from '@/hooks/useFireflyProfileByIdentity.js';
import { useToggleMutedProfile } from '@/hooks/useToggleMutedProfile.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export interface ProfileMoreActionProps extends Omit<MenuProps<'div'>, 'className'> {
    className?: string;
    buttonClassName?: string;
    profile: Profile;
}

export const ProfileMoreAction = memo<ProfileMoreActionProps>(function ProfileMoreAction({
    className,
    profile,
    buttonClassName,
}) {
    const currentProfile = useCurrentProfile(profile.source);
    const profiles = useCurrentFireflyProfilesAll();
    const [, toggleMutedProfile] = useToggleMutedProfile(profile.source);
    const router = useRouter();

    const identity = {
        id: profile.profileId,
        source: profile.source,
    };

    const isRelatedProfile = profiles.some((x) => {
        const profileId = resolveFireflyProfileId(profile);
        if (!profileId) return false;
        return isSameFireflyIdentity(x.identity, identity);
    });

    return (
        <MoreActionMenu
            source={profile.source}
            button={<MoreIcon width={22} height={22} className="shrink-0" />}
            className={className}
            buttonClassName={classNames(
                'size-8 justify-center rounded-lg bg-primaryBottom dark:bg-white dark:bg-opacity-[0.08]',
                buttonClassName,
                {
                    '!text-farcasterPrimary': profile.source === Source.Farcaster,
                    '!text-lensButton': profile.source === Source.Lens,
                    '!text-bskyPrimary': profile.source === Source.Bsky,
                },
            )}
        >
            <MenuGroup>
                <MenuItem>
                    {({ close }) => (
                        <CopyLinkButton link={getProfileUrl(profile)} onClick={close}>
                            <Trans>Copy link to profile</Trans>
                        </CopyLinkButton>
                    )}
                </MenuItem>

                {!isSameProfile(currentProfile, profile) ? (
                    <>
                        {!isRelatedProfile ? (
                            <>
                                {profile.source === Source.Lens ? (
                                    <MenuItem>
                                        {({ close }) => <ReportProfileButton onConfirm={close} profile={profile} />}
                                    </MenuItem>
                                ) : null}
                                <MenuItem>
                                    {({ close }) => (
                                        <MuteProfileButton
                                            onConfirm={close}
                                            profile={profile}
                                            onToggle={toggleMutedProfile}
                                        />
                                    )}
                                </MenuItem>
                                <MuteAllByProfileMenuItem profile={profile} identity={identity} />
                            </>
                        ) : null}
                        {SORTED_SEARCHABLE_POST_BY_PROFILE_SOURCES.includes(profile.source) ? (
                            <>
                                <MenuItem>
                                    {({ close }) => (
                                        <MenuButton
                                            onClick={() => {
                                                close();
                                                router.push(
                                                    resolveSearchUrl(
                                                        `from: ${profile.handle} `,
                                                        SearchType.Posts,
                                                        profile.source,
                                                    ),
                                                );
                                            }}
                                        >
                                            <SearchIcon width={18} height={18} />
                                            <span className="font-bold leading-[22px] text-main">
                                                <Trans>Search in profile</Trans>
                                            </span>
                                        </MenuButton>
                                    )}
                                </MenuItem>
                            </>
                        ) : null}
                    </>
                ) : null}
            </MenuGroup>
        </MoreActionMenu>
    );
});

function MuteAllByProfileMenuItem({ profile, identity }: { profile: Profile; identity: FireflyIdentity }) {
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
                <MuteAllByProfile
                    className={classNames({ hidden: !noFireflyAccount || profileCount <= 1 })}
                    profile={profile}
                    onClose={close}
                />
            )}
        </MenuItem>
    );
}
