import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useQueries } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import type { ReadonlyURLSearchParams } from 'next/navigation.js';
import { type HTMLProps, memo, Suspense, useMemo, useState, useTransition } from 'react';

import TokenPageLoading from '@/app/(normal)/token/[exchange]/[[...slug]]/loading.js';
import SortAscIcon from '@/assets/sort-asc.svg';
import X3ProIcon from '@/assets/x3pro.svg';
import { DisableScrollRestoreContext } from '@/components/DisableScrollRestore/index.js';
import { Empty } from '@/components/Search/Empty.js';
import { SearchPostList } from '@/components/Search/SearchPostList.js';
import { KolBar } from '@/components/TokenProfile/KolBar.js';
import { MentionedByModal } from '@/components/TokenProfile/MentionedByModal.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SORTED_TOKEN_FEEDS_SOURCES, X3_PRO_CHAIN_IDS } from '@/constants/computed.js';
import { SearchType, type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/static.js';
import { Link } from '@/esm/Link.js';
import { usePathname, useRouter, useSearchParams } from '@/esm/navigation.js';
import { formatTokenMentionUser } from '@/helpers/formatTokenMentionUser.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useX3ProTokenInfo } from '@/hooks/token/useX3ProTokenInfo.js';
import { useX3ProTokenMention } from '@/hooks/token/useX3ProTokenMention.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { twitterSocialMediaProxy } from '@/providers/twitter/SocialMedia.js';
import type { UserV2 } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { PostOrderType, type TokenMentionUser } from '@/providers/x3pro/types.js';

interface Props extends HTMLProps<HTMLDivElement> {
    chainId: number | undefined;
    address?: string;
    symbol: string;
    name?: string;
}

function useMergeX3KolProfiles(mentionUsers: TokenMentionUser[], enabled: boolean) {
    const twitterIds = mentionUsers.map((x) => x.twitterId);
    const myTwitterProfile = useCurrentProfile(Source.Twitter);

    const twitterProfiles = useQueries({
        queries: twitterIds.map((twitterId) => ({
            enabled,
            queryKey: ['profile', Source.Twitter, twitterId, myTwitterProfile?.profileId],
            queryFn: () => twitterSocialMediaProxy.getProfileById(twitterId),
        })),
        combine: (result) => {
            return result.map((x) => x.data);
        },
    });

    return twitterProfiles;
}

function resolveTab(pathname: string, params: ReadonlyURLSearchParams, source: string, postOrderType?: PostOrderType) {
    const newParams = new URLSearchParams(params);
    newParams.set('source', source);
    if (postOrderType) newParams.set('order', postOrderType.toString());
    return `${pathname}?${newParams.toString()}`;
}

export const Feeds = memo<Props>(function Feeds({ chainId, address, symbol, name, ...props }) {
    const params = useSearchParams();
    const paramSource = params.get('source') as SocialSource | null;
    const pathname = usePathname();

    const [openModal, setOpenModal] = useState(false);
    const supportedX3 = chainId ? X3_PRO_CHAIN_IDS.includes(chainId) : false;
    const { data: x3Token } = useX3ProTokenInfo(address, supportedX3);
    const { data: x3TokenMention } = useX3ProTokenMention(address, supportedX3);

    const [isPending, startTransition] = useTransition();
    const [pendingSource, setPendingSource] = useState<Source>();
    const sources = supportedX3
        ? SORTED_TOKEN_FEEDS_SOURCES
        : SORTED_TOKEN_FEEDS_SOURCES.filter((x) => x !== Source.X3Pro);
    const defaultSource = paramSource && sources.includes(paramSource) ? paramSource : null;
    const source = (isPending && pendingSource) || defaultSource || sources[0];
    const isX3Pro = source === Source.X3Pro;

    const keywords = useMemo(() => {
        const text = symbol === '[invalid]' ? name : symbol;
        if (isX3Pro || !text) return address || [];
        const includesSpace = text.trim().includes(' ');
        if (includesSpace && [Source.Lens, Source.Bsky].includes(source)) return address || [];
        // Only search by name for twitter
        return compact([includesSpace ? `"${text}"` : `$${symbol}`, source === Source.Twitter ? null : address]);
    }, [isX3Pro, address, symbol, name, source]);
    const mentionUsers = x3TokenMention?.mentionUsers || EMPTY_LIST;

    const twitterProfile = useCurrentProfile(Source.Twitter);
    const isTwitterLogin = !!twitterProfile;

    const twitterProfiles = useMergeX3KolProfiles(mentionUsers, isTwitterLogin && isX3Pro);

    const users = useMemo(() => {
        if (isX3Pro && mentionUsers.length) {
            const mentionedProfiles = mentionUsers.map(formatTokenMentionUser);
            return mentionedProfiles.filter((user) => {
                const profile = twitterProfiles.find((x) => x?.profileId === user.profileId) as
                    | Profile<UserV2>
                    | undefined;
                const connection_status = profile?.__original__?.connection_status;
                return !(connection_status?.includes('blocking') || connection_status?.includes('muting'));
            });
        }
        return EMPTY_LIST;
    }, [isX3Pro, mentionUsers, twitterProfiles]);

    const postOrderType: PostOrderType | undefined = params.get('order') ? Number(params.get('order')) : undefined;
    const isDesc = postOrderType === PostOrderType.DESC || !postOrderType;

    const router = useRouter();

    return (
        <div {...props} className={classNames('flex grow flex-col gap-2', props.className)}>
            <div className="flex shrink-0 gap-2">
                {sources.map((x) => {
                    const isX3ProTab = x === Source.X3Pro;
                    const button = (
                        <Link
                            key={x}
                            className={classNames(
                                'flex h-6 min-w-10 cursor-pointer list-none items-center justify-center rounded-md px-1.5 text-xs leading-6',
                                source === x
                                    ? 'bg-highlight text-white'
                                    : 'bg-thirdMain text-second hover:text-highlight',
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
                            {x === Source.X3Pro ? (
                                <>
                                    KOL <X3ProIcon width={16} height={16} />
                                </>
                            ) : (
                                resolveSourceName(x)
                            )}
                        </Link>
                    );
                    if (isX3ProTab)
                        return (
                            <Tooltip
                                key={x}
                                placement="top"
                                interactive
                                content={
                                    <div className="text-sm">
                                        <Trans>
                                            Now only supporting Solana and BSC tokens. Powered by{' '}
                                            <Link className="text-link hover:underline" href="https://x3.pro">
                                                X3.pro
                                            </Link>
                                        </Trans>
                                    </div>
                                }
                            >
                                {button}
                            </Tooltip>
                        );
                    return button;
                })}
                {isX3Pro ? (
                    <Link
                        className="ml-auto inline-flex size-6 items-center justify-center"
                        href={resolveTab(
                            pathname,
                            params,
                            Source.X3Pro,
                            isDesc ? PostOrderType.ASC : PostOrderType.DESC,
                        )}
                    >
                        <SortAscIcon width={16} height={16} className={isDesc ? 'rotate-180' : ''} />
                    </Link>
                ) : null}
            </div>
            {isX3Pro && x3Token ? (
                <KolBar
                    users={users}
                    total={x3Token.mentionUserCount}
                    onClick={() => {
                        setOpenModal(true);
                    }}
                />
            ) : null}
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
                        orderType={postOrderType}
                        loading={<TokenPageLoading />}
                        emptyMessage={
                            isX3Pro ? (
                                supportedX3 ? (
                                    <Trans>No posts found for this token.</Trans>
                                ) : (
                                    <Trans>Feeds for tokens on this chain will be available soon.</Trans>
                                )
                            ) : (
                                <Empty keyword={keywords[0]} message="" />
                            )
                        }
                    />
                </DisableScrollRestoreContext>
            </Suspense>
            {openModal && users.length ? (
                <MentionedByModal open onClose={() => setOpenModal(false)} users={users} />
            ) : null}
        </div>
    );
});
