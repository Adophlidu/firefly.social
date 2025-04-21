import { FollowingArticleList } from '@/components/Article/FollowingArticleList.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function Articles() {
    return (
        <NoSSR>
            <FollowingArticleList />
        </NoSSR>
    );
}
