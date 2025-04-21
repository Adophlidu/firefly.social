'use client';

import { Trans } from '@lingui/react/macro';
import { getEnumAsArray } from '@masknet/kit';

import { Link } from '@/components/Link.js';
import { CommunityType, SearchType } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

export function CommunityTypeTab() {
    const { communityType, searchKeyword, source, searchType } = useSearchStateStore();

    if (searchType !== SearchType.Communities) return null;

    return (
        <nav className="flex gap-x-2 space-x-2 px-4 pb-1.5 pt-3" aria-label="Tabs">
            {getEnumAsArray(CommunityType).map(({ value }, index) => (
                <Link
                    key={index}
                    href={resolveSearchUrl(searchKeyword, searchType, source, value)}
                    replace
                    className={classNames(
                        'flex h-6 cursor-pointer list-none justify-center rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                        value === communityType
                            ? 'bg-highlight text-white'
                            : 'bg-thirdMain text-second hover:text-highlight',
                    )}
                    aria-current={value === communityType ? 'page' : undefined}
                >
                    {{
                        [CommunityType.BskyFeed]: <Trans>Bluesky</Trans>,
                        [CommunityType.FarcasterChannel]: <Trans>Farcaster</Trans>,
                        [CommunityType.LensGroup]: <Trans>Lens</Trans>,
                    }[value] ?? value}
                </Link>
            ))}
        </nav>
    );
}
