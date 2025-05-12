import { compact } from 'lodash-es';
import { type HTMLProps, memo, useMemo, useState } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { SearchPostList } from '@/components/Search/SearchPostList.js';
import { SearchType, type SocialSource, type Source } from '@/constants/enum.js';
import { SORTED_SOCIAL_SOURCES } from '@/constants/index.js';
import { useSearchParams } from '@/esm/navigation.js';
import { classNames } from '@/helpers/classNames.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';

interface Props extends HTMLProps<HTMLDivElement> {
    address?: string;
    symbol: string;
}

export const Feeds = memo<Props>(function Feeds({ address, symbol, ...props }) {
    const keywords = useMemo(() => compact([symbol ? `$${symbol}` : null, address]), [symbol, address]);
    const params = useSearchParams();
    const paramSource = params.get('source') as SocialSource | null;
    const defaultSource = paramSource && SORTED_SOCIAL_SOURCES.includes(paramSource) ? paramSource : null;
    const [source = defaultSource || SORTED_SOCIAL_SOURCES[0], setSource] = useState<Source>();

    return (
        <div {...props} className={classNames('flex flex-col gap-2', props.className)}>
            <div className="flex shrink-0 gap-2">
                {SORTED_SOCIAL_SOURCES.map((x) => {
                    return (
                        <ClickableButton
                            key={x}
                            className={classNames(
                                'flex h-6 cursor-pointer list-none justify-center rounded-md px-1.5 text-xs leading-6 lg:flex-initial lg:justify-start',
                                source === x
                                    ? 'bg-highlight text-white'
                                    : 'bg-thirdMain text-second hover:text-highlight',
                            )}
                            onClick={() => setSource(x)}
                            aria-current={source === x ? 'page' : undefined}
                        >
                            {resolveSourceName(x)}
                        </ClickableButton>
                    );
                })}
            </div>
            <SearchPostList keyword={keywords} searchType={SearchType.Posts} source={source} />
        </div>
    );
});
