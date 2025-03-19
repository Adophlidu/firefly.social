'use client';

import { type HTMLProps, type ReactNode } from 'react';

import ComeBackIcon from '@/assets/comeback.svg';
import { HackedButton } from '@/components/Profile/HackedButton.js';
import { ProfileAction } from '@/components/Profile/ProfileAction.js';
import { WalletMoreAction } from '@/components/Profile/WalletMoreAction.js';
import { WatchButton } from '@/components/Profile/WatchButton.js';
import { classNames } from '@/helpers/classNames.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { useComeBack } from '@/hooks/useComeback.js';
import { useCurrentFireflyProfiles } from '@/hooks/useCurrentFireflyProfiles.js';
import type { FireflyIdentity, WalletProfile } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function ProfileTitleAction({
    profile,
    walletProfile,
    identity,
}: {
    profile?: Profile | null;
    walletProfile?: WalletProfile | null;
    identity?: FireflyIdentity;
}) {
    const currentProfiles = useCurrentFireflyProfiles();
    if (profile) return <ProfileAction profile={profile} />;
    if (walletProfile?.hacked) return <HackedButton />;
    if (walletProfile) {
        const isOthersProfile = !currentProfiles.some((x) => isSameFireflyIdentity(x.identity, identity));
        return (
            <>
                {isOthersProfile ? <WatchButton address={walletProfile.address} /> : null}
                <WalletMoreAction className="text-main" profile={walletProfile} />
            </>
        );
    }
    return null;
}

export function Title({ title, className, children }: HTMLProps<'div'> & { title?: ReactNode }) {
    const comeback = useComeBack();
    return (
        <div className={classNames('z-30 flex h-[60px] w-full items-center bg-primaryBottom pl-4 pr-3', className)}>
            <div className="mr-auto flex items-center gap-7 overflow-auto">
                <ComeBackIcon className="shrink-0 cursor-pointer text-lightMain" onClick={comeback} />
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xl font-black text-lightMain">
                    {title ?? '-'}
                </span>
            </div>
            {children}
        </div>
    );
}
