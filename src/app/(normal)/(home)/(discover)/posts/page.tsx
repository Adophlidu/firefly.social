import { DiscoverPostList } from '@/components/Posts/DiscoverPostList.js';
import { Source } from '@/constants/enum.js';

export default function Posts() {
    return <DiscoverPostList source={Source.Posts} />;
}
