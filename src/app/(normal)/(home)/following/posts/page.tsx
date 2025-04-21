import { NoSSR } from '@/components/NoSSR.js';
import { FollowingPostList } from '@/components/Posts/FollowingPostList.js';
import { Source } from '@/constants/enum.js';

export default function Posts() {
    return (
        <NoSSR>
            <FollowingPostList source={Source.Posts} />
        </NoSSR>
    );
}
