import type { SocialSource } from '@dimensiondev/enums';
import { EngagementType } from '@dimensiondev/enums';
import { useParams } from '@dimensiondev/ssr';
import { safeUnreachable } from '@dimensiondev/utils';
import { memo, Suspense } from 'react';

import { LikeList } from '@/components/Engagement/LikeList.js';
import { QuoteList } from '@/components/Engagement/QuoteList.js';
import { RepostList } from '@/components/Engagement/RepostList.js';
import { Loading } from '@/components/Loading.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { useMounted } from '@/hooks/useMounted.js';

interface ContentListProps {
    postId: string;
    type: EngagementType;
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

export default function PostEngagementPage() {
    const params = useParams();
    const engagementType = params.type as EngagementType;
    const id = params.id!;
    const source = resolveSocialSource(params.source as never);
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
