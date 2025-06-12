import { Trans } from '@lingui/react/macro';
import { useQueries } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { type HTMLProps, memo, useMemo, useState } from 'react';

import SortAscIcon from '@/assets/sort-asc.svg';
import X3ProIcon from '@/assets/x3pro.svg';
import { Link } from '@/components/Link.js';
import { SearchPostList } from '@/components/Search/SearchPostList.js';
import { KolBar } from '@/components/TokenProfile/KolBar.js';
import { MentionedByModal } from '@/components/TokenProfile/MentionedByModal.js';
import { Tooltip } from '@/components/Tooltip.js';
import { SearchType, type SocialSource, Source } from '@/constants/enum.js';
import { EMPTY_LIST, SORTED_TOKEN_FEEDS_SOURCES, X3_PRO_CHAIN_IDS } from '@/constants/index.js';
import { usePathname, useSearchParams } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { formatTokenMentionUser } from '@/helpers/formatTokenMentionUser.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useX3ProTokenInfo } from '@/hooks/token/useX3ProTokenInfo.js';
import { useX3ProTokenMention } from '@/hooks/token/useX3ProTokenMention.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { TwitterSocialMediaProvider } from '@/providers/twitter/SocialMedia.js';
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

    const twitterProfiles = useQueries({
        queries: twitterIds.map((twitterId) => ({
            enabled,
            queryKey: ['profile', Source.Twitter, twitterId],
            queryFn: () => TwitterSocialMediaProvider.getProfileById(twitterId),
        })),
        combine: (result) => {
            return result.map((x) => x.data);
        },
    });

    return twitterProfiles;
}

export const Feeds = memo<Props>(function Feeds({ chainId, address, symbol, name, ...props }) {
    const params = useSearchParams();
    const paramSource = params.get('source') as SocialSource | null;
    const defaultSource = paramSource && SORTED_TOKEN_FEEDS_SOURCES.includes(paramSource) ? paramSource : null;
    const pathname = usePathname();

    const [openModal, setOpenModal] = useState(false);
    const supportedX3 = chainId ? X3_PRO_CHAIN_IDS.includes(chainId) : true;
    const { data: x3Token } = useX3ProTokenInfo(address, supportedX3);
    const { data: x3TokenMention } = useX3ProTokenMention(address, supportedX3);

    const source = defaultSource || SORTED_TOKEN_FEEDS_SOURCES[0];
    const isX3Pro = source === Source.X3Pro;

    const keywords = useMemo(() => {
        const text = symbol === '[invalid]' ? name : symbol;
        if (isX3Pro || !text) return address || [];
        const includesSpace = text.trim().includes(' ');
        if (includesSpace && [Source.Lens, Source.Bsky].includes(source)) return address || [];
        return compact([includesSpace ? `"${text}"` : `$${symbol}`, address]);
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

    const createQueryString = (source: string, postOrderType?: PostOrderType) => {
        const newParams = new URLSearchParams(params);
        newParams.set('source', source);
        if (postOrderType) newParams.set('order', postOrderType.toString());
        return newParams.toString();
    };

    return (
        <div {...props} className={classNames('flex flex-col gap-2', props.className)}>
            <div className="flex shrink-0 gap-2">
                {SORTED_TOKEN_FEEDS_SOURCES.map((x) => {
                    const isX3Pro = x === Source.X3Pro;
                    const button = (
                        <Link
                            replace
                            key={x}
                            className={classNames(
                                'flex h-6 min-w-10 cursor-pointer list-none items-center justify-center rounded-md px-1.5 text-xs leading-6',
                                source === x
                                    ? 'bg-highlight text-white'
                                    : 'bg-thirdMain text-second hover:text-highlight',
                            )}
                            href={`${pathname}?${createQueryString(x)}`}
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
                    if (isX3Pro)
                        return (
                            <Tooltip
                                key={x}
                                placement="top"
                                interactive
                                content={
                                    <div className="text-sm">
                                        <Trans>
                                            Powered by{' '}
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
                        href={`${pathname}?${createQueryString(Source.X3Pro, isDesc ? PostOrderType.ASC : PostOrderType.DESC)}`}
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
            <SearchPostList
                keyword={keywords}
                searchType={SearchType.Posts}
                source={source}
                orderType={postOrderType}
                emptyMessage={
                    isX3Pro ? (
                        supportedX3 ? (
                            <Trans>No posts found for this token.</Trans>
                        ) : (
                            <Trans>Feeds for tokens on this chain will be available soon.</Trans>
                        )
                    ) : undefined
                }
            />
            {openModal && users.length ? (
                <MentionedByModal open onClose={() => setOpenModal(false)} users={users} />
            ) : null}
        </div>
    );
});
