'use client';

import { Trans } from '@lingui/react/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

import SettingIcon from '@/assets/setting.svg';
import { Avatar } from '@/components/Avatar.js';
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
import { formatEthereumAddress } from '@/helpers/formatAddress.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver.js';
import type { FireflyIdentity, FireflyProfile, WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

interface Props {
    displayName?: string | null;
    avatar?: string | null;
    uid: string;
    banner?: string;
    walletProfile?: WalletProfile;
    socialProfile?: Profile;
    identity: FireflyIdentity;
    profiles?: FireflyProfile[];
}

export function FireflyAccountInfo({
    avatar,
    banner,
    displayName,
    uid,
    walletProfile,
    socialProfile,
    identity,
    profiles,
}: Props) {
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
    }, []);
    const showStickyTitle = buttonContainerEntry && !buttonContainerEntry.isIntersecting;
    const showProfileAction = profileActionEntry && !profileActionEntry.isIntersecting;
    const title = walletProfile
        ? (walletProfile.primary_ens ?? formatEthereumAddress(walletProfile.address, 4))
        : socialProfile?.displayName;
    const currentProfile = useCurrentProfile(narrowToSocialSource(identity.source));
    const isCurrentProfile = currentProfile && socialProfile ? isSameProfile(currentProfile, socialProfile) : false;

    return (
        <>
            <AnimatePresence initial={false}>
                {showStickyTitle ? (
                    <motion.div
                        className="sticky left-0 top-0 z-40 h-0 w-full"
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
            <div className="relative flex w-full flex-col items-center pt-2.5">
                <Image
                    src={banner ?? '/image/default-firefly-account-banner.png'}
                    alt="firefly-account-banner"
                    width={1196}
                    height={200}
                    className="absolute left-0 top-0 h-[100px] w-full object-cover"
                />
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
                        src={avatar ?? getStampAvatarByProfileId(Source.Firefly, uid)}
                    />
                    <div className="h-6 min-w-0 max-w-full truncate text-lg font-bold leading-6">
                        {displayName ?? <Trans>Firefly User</Trans>}
                    </div>
                    <div className="h-[22px] text-medium leading-[22px] text-second">
                        <Trans>UID: {uid}</Trans>
                    </div>
                </div>
            </div>
        </>
    );
}
