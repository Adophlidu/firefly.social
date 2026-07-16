'use client';

import type { SocialSource, SocialSourceInURL } from '@dimensiondev/enums';
import { EngagementType } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { safeUnreachable } from '@dimensiondev/utils';
import { memo, Suspense, use } from 'react';

import { LikeList } from '@/components/Engagement/LikeList.js';
import { QuoteList } from '@/components/Engagement/QuoteList.js';
import { RepostList } from '@/components/Engagement/RepostList.js';
import { Loading } from '@/components/Loading.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { useMounted } from '@/hooks/useMounted.js';

interface ContentListProps {
    postId: string;
    type: Awaited<Props['params']>['type'];
    source: SocialSource;
}

const ContentList = memo(function ContentList(props: ContentListProps) {
    switch (props.type) {
        case EngagementType.Likes:
            return <LikeList {...props} />;
        case EngagementType.Mirrors:
        case EngagementType.Recasts:
            return <RepostList {...props} />;
        case EngagementType.Quotes:
            return <QuoteList {...props} />;
        default:
            safeUnreachable(props.type);
            return null;
    }
});

interface Props extends LayoutProps<{ id: string; type: EngagementType; source: SocialSourceInURL }> {}

export default function Page(props: Props) {
    const params = use(props.params);
    const { type: engagementType, id } = params;

    const sourceInURL = params.source;
    const source = resolveSocialSource(sourceInURL);
    const mounted = useMounted();

    // Engagement lists need a client session (e.g. a Twitter session for /post/x/...),
    // which is absent during SSR. Render client-only to avoid a server-side Unauthorized 500.
    if (!mounted) return <Loading />;

    return (
        <Suspense fallback={<Loading />}>
            <ContentList type={engagementType} source={source} postId={id} />
        </Suspense>
    );
}
