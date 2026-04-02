'use client';

import SearchIcon from '@dimensiondev/assets/search.svg';
import { envs } from '@dimensiondev/envs';
import { classNames } from '@dimensiondev/utils';
import { SearchBar, SearchContextManager } from '@giphy/react-components';
import { IS_SAFARI } from '@lexical/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useMemo, useState } from 'react';
import { useSize } from 'react-use';

import { ClickableButton } from '@/components/ClickableButton.js';
import { EmojiList } from '@/components/Gif/EmojiList.js';
import { GiphyGifList } from '@/components/Gif/GiphyGifList.js';
import { GiphyTabType } from '@/constants/enum.js';
import { Image } from '@/esm/Image.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { type IGif } from '@/types/giphy.js';

interface GiphyGifSelectorProps {
    onSelected: (gif: IGif) => void;
}

function getGiphyMediaTabs() {
    return [
        { type: GiphyTabType.Gifs, label: <Trans>GIFs</Trans> },
        { type: GiphyTabType.Stickers, label: <Trans>Stickers</Trans> },
        { type: GiphyTabType.Text, label: <Trans>Text</Trans> },
        { type: GiphyTabType.Emoji, label: <Trans>Emoji</Trans> },
    ];
}

export function GiphyGifSelector({ onSelected }: GiphyGifSelectorProps) {
    const isMedium = useIsMedium('max');
    const [tabType, setTabType] = useState<GiphyTabType>(GiphyTabType.Gifs);

    const [sizedFooter, { width }] = useSize(
        <div className="mt-2 flex items-center justify-end pb-2 pr-3 text-[13px] font-bold text-second">
            <Trans>Powered by</Trans>
            <Image className="ml-2" alt="GIPHY" src="/image/giphy.png" width={12} height={12} />
            <span className="text-black dark:text-white">GIPHY</span>
        </div>,
    );

    const searchOptions = useMemo(
        () => ({
            type: tabType === GiphyTabType.Emoji ? GiphyTabType.Gifs : tabType,
        }),
        [tabType],
    );

    return (
        <SearchContextManager
            apiKey={envs.external.NEXT_PUBLIC_GIPHY_API_KEY}
            options={searchOptions}
            shouldFetchChannels={false}
        >
            <div>
                {tabType !== GiphyTabType.Emoji ? (
                    <div className="relative mx-3 flex grow items-center rounded-xl bg-lightBg pl-3 text-main">
                        <SearchIcon width={18} height={18} className="shrink-0 text-primaryMain" />
                        <div className="w-full flex-1">
                            <SearchBar className="ff-giphy-search-bar" placeholder={t`Search...`} />
                        </div>
                    </div>
                ) : null}
                <div
                    className={classNames('mt-2', {
                        'h-[calc(620px-56px-36px-56px-36px)]': tabType !== GiphyTabType.Emoji && !isMedium,
                        'h-[calc(620px-56px-36px-56px)]': tabType === GiphyTabType.Emoji && !isMedium,
                        'h-[calc(100vh-56px-36px-56px-36px)]': tabType !== GiphyTabType.Emoji && isMedium && !IS_SAFARI,
                        'h-[calc(100vh-56px-36px-56px)]': tabType === GiphyTabType.Emoji && isMedium && !IS_SAFARI,
                        'h-[calc(100vh-56px-36px-56px-36px-54px)]':
                            tabType !== GiphyTabType.Emoji && isMedium && IS_SAFARI,
                        'h-[calc(100vh-56px-36px-56px-54px)]': tabType === GiphyTabType.Emoji && isMedium && IS_SAFARI,
                    })}
                >
                    {tabType === GiphyTabType.Emoji ? (
                        <EmojiList width={width - 24} onSelected={onSelected} />
                    ) : (
                        <GiphyGifList width={width - 24} onSelected={onSelected} />
                    )}
                </div>
                <div className="no-scrollbar mx-3 my-2.5 overflow-x-auto whitespace-nowrap rounded-3xl bg-lightBg px-4 py-1">
                    {getGiphyMediaTabs().map((mediaTab) => (
                        <ClickableButton
                            onClick={() => setTabType(mediaTab.type)}
                            key={mediaTab.type}
                            className={classNames('inline-block h-7 rounded-full px-4 text-base font-bold leading-7', {
                                'bg-lightBottom text-black dark:text-white': tabType === mediaTab.type,
                                'text-second': tabType !== mediaTab.type,
                            })}
                        >
                            {mediaTab.label}
                        </ClickableButton>
                    ))}
                </div>
                {sizedFooter}
            </div>
        </SearchContextManager>
    );
}
