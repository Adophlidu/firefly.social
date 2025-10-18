'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import SettingIcon from '@/assets/setting.svg';
import { Link } from '@/components/Link.js';
import { ComeBackButton } from '@/components/Profile/ComeBackButton.js';
import { FireflyAccountInfoUI } from '@/components/Profile/FireflyAccountInfoUI.js';
import { FireflyAccountMoreButton } from '@/components/Profile/FireflyAccountMoreButton.js';
import { ProfileAction } from '@/components/Profile/ProfileAction.js';
import { ShareButton } from '@/components/Profile/ShareButton.js';
import { PROFILE_ACTION_ID } from '@/components/Profile/SocialProfileInfo.js';
import { TipsButton } from '@/components/Profile/TipsButton.js';
import { Title } from '@/components/Profile/Title.js';
import { WalletActions } from '@/components/Profile/WalletActions.js';
import { WALLET_PROFILE_ACTION_ID } from '@/components/Profile/WalletInfo.js';
import { NetworkType, PageRoute, Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { formatFireflyProfilesFromWalletProfiles } from '@/helpers/formatFireflyProfilesFromWalletProfiles.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { useCurrentProfilesAll } from '@/hooks/useCurrentProfile.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { useProfileHighlighted } from '@/hooks/useProfileHighlighted.js';
import { getAllPlatformProfileFromFirefly } from '@/providers/firefly/getAllPlatformProfileFromFirefly.js';
import type {
    FireflyAccountProfile,
    FireflyIdentity,
    FireflyProfile,
    WalletProfile,
    WalletProfiles,
} from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    walletProfile?: WalletProfile | null;
    socialProfile?: Profile | null;
    identity: FireflyIdentity;
    profile?: FireflyAccountProfile | null;
    relatedProfile: WalletProfiles;
}

export function FireflyAccountInfo({ walletProfile, socialProfile, identity, relatedProfile }: Props) {
    const { data } = useQuery({
        queryKey: ['firefly-profile', identity],
        async queryFn() {
            return getAllPlatformProfileFromFirefly(identity, false);
        },
        initialData: relatedProfile,
    });
    const { displayName, uid, avatar } = data?.account || {};
    const noFireflyAccount = (!displayName && !avatar) || !uid;
    const profiles = formatFireflyProfilesFromWalletProfiles(data ?? relatedProfile) as FireflyProfile[];

    return (
        <>
            {data?.account && !noFireflyAccount ? (
                <FireflyAccountWithTitleUI
                    relatedProfile={relatedProfile}
                    identity={identity}
                    walletProfile={walletProfile}
                    socialProfile={socialProfile}
                    profile={data.account}
                    profiles={profiles}
                />
            ) : (
                <FallbackFireflyAccountInfo
                    relatedProfile={relatedProfile}
                    identity={identity}
                    walletProfile={walletProfile}
                    socialProfile={socialProfile}
                    profile={data.account}
                    profiles={profiles}
                />
            )}
        </>
    );
}

interface FireflyAccountWithTitleUIProps {
    walletProfile?: WalletProfile | null;
    socialProfile?: Profile | null;
    identity: FireflyIdentity;
    profile: FireflyAccountProfile;
    relatedProfile: WalletProfiles;
    profiles: FireflyProfile[];
}

function FireflyAccountWithTitleUI({
    identity,
    walletProfile,
    socialProfile,
    relatedProfile,
    profile,
    profiles,
}: FireflyAccountWithTitleUIProps) {
    const { data: highlighted } = useProfileHighlighted(
        socialProfile
            ? socialProfile
            : walletProfile
              ? {
                    source: Source.Wallet,
                    profileId: walletProfile.address,
                    handle: walletProfile.address,
                }
              : null,
        true,
    );

    return (
        <>
            <div className="sticky left-0 top-0 z-navbar h-0 w-full duration-200">
                <NavigationBar identity={identity} walletProfile={walletProfile} socialProfile={socialProfile} />
            </div>
            <FireflyAccountInfoUI profile={profile} highlighted={highlighted} className="z-banner">
                <FireflyAccountInfoHeader
                    identity={identity}
                    walletProfile={walletProfile}
                    socialProfile={socialProfile}
                    relatedProfile={relatedProfile}
                    profiles={profiles}
                />
            </FireflyAccountInfoUI>
        </>
    );
}

function FallbackFireflyAccountInfo({
    walletProfile,
    socialProfile,
    identity,
    profile,
    relatedProfile,
    profiles,
}: Omit<FireflyAccountWithTitleUIProps, 'profile'> & { profile?: FireflyAccountProfile }) {
    const allCurrentProfiles = useCurrentProfilesAll();
    const isCurrentProfile = useMemo(() => {
        return profiles?.some((x) =>
            Object.values(allCurrentProfiles).some(
                (currentProfile) =>
                    x.identity.source === currentProfile?.source &&
                    (x.identity.id === currentProfile.profileId || x.identity.id === currentProfile?.handle),
            ),
        );
    }, [allCurrentProfiles, profiles]);
    if (profile && isCurrentProfile) {
        return (
            <CurrentFireflyAccountInfoWithTitle
                walletProfile={walletProfile}
                socialProfile={socialProfile}
                identity={identity}
                profile={profile}
                relatedProfile={relatedProfile}
                profiles={profiles}
            />
        );
    }
    return (
        <div className="sticky left-0 top-0 z-navbar w-full">
            <NavigationBar identity={identity} walletProfile={walletProfile} socialProfile={socialProfile} />
        </div>
    );
}

function CurrentFireflyAccountInfoWithTitle({
    walletProfile,
    socialProfile,
    identity,
    profile,
    relatedProfile,
    profiles,
}: FireflyAccountWithTitleUIProps) {
    const avatar = useFireflyAccountAvatar();
    return (
        <FireflyAccountWithTitleUI
            walletProfile={walletProfile}
            socialProfile={socialProfile}
            identity={identity}
            profile={{
                ...profile,
                avatar: avatar || getStampAvatarByProfileId(Source.Firefly, profile.uid) || profile.avatar,
            }}
            relatedProfile={relatedProfile}
            profiles={profiles}
        />
    );
}

function FireflyAccountInfoHeader({
    identity,
    walletProfile,
    socialProfile,
    profiles,
    ref,
}: {
    identity: FireflyIdentity;
    walletProfile?: WalletProfile | null;
    socialProfile?: Profile | null;
    relatedProfile: WalletProfiles;
    profiles: FireflyProfile[];
    ref?: React.Ref<HTMLDivElement>;
}) {
    const allCurrentProfiles = useCurrentProfilesAll();
    const isCurrentProfile = useMemo(() => {
        return profiles?.some((x) =>
            Object.values(allCurrentProfiles).some(
                (currentProfile) =>
                    x.identity.source === currentProfile?.source &&
                    (x.identity.id === currentProfile.profileId || x.identity.id === currentProfile?.handle),
            ),
        );
    }, [allCurrentProfiles, profiles]);

    return (
        <div className="light relative mt-5 flex w-full px-6" ref={ref}>
            <ComeBackButton />
            <div className="ml-auto flex space-x-2">
                {isCurrentProfile ? (
                    <>
                        <Link
                            href={PageRoute.SettingConnected}
                            className="inline-flex size-8 items-center justify-center rounded-lg bg-bg text-second active:opacity-50 md:hover:opacity-60"
                        >
                            <SettingIcon />
                        </Link>
                        {socialProfile ? <ShareButton profile={socialProfile} /> : null}
                    </>
                ) : null}
                {!isCurrentProfile ? (
                    <>
                        {socialProfile ? (
                            <>
                                <TipsButton identity={identity} profiles={profiles} handle={socialProfile.handle} />
                                <FireflyAccountMoreButton profile={socialProfile} profiles={profiles} />
                            </>
                        ) : null}
                        {walletProfile ? (
                            <>
                                <TipsButton
                                    identity={identity}
                                    profiles={profiles}
                                    handle={walletProfile.primary_ens ?? walletProfile.address}
                                />
                                <FireflyAccountMoreButton walletProfile={walletProfile} profiles={profiles} />
                            </>
                        ) : null}
                    </>
                ) : null}
            </div>
        </div>
    );
}

function NavigationBar({
    identity,
    walletProfile,
    socialProfile,
}: {
    identity: FireflyIdentity;
    walletProfile?: WalletProfile | null;
    socialProfile?: Profile | null;
}) {
    const isLogin = useIsLogin(narrowToSocialSource(identity.source));
    const title = useMemo(() => {
        if (walletProfile)
            return walletProfile.primary_ens ?? formatAddress(walletProfile.address, 4, undefined, false);
        if (isRequestedLoginSource(identity.source) && !isLogin) return <Trans>Sign in to unlock</Trans>;
        return socialProfile?.displayName;
    }, [walletProfile, identity.source, isLogin, socialProfile?.displayName]);
    const [profileActionRef, profileActionEntry] = useIntersectionObserver({
        threshold: 0.5,
        rootMargin: '-60px 0px 0px',
    });
    useEffect(() => {
        const element = document.getElementById(PROFILE_ACTION_ID) ?? document.getElementById(WALLET_PROFILE_ACTION_ID);
        if (element) profileActionRef(element);
    }, [profileActionRef]);
    const showProfileAction = profileActionEntry && !profileActionEntry.isIntersecting;
    return (
        <Title title={title}>
            <div
                className={classNames('flex flex-shrink-0 transform gap-2 duration-200', {
                    'pointer-events-none opacity-0': !showProfileAction,
                })}
            >
                {identity?.source === Source.Wallet && walletProfile ? (
                    getAddressType(identity.id) === NetworkType.Ethereum ? (
                        <WalletActions profile={walletProfile} />
                    ) : null
                ) : socialProfile ? (
                    <ProfileAction profile={socialProfile} />
                ) : null}
            </div>
        </Title>
    );
}
