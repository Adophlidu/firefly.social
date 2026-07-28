import type { SocialProfileCategory, WalletProfileCategory } from '@dimensiondev/enums';
import { type LoaderContext, notFound, useParams } from '@dimensiondev/ssr';
import type { ReactNode } from 'react';

import { isFollowCategory } from '@/helpers/isFollowCategory.js';
import { isProfilePageSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';
import { resolveSpecialProfileIdentity } from '@/helpers/resolveSpecialProfileIdentity.js';
import { ProfileCategoryTabs } from '@/legacy/[locale]/(normal)/profile/pages/ProfileCategoryTabs.js';

export function loader({ params }: LoaderContext): void {
    const source = resolveSourceFromUrlNoFallback(params.source!);
    if (!source || !isProfilePageSource(source) || isFollowCategory(params.category!)) notFound();
}

/**
 * Port of the Next category layout
 * (src/app/[locale]/(normal)/profile/(profile)/[source]/[id]/[category]/layout.tsx):
 * the Posts/Replies/Media… tab bar above the active category page.
 */
export default function ProfileCategoryLayout({ children }: { children?: ReactNode }) {
    const params = useParams();
    const category = params.category as SocialProfileCategory | WalletProfileCategory;
    // The URL carries the SourceInURL string; resolve to the Source enum
    // (already validated by the loader).
    const resolved = resolveSourceFromUrlNoFallback(params.source!)!;
    if (!isProfilePageSource(resolved)) return null;
    const identity = resolveSpecialProfileIdentity({ source: resolved, id: params.id! });

    return (
        <>
            <ProfileCategoryTabs category={category} source={identity.source} id={identity.id} />
            {children}
        </>
    );
}
