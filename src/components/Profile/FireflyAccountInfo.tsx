'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';

import SettingIcon from '@/assets/setting.svg';
import { Avatar } from '@/components/Avatar.js';
import { CopyTextButton } from '@/components/CopyTextButton.js';
import { Image } from '@/components/Image.js';
import { Link } from '@/components/Link.js';
import { ComeBackButton } from '@/components/Profile/ComeBackButton.js';
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
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useFireflyAccountAvatar } from '@/hooks/useFireflyAccountAvatar.js';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver.js';
import { useIsLogin } from '@/hooks/useIsLogin.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import type {
    FireflyAccountProfile,
    FireflyIdentity,
    FireflyProfile,
    WalletProfile,
} from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    banner?: string;
    walletProfile?: WalletProfile;
    socialProfile?: Profile;
    identity: FireflyIdentity;
    profiles?: FireflyProfile[];
    profile?: FireflyAccountProfile | null;
}

export function FireflyAccountInfo({ banner, walletProfile, socialProfile, identity, profiles, profile }: Props) {
    const { data = profile } = useQuery({
        queryKey: ['firefly-profile', identity],
        async queryFn() {
            const walletProfiles = await FireflyEndpointProvider.getAllPlatformProfileFromFirefly(identity, false);
            return walletProfiles.account;
        },
        initialData: profile,
    });
    const { displayName, uid } = data || {};
    const avatar = useFireflyAccountAvatar();
    const [buttonContainerRef, buttonContainerEntry] = useIntersectionObserver({
        threshold: 0.5,
    });
    const [profileActionRef, profileActionEntry] = useIntersectionObserver({
        threshold: 0.5,
        rootMargin: '-60px 0px 0px',
    });
    useEffect(() => {
        const element = document.getElementById(PROFILE_ACTION_ID) ?? document.getElementById(WALLET_PROFILE_ACTION_ID);
        if (element) profileActionRef(element);
    }, [profileActionRef]);

    const showStickyTitle = buttonContainerEntry && !buttonContainerEntry.isIntersecting;
    const showProfileAction = profileActionEntry && !profileActionEntry.isIntersecting;
    const currentProfile = useCurrentProfile(narrowToSocialSource(identity.source));
    const isCurrentProfile = currentProfile && socialProfile ? isSameProfile(currentProfile, socialProfile) : false;
    const noFireflyAccount = (!displayName && !data?.avatar) || !uid;

    const isLogin = useIsLogin(narrowToSocialSource(identity.source));
    const title = useMemo(() => {
        if (walletProfile) return walletProfile.primary_ens ?? formatAddressEthereum(walletProfile.address, 4);
        if (isRequestedLoginSource(identity.source) && !isLogin) return <Trans>Sign in to unlock</Trans>;
        return socialProfile?.displayName;
    }, [walletProfile, identity.source, isLogin, socialProfile?.displayName]);

    const isShowFireflyAccount = (!noFireflyAccount || isCurrentProfile) && uid;

    return (
        <>
            <AnimatePresence initial={false}>
                {showStickyTitle || !isShowFireflyAccount ? (
                    <motion.div
                        className={classNames(
                            'sticky left-0 top-0 z-40 w-full',
                            !isShowFireflyAccount ? 'h-[60px]' : 'h-0',
                        )}
                        key="title"
                        exit={{ y: -60 }}
                        initial={{ y: -60 }}
                        animate={{ y: 0 }}
                        transition={{
                            type: 'tween',
                            duration: 0.2,
                        }}
                    >
                        <Title title={title}>
                            <AnimatePresence initial={false}>
                                {showProfileAction ? (
                                    <motion.div
                                        className="flex flex-shrink-0 gap-2"
                                        exit={{ y: -20, opacity: 0 }}
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            type: 'tween',
                                            duration: 0.2,
                                        }}
                                    >
                                        {identity?.source === Source.Wallet && walletProfile ? (
                                            <>
                                                {getAddressType(identity.id) === NetworkType.Ethereum ? (
                                                    <WalletActions profile={walletProfile} />
                                                ) : null}
                                            </>
                                        ) : socialProfile ? (
                                            <ProfileAction profile={socialProfile} />
                                        ) : null}
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </Title>
                    </motion.div>
                ) : null}
            </AnimatePresence>
            {isShowFireflyAccount ? (
                <div className="relative flex w-full flex-col items-center pt-2.5">
                    {banner ? (
                        <Image
                            src={banner}
                            alt="firefly-account-banner"
                            width={1196}
                            height={200}
                            className="absolute left-0 top-0 h-[100px] w-full object-cover"
                        />
                    ) : (
                        <div className="absolute left-0 top-0 flex h-[100px] w-full overflow-hidden">
                            <Image
                                src={avatar ?? getStampAvatarByProfileId(Source.Firefly, uid)}
                                alt="firefly-account-banner"
                                width={1196}
                                height={200}
                                className="absolute left-0 top-1/2 h-auto min-h-[100px] w-full -translate-y-1/2 transform-gpu object-cover blur-md"
                            />
                        </div>
                    )}

                    <div className="relative mt-5 flex w-full px-6" ref={buttonContainerRef}>
                        <ComeBackButton />
                        <div className="ml-auto flex space-x-2">
                            {isCurrentProfile ? (
                                <>
                                    <Link
                                        href={PageRoute.SettingConnected}
                                        className="inline-flex size-8 items-center justify-center rounded-lg bg-lightBg text-second active:opacity-50 md:hover:opacity-60"
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
                                            <TipsButton
                                                identity={identity}
                                                profiles={profiles}
                                                handle={socialProfile.handle}
                                            />
                                            <FireflyAccountMoreButton profile={socialProfile} />
                                        </>
                                    ) : null}
                                    {walletProfile ? (
                                        <>
                                            <TipsButton
                                                identity={identity}
                                                profiles={profiles}
                                                handle={walletProfile.primary_ens ?? walletProfile.address}
                                            />
                                            <FireflyAccountMoreButton walletProfile={walletProfile} />
                                        </>
                                    ) : null}
                                </>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex w-full flex-col items-center px-4">
                        <Avatar
                            size={80}
                            alt="firefly-account"
                            src={avatar ?? (uid ? getStampAvatarByProfileId(Source.Firefly, uid) : undefined)}
                        />
                        <div className="h-6 min-w-0 max-w-full truncate text-lg font-bold leading-6">
                            {displayName ?? <Trans>Firefly User</Trans>}
                        </div>
                        <div className="flex h-[22px] items-center text-medium leading-[22px] text-second">
                            <Trans>UID: {uid}</Trans>
                            <CopyTextButton text={uid} />
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
