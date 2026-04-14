'use client';

import { classNames } from '@dimensiondev/utils';
import { isSameEthereumAddress } from '@dimensiondev/web3-utils';
import { Trans } from '@lingui/react/macro';
import { type ReactNode, useContext, useMemo } from 'react';

import { ActivitiesFilter } from '@/components/HomeTab/ActivitiesFilter.js';
import { Link } from '@/components/Link.js';
import { PredictionPlatformFilter } from '@/components/Prediction/PredictionPlatformFilter.js';
import { ProfileContext } from '@/components/Profile/ProfileContext.js';
import { ChainFilter } from '@/components/Swap/ChainFilter.js';
import { ToggleEnableButton } from '@/components/TrumpTruthSocial/ToggleEnableButton.js';
import {
    LOGIN_SORTED_PROFILE_TAB_TYPE,
    SORTED_PROFILE_TAB_TYPE,
    WALLET_PROFILE_TAB_TYPES,
} from '@/constants/computed.js';
import {
    ExploreSwitchType,
    NetworkType,
    type ProfilePageSource,
    SocialProfileCategory,
    Source,
    WalletProfileCategory,
} from '@/constants/enum.js';
import { TRUMP_TWITTER_PROFILE } from '@/constants/mentions.js';
import { NFT_ENABLED, VITALIK_ADDRESS } from '@/constants/static.js';
import { getAddressType } from '@/helpers/getAddressType.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { isSameFireflyIdentity } from '@/helpers/isSameFireflyIdentity.js';
import { useCurrentFireflyProfilesAll } from '@/hooks/useCurrentFireflyProfiles.js';
import { useExploreDataSwitchConfig } from '@/hooks/useExploreDataSwitchConfig.js';
import {
    captureProfileTabClick,
    captureProfileTabClickSimple,
    type ProfileTabType,
} from '@/providers/telemetry/captureProfileTabEvent.js';
import { TelemetryProvider } from '@/providers/telemetry/index.js';
import { EventId } from '@/providers/types/Telemetry.js';
import { ActivitiesFilterNamespace } from '@/store/useActivitiesFilterStore.js';
import { PredictionFilterNamespace } from '@/store/usePredictionSourceFilterStore.js';

const mapCategoryToTabType = (
    cat: SocialProfileCategory | WalletProfileCategory,
    src: ProfilePageSource,
): ProfileTabType | undefined => {
    if (cat === SocialProfileCategory.TruthSocial) return undefined;
    if (cat === WalletProfileCategory.Prediction) return 'Prediction';

    // Special case: Farcaster uses 'Cast' instead of 'Feed'
    if (src === Source.Farcaster && cat === SocialProfileCategory.Feed) return 'Cast';

    // Map SocialProfileCategory (lowercase enum values like 'feed') to ProfileTabType (PascalCase like 'Feed')
    switch (cat) {
        case SocialProfileCategory.Feed:
            return 'Feed';
        case SocialProfileCategory.Replies:
            return 'Replies';
        case SocialProfileCategory.Media:
            return 'Media';
        case SocialProfileCategory.Collected:
            return 'Collected';
        case SocialProfileCategory.Likes:
            return 'Likes';
        case SocialProfileCategory.Channels:
            return 'Channels';
        default:
            return cat as unknown as ProfileTabType;
    }
};

export function ProfileCategoryTabs({
    source,
    id,
    category,
}: {
    source: ProfilePageSource;
    id: string;
    category: WalletProfileCategory | SocialProfileCategory;
}) {
    const { status } = useExploreDataSwitchConfig(ExploreSwitchType.TruthSocial);
    const currentProfiles = useCurrentFireflyProfilesAll();
    const isCurrentProfile = currentProfiles.some((x) => isSameFireflyIdentity(x.identity, { id, source }));
    const { refreshedSocialProfile } = useContext(ProfileContext);

    const tabTitles: Record<WalletProfileCategory, ReactNode> = useMemo(
        () => ({
            [WalletProfileCategory.Activities]: <Trans>Activities</Trans>,
            [WalletProfileCategory.NFTs]: <Trans>NFTs</Trans>,
            [WalletProfileCategory.Transactions]: <Trans>Transactions</Trans>,
            [WalletProfileCategory.Prediction]: <Trans>Predictions</Trans>,
        }),
        [],
    );

    const addressType = getAddressType(id, false);
    const categories = useMemo(() => {
        if (source === Source.Wallet || source === Source.WalletMix) {
            const tabs =
                addressType === NetworkType.Solana
                    ? WALLET_PROFILE_TAB_TYPES.solana
                    : WALLET_PROFILE_TAB_TYPES.ethereum.filter((x) =>
                          NFT_ENABLED ? true : x !== WalletProfileCategory.NFTs,
                      );
            return tabs.map((type) => ({ type, title: tabTitles[type] }));
        }

        return [
            {
                type: SocialProfileCategory.Feed,
                title: source === Source.Farcaster ? <Trans>Casts</Trans> : <Trans>Feed</Trans>,
            },
            {
                type: SocialProfileCategory.Replies,
                title: <Trans>Replies</Trans>,
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
            if (type === SocialProfileCategory.TruthSocial && (!status || id !== TRUMP_TWITTER_PROFILE.handle)) {
                return false;
            }

            return (isCurrentProfile ? LOGIN_SORTED_PROFILE_TAB_TYPE : SORTED_PROFILE_TAB_TYPE)[source].includes(type);
        });
    }, [id, source, tabTitles, isCurrentProfile, status, addressType]);

    const hasLimo = source === Source.Wallet && isSameEthereumAddress(id, VITALIK_ADDRESS);

    const handleTabClick = (cat: typeof category) => {
        const tabType = mapCategoryToTabType(cat, source);
        if (!tabType) return;

        // Use the non-simple version if Profile object is available
        if (refreshedSocialProfile && tabType) {
            captureProfileTabClick(refreshedSocialProfile, tabType);
            return;
        }

        // Fall back to simple version for wallet profiles or when Profile is not available
        if (source === Source.Wallet || source === Source.WalletMix) {
            if (cat === WalletProfileCategory.Activities) {
                captureProfileTabClickSimple(source, id, id, 'Feed');
            } else if (cat === WalletProfileCategory.Transactions) {
                TelemetryProvider.captureEventInSafe(EventId.PROFILE_WALLET_TRANSACTIONS_TAB_CLICK, {});
            } else if (cat === WalletProfileCategory.Prediction) {
                TelemetryProvider.captureEventInSafe(EventId.PROFILE_WALLET_PREDICTIONS_TAB_CLICK, {});
            }
        } else {
            captureProfileTabClickSimple(source, id, id, tabType);
        }
    };

    return (
        <div className="border-lightLineSecond bg-primaryBottom dark:border-line sticky top-0 z-20 mt-[-60px] flex h-[110px] items-center border-b px-3 pt-[60px]">
            <nav className="scrollable-tab flex min-w-0 flex-1 gap-1.5">
                {categories.map(({ type, title }) => {
                    const profileUrl = getProfileUrl({ source, profileId: id, handle: id }, type, isCurrentProfile);

                    return type === SocialProfileCategory.TruthSocial ? (
                        <ToggleEnableButton
                            replaceUrl={getProfileUrl(
                                { source, profileId: id, handle: id },
                                SocialProfileCategory.Feed,
                                isCurrentProfile,
                            )}
                            link={profileUrl}
                            inProfile
                            isActive={category === type}
                        />
                    ) : (
                        <div key={type} className="flex flex-col">
                            <Link
                                href={profileUrl}
                                replace
                                className={classNames(
                                    'hover:text-highlight flex h-[45px] items-center whitespace-nowrap px-3 font-extrabold transition-all',
                                    category === type ? 'text-highlight' : 'text-third',
                                )}
                                onClick={() => handleTabClick(type)}
                            >
                                {title}
                            </Link>
                            {category === type ? <span className="bg-highlight h-1 w-full transition-all" /> : null}
                        </div>
                    );
                })}
            </nav>
            {category === WalletProfileCategory.Activities ? (
                <ActivitiesFilter namespace={ActivitiesFilterNamespace.Profile} hasLimo={hasLimo} />
            ) : null}
            {category === WalletProfileCategory.Transactions && addressType === NetworkType.Ethereum ? (
                <ChainFilter networkType={addressType || undefined} />
            ) : null}
            {category === WalletProfileCategory.Prediction ? (
                <PredictionPlatformFilter namespace={PredictionFilterNamespace.Profile} />
            ) : null}
        </div>
    );
}
