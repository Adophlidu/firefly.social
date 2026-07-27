import { useNavigate, useRouterState, useSearch } from '@dimensiondev/ssr';
import {
    unstable_createAdapterProvider as createAdapterProvider,
    type unstable_AdapterOptions as AdapterOptions,
    type unstable_UpdateUrlFunction as UpdateUrlFunction,
} from 'nuqs/adapters/custom';

/**
 * nuqs adapter for the SSR library's router (replaces
 * `nuqs/adapters/next/app`). URL updates go through the client router so
 * `useSearch` consumers stay in sync; scroll restoration follows nuqs'
 * options instead of the router's default scroll-to-top.
 */
function useFireflyAdapter() {
    const searchParams = useSearch();
    const pathname = useRouterState().pathname;
    const navigate = useNavigate();

    return {
        searchParams,
        updateUrl: ((search: URLSearchParams, options: Required<AdapterOptions>) => {
            const query = search.toString();
            navigate(pathname + (query ? `?${query}` : ''), {
                replace: options.history === 'replace',
                scroll: options.scroll,
            });
        }) as UpdateUrlFunction,
    };
}

export const NuqsAdapter = createAdapterProvider(useFireflyAdapter);
