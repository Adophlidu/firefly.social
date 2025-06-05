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
import { EMPTY_LIST, SORTED_SOCIAL_SOURCES, SORTED_TOKEN_FEEDS_SOURCES, X3_PRO_CHAIN_IDS } from '@/constants/index.js';
import { useSearchParams } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { formatTokenMentionUser } from '@/helpers/formatTokenMentionUser.js';
import { isValidAddressSolana } from '@/helpers/isValidAddress.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useX3ProTokenInfo } from '@/hooks/token/useX3ProTokenInfo.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { TwitterSocialMediaProvider } from '@/providers/twitter/SocialMedia.js';
import type { UserV2 } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { PostOrderType } from '@/providers/x3pro/types.js';

interface Props extends HTMLProps<HTMLDivElement> {
    chainId: number | undefined;
    address?: string;
    symbol: string;
    name?: string;
}

export const Feeds = memo<Props>(function Feeds({ chainId, address, symbol, name, ...props }) {
    const params = useSearchParams();
    const paramSource = params.get('source') as SocialSource | null;
    const defaultSource = paramSource && SORTED_SOCIAL_SOURCES.includes(paramSource) ? paramSource : null;

    const [openModal, setOpenModal] = useState(false);
    const { data: x3Token } = useX3ProTokenInfo(address, chainId ? X3_PRO_CHAIN_IDS.includes(chainId) : true);

    const enabledX3 = !!x3Token || isValidAddressSolana(address);
    const sources = useMemo(() => {
        return enabledX3 ? SORTED_TOKEN_FEEDS_SOURCES : SORTED_TOKEN_FEEDS_SOURCES.filter((x) => x !== Source.X3Pro);
    }, [enabledX3]);

    const source = defaultSource || sources[0];
    const isX3Pro = source === Source.X3Pro;

    const keywords = useMemo(() => {
        const text = symbol === '[invalid]' ? name : symbol;
        if (isX3Pro || !text) return address || [];
        const includesSpace = text.trim().includes(' ');
        if (includesSpace && [Source.Lens, Source.Bsky].includes(source)) return address || [];
        return compact([includesSpace ? `"${text}"` : `$${symbol}`, address]);
    }, [isX3Pro, address, symbol, name, source]);
    const mentionUsers = x3Token?.mentionUsers || EMPTY_LIST;

    const twitterProfile = useCurrentProfile(Source.Twitter);
    const isTwitterLogin = !!twitterProfile;
    const twitterProfiles = useQueries({
        queries: mentionUsers.map((user) => ({
            enabled: isTwitterLogin,
            queryKey: ['profile', Source.Twitter, user.twitterId],
            queryFn: () => TwitterSocialMediaProvider.getProfileById(user.twitterId),
        })),
        combine: (result) => {
            return result.map((x) => x.data);
        },
    });

    const users = useMemo(() => {
        if (isX3Pro && mentionUsers.length)
            return mentionUsers
                .filter((user) => {
                    const profile = twitterProfiles.find((x) => x?.profileId === user.twitterId) as
                        | Profile<UserV2>
                        | undefined;
                    const connection_status = profile?.__original__?.connection_status;
                    return !(connection_status?.includes('blocking') || connection_status?.includes('muting'));
                })
                .map(formatTokenMentionUser);
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
                {sources.map((x) => {
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
                            href={`/token/${symbol}/feeds?${createQueryString(x)}`}
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
                        href={`/token/${symbol}/feeds?${createQueryString(Source.X3Pro, isDesc ? PostOrderType.ASC : PostOrderType.DESC)}`}
                    >
                        <SortAscIcon width={16} height={16} className={isDesc ? 'rotate-180' : ''} />
                    </Link>
                ) : null}
            </div>
            {isX3Pro && x3Token ? (
                <KolBar
                    users={users}
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
            />
            {openModal && users.length ? (
                <MentionedByModal open onClose={() => setOpenModal(false)} users={users} />
            ) : null}
        </div>
    );
});
