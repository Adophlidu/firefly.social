'use client';

import { SORTED_PROFILE_TAB_TYPE_REQUIRE_LOGIN } from '@dimensiondev/constants/computed';
import type { ProfileCategory, WalletProfileCategory } from '@dimensiondev/enums';
import { SocialProfileCategory, Source } from '@dimensiondev/enums';
import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { PinnedPost } from '@/components/Posts/PinnedPost.js';
import { SocialProfileContentList } from '@/components/Profile/SocialProfileContentList.js';
import { WalletProfileContentList } from '@/components/Profile/WalletProfileContentList.js';
import { isSocialSource } from '@/helpers/isSource.js';
import type { FireflyIdentity } from '@/providers/types/Firefly.js';

export function ProfilePageTimeline({
    identity = null,
    category,
}: {
    identity?: FireflyIdentity | null;
    category: ProfileCategory;
}) {
    if (identity?.source === Source.Wallet || identity?.source === Source.WalletMix) {
        return <WalletProfileContentList type={category as WalletProfileCategory} address={identity.id} />;
    }
    if (identity && isSocialSource(identity.source)) {
        const showPinnedPost = category === SocialProfileCategory.Feed || category === SocialProfileCategory.Replies;
        return (
            <>
                {showPinnedPost ? <PinnedPost profileId={identity.id} source={identity.source} /> : null}
                <Suspense fallback={<Loading className="!min-h-[unset] flex-1 py-2" />}>
                    <LoginRequiredGuard
                        source={identity.source}
                        required={SORTED_PROFILE_TAB_TYPE_REQUIRE_LOGIN[identity.source].includes(
                            category as SocialProfileCategory,
                        )}
                    >
                        <SocialProfileContentList
                            type={category as SocialProfileCategory}
                            source={identity.source}
                            profileId={identity.id}
                        />
                    </LoginRequiredGuard>
                </Suspense>
            </>
        );
    }
    return null;
}
