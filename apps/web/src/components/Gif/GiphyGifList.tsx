import { Grid, SearchContext, SuggestionBar } from '@giphy/react-components';
import { memo, useContext } from 'react';
import { useAsyncFn } from 'react-use';

import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { MediaSource } from '@/types/compose.js';
import { type IGif } from '@/types/giphy.js';

interface GiphyGifListProps {
    width: number;
    onSelected: (gif: IGif) => void;
}

export const GiphyGifList = memo<GiphyGifListProps>(function GiphyGifList({ width, onSelected }) {
    const { fetchGifs, searchKey } = useContext(SearchContext);
    const isMedium = useIsMedium();

    const [, fetchGiphyGifs] = useAsyncFn(
        async (offset: number) => {
            const result = await fetchGifs(offset);

            return {
                ...result,
                data: result.data.map((gif) => ({ ...gif, source: MediaSource.Giphy })),
            };
        },
        [fetchGifs],
    );

    return (
        <div className="relative h-full rounded">
            <div className="no-scrollbar h-full overflow-y-auto overflow-x-hidden px-3">
                <SuggestionBar />
                <Grid
                    className="ff-giphy-grid"
                    hideAttribution
                    noLink
                    key={searchKey}
                    columns={isMedium ? 3 : 2}
                    width={width}
                    fetchGifs={fetchGiphyGifs}
                    onGifClick={onSelected}
                />
            </div>
        </div>
    );
});
