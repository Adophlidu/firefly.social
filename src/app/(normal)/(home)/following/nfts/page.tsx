import { FollowingNFTList } from '@/components/NFTs/FollowingNFTList.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function NFTs() {
    return (
        <NoSSR>
            <FollowingNFTList />
        </NoSSR>
    );
}
