import type { SocialSource } from '@dimensiondev/enums';
import { SearchType, Source } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import type { ReadonlyURLSearchParams } from 'next/navigation.js';
import { type HTMLProps, memo, Suspense, useMemo, useState, useTransition } from 'react';

import TokenPageLoading from '@/app/[locale]/(normal)/token/[exchange]/[[...slug]]/loading.js';
import { DisableScrollRestoreContext } from '@/components/DisableScrollRestore/index.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchPostList } from '@/components/Search/SearchPostList.js';
import { SORTED_TOKEN_FEEDS_SOURCES } from '@/constants/computed.js';
import { Link } from '@/esm/Link.js';
import { usePathname, useRouter, useSearchParams } from '@/esm/navigation.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';

interface Props extends HTMLProps<HTMLDivElement> {
    chainId: number | undefined;
    address?: string;
    symbol: string;
    name?: string;
}

function resolveTab(pathname: string, params: ReadonlyURLSearchParams, source: string) {
    const newParams = new URLSearchParams(params);
    newParams.set('source', source);
    return `${pathname}?${newParams.toString()}`;
}

export const Feeds = memo<Props>(function Feeds({ address, symbol, name, ...props }) {
    const params = useSearchParams();
    const paramSource = params.get('source') as SocialSource | null;
    const pathname = usePathname();

    const [isPending, startTransition] = useTransition();
    const [pendingSource, setPendingSource] = useState<Source>();
    const sources = SORTED_TOKEN_FEEDS_SOURCES;
    const defaultSource = paramSource && sources.includes(paramSource) ? paramSource : null;
    const source = (isPending && pendingSource) || defaultSource || sources[0];

    const keywords = useMemo(() => {
        const text = symbol === '[invalid]' ? name : symbol;
        if (!text) return address || [];
        const includesSpace = text.trim().includes(' ');
        if (includesSpace && [Source.Lens, Source.Bsky].includes(source)) return address || [];
        // Only search by name for twitter/Lens
        return compact([
            includesSpace ? `"${text}"` : `$${symbol}`,
            [Source.Twitter, Source.Lens].includes(source) ? null : address,
        ]);
    }, [address, symbol, name, source]);

    const router = useRouter();

    return (
        <div {...props} className={classNames('flex grow flex-col gap-2', props.className)}>
            <div className="flex shrink-0 gap-2">
                {sources.map((x) => (
                    <Link
                        key={x}
                        className={classNames(
                            'flex h-6 min-w-10 cursor-pointer list-none items-center justify-center rounded-md px-1.5 text-xs leading-6',
                            source === x ? 'bg-highlight text-white' : 'bg-thirdMain text-second hover:text-highlight',
                        )}
                        href={resolveTab(pathname, params, x)}
                        onClick={(e) => {
                            e.preventDefault();
                            setPendingSource(x);
                            startTransition(() => {
                                router.replace(resolveTab(pathname, params, x), { showProgress: false });
                            });
                        }}
                        aria-current={source === x ? 'page' : undefined}
                    >
                        {resolveSourceName(x)}
                    </Link>
                ))}
            </div>
            <Suspense
                fallback={
                    <div className="flex grow flex-col">
                        <TokenPageLoading />
                    </div>
                }
            >
                <DisableScrollRestoreContext value>
                    <SearchPostList
                        keyword={keywords}
                        searchType={SearchType.Posts}
                        source={source}
                        loading={<TokenPageLoading />}
                        pageSize={10}
                        emptyMessage={<Empty keyword={keywords[0]} message="" />}
                    />
                </DisableScrollRestoreContext>
            </Suspense>
        </div>
    );
});
