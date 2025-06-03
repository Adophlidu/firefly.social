import { Trans } from '@lingui/react/macro';
import { useQueries } from '@tanstack/react-query';
import { compact } from 'lodash-es';
import { type HTMLProps, memo, useMemo, useState } from 'react';

import SortAscIcon from '@/assets/sort-asc.svg';
import X3ProIcon from '@/assets/x3pro.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
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
}

export const Feeds = memo<Props>(function Feeds({ chainId, address, symbol, ...props }) {
    const params = useSearchParams();
    const paramSource = params.get('source') as SocialSource | null;
    const defaultSource = paramSource && SORTED_SOCIAL_SOURCES.includes(paramSource) ? paramSource : null;

    const [openModal, setOpenModal] = useState(false);
    const { data: x3Token } = useX3ProTokenInfo(address, chainId ? X3_PRO_CHAIN_IDS.includes(chainId) : true);

    const enabledX3 = !!x3Token || isValidAddressSolana(address);
    const sources = useMemo(() => {
        return enabledX3 ? SORTED_TOKEN_FEEDS_SOURCES : SORTED_TOKEN_FEEDS_SOURCES.filter((x) => x !== Source.X3Pro);
    }, [enabledX3]);

    const [source = defaultSource || sources[0], setSource] = useState<Source>();
    const isX3Pro = source === Source.X3Pro;

    const keywords = useMemo(() => {
        if (isX3Pro || !symbol) return address || [];
        const includesSpace = symbol.trim().includes(' ');
        if (includesSpace && [Source.Lens, Source.Bsky].includes(source)) return address || [];
        return compact([includesSpace ? `"${symbol}"` : `$${symbol}`, address]);
    }, [isX3Pro, address, symbol, source]);
    const mentionUsers = x3Token?.mentionUsers || EMPTY_LIST;

    const twitterProfile = useCurrentProfile(Source.Twitter);
    const isTwitterLogin = !!twitterProfile;
    const { profiles: twitterProfiles, isFetching } = useQueries({
        queries: mentionUsers.map((user) => ({
            enabled: isTwitterLogin,
            queryKey: ['profile', Source.Twitter, user.twitterId],
            queryFn: () => TwitterSocialMediaProvider.getProfileById(user.twitterId),
        })),
        combine: (result) => {
            const profiles = result.map((x) => x.data);
            const isFetching = result.some((x) => x.isFetching);
            return { profiles, isFetching };
        },
    });

    const users = useMemo(() => {
        if (isFetching) return EMPTY_LIST;
        if (isX3Pro && mentionUsers.length)
            return mentionUsers
                .filter((_, i) => {
                    const profile = twitterProfiles[i] as Profile<UserV2> | undefined;
                    const connection_status = profile?.__original__?.connection_status;
                    return !(connection_status?.includes('blocking') || connection_status?.includes('muting'));
                })
                .map(formatTokenMentionUser);
        return EMPTY_LIST;
    }, [isFetching, isX3Pro, mentionUsers, twitterProfiles]);

    const [postOrderType, setPostOrderType] = useState<PostOrderType>(PostOrderType.DESC);

    return (
        <div {...props} className={classNames('flex flex-col gap-2', props.className)}>
            <div className="flex shrink-0 gap-2">
                {sources.map((x) => {
                    const isX3Pro = x === Source.X3Pro;
                    const button = (
                        <ClickableButton
                            key={x}
                            className={classNames(
                                'flex h-6 min-w-10 cursor-pointer list-none items-center justify-center rounded-md px-1.5 text-xs leading-6',
                                source === x
                                    ? 'bg-highlight text-white'
                                    : 'bg-thirdMain text-second hover:text-highlight',
                            )}
                            onClick={() => setSource(x)}
                            aria-current={source === x ? 'page' : undefined}
                        >
                            {x === Source.X3Pro ? (
                                <>
                                    KOL <X3ProIcon width={16} height={16} />
                                </>
                            ) : (
                                resolveSourceName(x)
                            )}
                        </ClickableButton>
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
                    <ClickableButton
                        className="ml-auto inline-flex size-6 items-center justify-center"
                        onClick={() => {
                            setPostOrderType(
                                postOrderType === PostOrderType.DESC ? PostOrderType.ASC : PostOrderType.DESC,
                            );
                        }}
                    >
                        <SortAscIcon
                            width={16}
                            height={16}
                            className={postOrderType === PostOrderType.DESC ? 'rotate-180' : ''}
                        />
                    </ClickableButton>
                ) : null}
            </div>
            {isX3Pro && x3Token && !isFetching ? (
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
            />
            {openModal && users.length ? (
                <MentionedByModal open onClose={() => setOpenModal(false)} users={users} />
            ) : null}
        </div>
    );
});
