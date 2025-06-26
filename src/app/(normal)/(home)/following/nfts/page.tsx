import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { FollowingNFTList } from '@/components/NFTs/FollowingNFTList.js';
import { NoSSR } from '@/components/NoSSR.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/following/nfts');

export default function NFTs() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingNFTList />
            </Suspense>
        </NoSSR>
    );
}
