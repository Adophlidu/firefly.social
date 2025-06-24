import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { FollowingNFTList } from '@/components/NFTs/FollowingNFTList.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function NFTs() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingNFTList />
            </Suspense>
        </NoSSR>
    );
}
