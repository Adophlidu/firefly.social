import { classNames } from '@firefly/utils';
import { first } from 'lodash-es';
import { type HTMLProps, memo } from 'react';
import { useEnsAvatar } from 'wagmi';

import WalletIcon from '@/assets/wallet-circle.svg';
import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { FireflyPlatform, type ProfilePageSource, Source } from '@/constants/enum.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { getStampAvatarByProfileId } from '@/helpers/getStampAvatarByProfileId.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';
import { narrowToSocialSource } from '@/helpers/narrowToSocialSource.js';
import { resolveSocialSourceFromFireflyPlatform, resolveSourceFromFireflyPlatform } from '@/helpers/resolveSource.js';
import type { Profile } from '@/providers/types/Firefly.js';

interface CrossProfileItemProps extends HTMLProps<HTMLAnchorElement> {
    profile: Profile;
    related: Profile[];
    autoQueryEnsAvatar?: boolean;
}

function fireflyPlatformToSource<T extends Source[]>(platform: FireflyPlatform, keepSources: T) {
    const platformSource = resolveSourceFromFireflyPlatform(platform);
    if (keepSources.includes(platformSource)) {
        return platformSource as T[number];
    }

    return narrowToSocialSource(platformSource);
}

function getProfileUrlWithAccount(profile: Profile, related: Profile[], source: ProfilePageSource | Source.Firefly) {
    if (source === Source.Firefly) {
        if (profile.uid) {
            return getProfileUrl({ source, profileId: profile.uid });
        }

        const firstRelated = first(related);
        if (!firstRelated) return '';

        return getProfileUrl({
            source: fireflyPlatformToSource(firstRelated.platform, [Source.Wallet]),
            profileId: firstRelated.platform_id,
            handle: firstRelated.handle,
        });
    }

    return getProfileUrl({ source, profileId: profile.platform_id, handle: profile.handle });
}

export const SearchableProfileItem = memo<CrossProfileItemProps>(function SearchableProfileItem({
    profile,
    related,
    className,
    autoQueryEnsAvatar = false,
    onClick,
}) {
    const source = fireflyPlatformToSource(profile.platform, [Source.Wallet, Source.Firefly]);
    const displayName =
        source === Source.Wallet && isValidAddressEthereum(profile.name)
            ? formatAddressEthereum(profile.name, 4, 2)
            : profile.name;

    const { data } = useEnsAvatar({
        name: profile.handle,
        chainId: 1,
        query: {
            enabled: autoQueryEnsAvatar && source === Source.Wallet && !!profile.handle,
        },
    });
    const avatar =
        source === Source.Firefly
            ? getStampAvatarByProfileId(
                  profile.uid ? source : fireflyPlatformToSource(related[0].platform, [Source.Wallet]),
                  profile.uid || related[0].platform_id,
              )
            : profile.avatar || data || getStampAvatarByProfileId(source, profile.platform_id);

    // keep the matched profile at the first place
    const sortedRelated = related.sort((a, b) => (a.platform === profile.platform ? -1 : 1));

    return (
        <Link
            className={classNames('flex items-center gap-x-2 border-b border-line p-3 hover:bg-bg', className)}
            href={getProfileUrlWithAccount(profile, related, source)}
            onClick={onClick}
        >
            <Avatar alt={profile.handle} className="size-7 rounded-full" src={avatar} size={44} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-x-1">
                    <span className="truncate text-lg font-bold leading-6 text-lightMain">{displayName || '-'}</span>
                    {sortedRelated.map((x) =>
                        x.platform === FireflyPlatform.Wallet ? (
                            <WalletIcon
                                className="inline-block shrink-0 text-second"
                                key={x.platform}
                                width={15}
                                height={15}
                            />
                        ) : (
                            <SocialSourceIcon
                                key={x.platform}
                                mono
                                className="inline-block shrink-0 text-second"
                                source={resolveSocialSourceFromFireflyPlatform(x.platform)}
                                size={15}
                            />
                        ),
                    )}
                </div>
                <div className="truncate text-medium leading-[22px] text-second">
                    {source === Source.Wallet || source === Source.Firefly ? '' : '@'}
                    {source === Source.Firefly && profile.uid
                        ? profile.uid
                        : source === Source.Wallet && profile.platform_id
                          ? profile.platform_id
                          : profile.handle}
                </div>
            </div>
        </Link>
    );
});
