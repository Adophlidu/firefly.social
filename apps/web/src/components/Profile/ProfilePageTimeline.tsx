'use client';

import { LoginRequiredGuard } from '@/components/LoginRequiredGuard.js';
import { PinnedPost } from '@/components/Posts/PinnedPost.js';
import { SocialProfileContentList } from '@/components/Profile/SocialProfileContentList.js';
import { WalletProfileContentList } from '@/components/Profile/WalletProfileContentList.js';
import { SORTED_PROFILE_TAB_TYPE_REQUIRE_LOGIN } from '@/constants/computed.js';
import {
    type ProfileCategory,
    type SocialProfileCategory,
    Source,
    type WalletProfileCategory,
} from '@/constants/enum.js';
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
        return (
            <>
                <PinnedPost profileId={identity.id} source={identity.source} />
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
            </>
        );
    }
    return null;
}
