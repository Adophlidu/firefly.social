'use client';

import { Trans } from '@lingui/react/macro';
import { type ReactNode, useMemo } from 'react';

import { Link } from '@/components/Link.js';
import {
    NetworkType,
    type ProfilePageSource,
    SocialProfileCategory,
    Source,
    STATUS,
    WalletProfileCategory,
} from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { LOGIN_SORTED_PROFILE_TAB_TYPE, SORTED_PROFILE_TAB_TYPE, WALLET_PROFILE_TAB_TYPES } from '@/constants/index.js';
import { TRUMP_TWITTER_PROFILE } from '@/constants/mentions.js';
import { classNames } from '@/helpers/classNames.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';

export function ProfileCategoryTabs({
    source,
    id,
    category,
}: {
    source: ProfilePageSource;
    id: string;
    category: WalletProfileCategory | SocialProfileCategory;
}) {
    const currentProfiles = useCurrentFireflyProfilesAll();
    const isCurrentProfile = currentProfiles.some((x) => isSameFireflyIdentity(x.identity, { id, source }));

    const tabTitles: Record<WalletProfileCategory, ReactNode> = useMemo(
        () => ({
            [WalletProfileCategory.Activities]: <Trans>Activities</Trans>,
            [WalletProfileCategory.Swap]: <Trans>Swaps</Trans>,
            [WalletProfileCategory.POAPs]: <Trans>POAPs</Trans>,
            [WalletProfileCategory.NFTs]: <Trans>NFTs</Trans>,
            [WalletProfileCategory.Articles]: <Trans>Articles</Trans>,
            [WalletProfileCategory.DAOs]: <Trans>DAOs</Trans>,
            [WalletProfileCategory.Polymarket]: <Trans>Bets</Trans>,
        }),
        [],
    );

    const categories = useMemo(() => {
        if (source === Source.Wallet || source === Source.WalletMix) {
            const addressType = getAddressType(id);
            const tabs =
                addressType === NetworkType.Solana
                    ? WALLET_PROFILE_TAB_TYPES.solana
                    : WALLET_PROFILE_TAB_TYPES.ethereum;
            return tabs.map((type) => ({ type, title: tabTitles[type] }));
        }

        return [
            {
                type: SocialProfileCategory.Feed,
                title: source === Source.Farcaster ? <Trans>Casts</Trans> : <Trans>Feed</Trans>,
            },
            {
                type: SocialProfileCategory.Replies,
                title: source === Source.Farcaster ? <Trans>Casts + Replies</Trans> : <Trans>Replies</Trans>,
            },
            {
                type: SocialProfileCategory.Likes,
                title: <Trans>Likes</Trans>,
            },
            {
                type: SocialProfileCategory.Media,
                title: <Trans>Media</Trans>,
            },
            {
                type: SocialProfileCategory.Collected,
                title: <Trans>Collected</Trans>,
            },
            {
                type: SocialProfileCategory.Channels,
                title: <Trans>Channels</Trans>,
            },
            {
                type: SocialProfileCategory.TruthSocial,
                title: <Trans>Truth Social</Trans>,
            },
        ].filter(({ type }) => {
            if (
                type === SocialProfileCategory.TruthSocial &&
                (env.external.NEXT_PUBLIC_TRUTH_SOCIAL !== STATUS.Enabled || id !== TRUMP_TWITTER_PROFILE.handle)
            ) {
                return false;
            }

            return (isCurrentProfile ? LOGIN_SORTED_PROFILE_TAB_TYPE : SORTED_PROFILE_TAB_TYPE)[source].includes(type);
        });
    }, [id, source, tabTitles, isCurrentProfile]);

    return (
        <nav className="scrollable-tab sticky top-0 z-20 -mt-[60px] flex h-[110px] gap-1.5 border-b border-lightLineSecond bg-primaryBottom px-3 pt-[60px] dark:border-line">
            {categories.map(({ type, title }) => {
                return (
                    <div key={type} className="flex flex-col">
                        <Link
                            href={getProfileUrl({ source, profileId: id, handle: id }, type, isCurrentProfile)}
                            replace
                            className={classNames(
                                'flex h-[45px] items-center whitespace-nowrap px-3 font-extrabold transition-all hover:text-highlight',
                                category === type ? 'text-highlight' : 'text-third',
                            )}
                        >
                            {title}
                        </Link>
                        {category === type ? <span className="h-1 w-full bg-highlight transition-all" /> : null}
                    </div>
                );
            })}
        </nav>
    );
}
