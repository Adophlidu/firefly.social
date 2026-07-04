import { Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import type { HTMLProps } from 'react';

import { FifaCampAvatar } from '@/components/FifaCamp/FifaCampAvatar.js';
import { Image } from '@/components/Image.js';
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
    fifaCampCountryCode,
    fifaCampFlagUrl,
    children,
    className,
}: HTMLProps<'div'> & {
    profile: FireflyAccountProfile;
    banner?: string;
    fifaCampCountryCode?: string;
    fifaCampFlagUrl?: string | null;
}) {
    const { uid, avatar, displayName } = profile;
    const avatarWithFallback = avatar || getStampAvatarByProfileId(Source.Firefly, uid);

    const accountName = displayName || t`Firefly User`;

    return (
        <div className={classNames('relative flex w-full flex-col items-center bg-primaryBottom pt-2.5', className)}>
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
                <FifaCampAvatar
                    size={80}
                    alt="firefly-account"
                    src={avatarWithFallback}
                    countryCode={fifaCampCountryCode}
                    flagUrl={fifaCampFlagUrl}
                />
                <div className="h-6 min-w-0 max-w-full truncate text-lg font-bold leading-6">{accountName}</div>
            </div>
        </div>
    );
}
