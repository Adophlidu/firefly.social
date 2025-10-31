import { classNames } from '@dimensiondev/utils';
import { memo, Suspense, useState } from 'react';
import { useDebounce } from 'usehooks-ts';

import SearchIcon from '@/assets/search.svg';
import { TenorGifList } from '@/components/Gif/TenorGifList.js';
import { Loading } from '@/components/Loading.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import type { IGif } from '@/types/giphy.js';

interface TenorGifSelectorProps {
    onSelected: (gif: IGif) => void;
}

export const TenorGifSelector = memo<TenorGifSelectorProps>(function TenorGifSelector({ onSelected }) {
    const isMedium = useIsMedium('max');
    const [inputText, setInputText] = useState('');
    const debouncedKeyword = useDebounce(inputText, 300);

    return (
        <>
            <div className="relative mx-3 flex grow items-center rounded-xl bg-lightBg pl-3 text-main">
                <SearchIcon width={18} height={18} className="shrink-0 text-primaryMain" />
                <div className="w-full flex-1">
                    <SearchInput
                        value={inputText}
                        onChange={(ev) => setInputText(ev.currentTarget.value)}
                        onClear={() => setInputText('')}
                    />
                </div>
            </div>
            <div
                className={classNames('overflow-y-auto px-3', {
                    'h-[calc(620px-56px-36px)]': !isMedium,
                    'h-[calc(100vh-56px-36px)]': isMedium,
                })}
            >
                <Suspense
                    fallback={
                        <div className="flex h-full items-center justify-center">
                            <Loading />
                        </div>
                    }
                >
                    <TenorGifList keyword={debouncedKeyword} onSelected={onSelected} />
                </Suspense>
            </div>
        </>
    );
});
