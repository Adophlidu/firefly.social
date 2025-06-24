import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FollowingPostList } from '@/components/Posts/FollowingPostList.js';
import { Source } from '@/constants/enum.js';

export default function Posts() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingPostList source={Source.Posts} />
            </Suspense>
        </NoSSR>
    );
}
