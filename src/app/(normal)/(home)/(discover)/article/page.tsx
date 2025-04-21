import { DiscoverArticleList } from '@/components/Article/DiscoverArticleList.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function Articles() {
    return (
        <NoSSR>
            <DiscoverArticleList />
        </NoSSR>
    );
}
