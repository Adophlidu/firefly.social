import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { Image } from '@/components/Image.js';
import { Source } from '@/constants/enum.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import type { FireflyAccountProfile } from '@/providers/types/Firefly.js';

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
    children,
}: PropsWithChildren<{ profile: FireflyAccountProfile; banner?: string }>) {
    const { uid, avatar, displayName } = profile;
    const avatarWithFallback = avatar || getStampAvatarByProfileId(Source.Firefly, uid);
    return (
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
                <FireflyAccountAvatarBanner src={avatarWithFallback} />
            )}
            {children}
            <div className="flex w-full flex-col items-center px-4">
                <Avatar size={80} alt="firefly-account" src={avatarWithFallback} />
                <div className="h-6 min-w-0 max-w-full truncate text-lg font-bold leading-6">
                    {displayName ?? <Trans>Firefly User</Trans>}
                </div>
            </div>
        </div>
    );
}
