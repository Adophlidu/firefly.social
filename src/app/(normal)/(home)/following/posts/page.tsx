import { FollowingPostList } from '@/components/Posts/FollowingPostList.js';
import { Source } from '@/constants/enum.js';

export default function Posts() {
    return <FollowingPostList source={Source.Posts} />;
}
