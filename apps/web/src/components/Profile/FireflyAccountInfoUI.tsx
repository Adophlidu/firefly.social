import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import type { HTMLProps } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { Image } from '@/components/Image.js';
import { HighlightedText } from '@/components/Profile/HighlightedText.js';
import { Source } from '@/constants/enum.js';
import { Link } from '@/esm/Link.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import type { FireflyAccountProfile } from '@/providers/types/Firefly.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

function FireflyAccountAvatarBanner({ src }: { src: string }) {
    return (
        <div className="absolute left-0 top-0 flex h-[100px] w-full overflow-hidden">
            <Image
                src={src}
                alt="firefly-account-banner"
                width={1196}
                height={200}
                className="absolute left-0 top-1/2 h-auto min-h-[100px] w-full -translate-y-1/2 transform-gpu object-cover blur-md"
            />
        </div>
    );
}

export function FireflyAccountInfoUI({
    profile,
    banner,
    highlighted,
    children,
    className,
}: HTMLProps<'div'> & { profile: FireflyAccountProfile; banner?: string; highlighted?: boolean }) {
    const { currentProfileSession } = useFireflyProfileStore();

    const { uid, avatar, displayName } = profile;
    const avatarWithFallback = avatar || getStampAvatarByProfileId(Source.Firefly, uid);
    const isCurrentProfile = !!currentProfileSession && currentProfileSession?.profileId === profile.uid;

    const accountName = highlighted ? (
        <HighlightedText text={displayName || t`Firefly User`} />
    ) : (
        displayName || t`Firefly User`
    );

    return (
        <div className={classNames('bg-primaryBottom relative flex w-full flex-col items-center pt-2.5', className)}>
            {banner ? (
                <Image
                    src={banner}
                    alt="firefly-account-banner"
                    width={1196}
                    height={200}
                    className="absolute left-0 top-0 h-[100px] w-full object-cover"
                />
            ) : (
                <FireflyAccountAvatarBanner src={avatarWithFallback} />
            )}
            {children}
            <div className="z-1 flex w-full flex-col items-center px-4">
                <Avatar size={80} alt="firefly-account" src={avatarWithFallback} />
                <div className="h-6 min-w-0 max-w-full truncate text-lg font-bold leading-6">
                    {isCurrentProfile && highlighted ? (
                        <Link href={`/sparks/${profile.uid}`}>{accountName}</Link>
                    ) : (
                        accountName
                    )}
                </div>
            </div>
        </div>
    );
}
