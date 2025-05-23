import { skipToken, useQueries, useQuery } from '@tanstack/react-query';

import { getClassifyPostLinkWithDeserialization } from '@/services/getClassifyPostLinkWithDeserialization.js';

export function useClassifyPostLink(url: string | null | undefined) {
    return useQuery({
        queryKey: ['classify-post-link', url],
        queryFn: url ? () => getClassifyPostLinkWithDeserialization(url) : skipToken,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

export function useClassifyPostLinks(urls: string[]) {
    return useQueries({
        queries: urls.map((url) => ({
            queryKey: ['classify-post-link', url],
            queryFn: () => (url ? getClassifyPostLinkWithDeserialization(url) : null),
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            retry: false,
        })),
        combine(result) {
            return result.map((query) => query.data);
        },
    });
}
