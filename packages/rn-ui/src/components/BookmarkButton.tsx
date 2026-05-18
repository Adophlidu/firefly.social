import { useLingui } from '@lingui/react/macro';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { memo } from 'react';

import { ButtonUI } from '@/components/ButtonUI';
import { STALE_TIMES } from '@/constants/enum';
import { toast } from '@/helpers/toast';
import { useAsyncFn } from '@/hooks/useAsyncFn';
import { StarIcon } from '@/icons/StarIcon';
import { StarSelectedIcon } from '@/icons/StarSelectedIcon';
import { createFavorite } from '@/services/firefly/createFavorite';
import { getFavorites } from '@/services/firefly/getFavorites';
import { removeFavorite } from '@/services/firefly/removeFavorite';
import { sessionTokenAtom } from '@/store/session';

interface BookmarkButtonProps {
    coinName: string;
}

export const BookmarkButton = memo<BookmarkButtonProps>(function BookmarkButton({ coinName }) {
    const { i18n } = useLingui();
    const tokenAtom = useAtomValue(sessionTokenAtom);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['bookmarks', coinName],
        staleTime: STALE_TIMES.MINUTE_5,
        queryFn: async () => {
            const result = await getFavorites({ limit: 200 });
            return result.data.some((coin) => coin.name === coinName);
        },
        enabled: !!tokenAtom,
    });

    const isBookmarked = !!data;

    const [{ loading }, toggleBookmark] = useAsyncFn(async () => {
        try {
            if (isBookmarked) {
                await removeFavorite(coinName);
            } else {
                await createFavorite(coinName);
            }

            queryClient.setQueryData(['bookmarks', coinName], !isBookmarked);
            queryClient.invalidateQueries({ queryKey: ['perps', 'favorites'] });
        } catch (error) {
            toast({
                type: 'error',
                error,
                message:
                    error instanceof Error
                        ? error.message
                        : isBookmarked
                          ? i18n._('rn-ui.bookmark.failureRemove')
                          : i18n._('rn-ui.bookmark.failureAdd'),
            });
        }
    }, [coinName, i18n, isBookmarked, queryClient]);

    if (!tokenAtom) return null;

    return (
        <ButtonUI
            unstyled
            width={30}
            height={30}
            alignItems="center"
            justifyContent="center"
            borderRadius={15}
            pressStyle={{ opacity: 0.72 }}
            disabled={isLoading || loading}
            icon={isBookmarked ? <StarSelectedIcon /> : <StarIcon />}
            onPress={toggleBookmark}
        />
    );
});
