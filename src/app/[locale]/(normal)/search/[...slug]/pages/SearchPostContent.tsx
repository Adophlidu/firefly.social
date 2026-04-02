'use client';

import { SearchPostList } from '@/components/Search/SearchPostList.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

export function SearchPostContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();
    return <SearchPostList keyword={searchKeyword} source={source} searchType={searchType} />;
}
