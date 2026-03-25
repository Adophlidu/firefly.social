import { envs } from '@dimensiondev/envs';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import { Loading } from '@/components/Loading.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { type IGif } from '@/types/giphy.js';

interface EmojiListProps {
    width: number;
    onSelected: (gif: IGif) => void;
}

export const EmojiList = memo<EmojiListProps>(function EmojiList({ width, onSelected }) {
    const isMedium = useIsMedium();

    const [{ loading }, fetchGifs] = useAsyncFn(async (offset: number) => {
        const giphyApi = new GiphyFetch(envs.external.NEXT_PUBLIC_GIPHY_API_KEY);
        const fetchDefaultVariations = (offset: number) => giphyApi.emojiDefaultVariations({ offset });
        return fetchDefaultVariations(offset);
    }, []);

    return (
        <div className="relative h-full rounded">
            <div className="no-scrollbar h-full overflow-y-auto overflow-x-hidden px-3">
                <Grid
                    className="ff-giphy-grid"
                    hideAttribution
                    noLink
                    columns={isMedium ? 3 : 2}
                    width={width}
                    fetchGifs={fetchGifs}
                    onGifClick={onSelected}
                />
            </div>
            {loading ? <Loading /> : null}
        </div>
    );
});
