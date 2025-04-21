import { NoSSR } from '@/components/NoSSR.js';
import { DiscoverPostList } from '@/components/Posts/DiscoverPostList.js';
import { Source } from '@/constants/enum.js';

export default function Posts() {
    return (
        <NoSSR>
            <DiscoverPostList source={Source.Posts} />
        </NoSSR>
    );
}
