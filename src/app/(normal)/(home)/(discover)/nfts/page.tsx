import { DiscoverNFTList } from '@/components/NFTs/DiscoverNFTList.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function NFTs() {
    return (
        <NoSSR>
            <DiscoverNFTList />
        </NoSSR>
    );
}
