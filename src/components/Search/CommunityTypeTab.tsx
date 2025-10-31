'use client';

import { classNames, getEnumAsArray } from '@firefly/utils';
import { Trans } from '@lingui/react/macro';
import type { HTMLProps } from 'react';

import { Link } from '@/components/Link.js';
import { ClubType, SearchType } from '@/constants/enum.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

export function ClubTypeTab(props: HTMLProps<HTMLDivElement>) {
    const { clubType, searchKeyword, source, searchType } = useSearchStateStore();

    if (searchType !== SearchType.Clubs) return null;

    return (
        <nav
            {...props}
            className={classNames('flex gap-x-2 space-x-2 px-4 pb-1.5 pt-3', props.className)}
            aria-label="Tabs"
        >
            {getEnumAsArray(ClubType).map(({ value }, index) => (
                <Link
                    key={index}
                    href={resolveSearchUrl(searchKeyword, searchType, source, value)}
                    replace
                    className={classNames(
                        'flex h-6 cursor-pointer list-none justify-center rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                        value === clubType
                            ? 'bg-highlight text-white'
                            : 'bg-thirdMain text-second hover:text-highlight',
                    )}
                    aria-current={value === clubType ? 'page' : undefined}
                >
                    {{
                        [ClubType.BskyFeed]: <Trans>Bluesky</Trans>,
                        [ClubType.FarcasterChannel]: <Trans>Farcaster</Trans>,
                        [ClubType.LensGroup]: <Trans>Lens</Trans>,
                    }[value] ?? value}
                </Link>
            ))}
        </nav>
    );
}
