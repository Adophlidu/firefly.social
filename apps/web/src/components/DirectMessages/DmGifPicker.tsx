'use client';

import SearchIcon from '@dimensiondev/assets/search.svg';
import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { memo, useState } from 'react';

import { useDebouncedDmSearch } from '@/components/DirectMessages/useDebouncedDmSearch.js';
import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { ModalTitle } from '@/components/ModalTitle.js';
import { Popover } from '@/components/Popover.js';
import { SearchInput } from '@/components/Search/SearchInput.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { createDmGifDraft } from '@/providers/orb/chat/media.js';
import type { DmAttachmentDraft } from '@/providers/orb/chat/types.js';
import { fetchDmGifs } from '@/services/fetchDmGifs.js';

interface DmGifPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (attachment: DmAttachmentDraft) => void;
}

export const DmGifPicker = memo(function DmGifPicker({ open, onClose, onSelect }: DmGifPickerProps) {
    const isMedium = useIsMedium();
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebouncedDmSearch(query);
    const gifsQuery = useQuery({
        queryKey: ['dm-gifs', debouncedQuery],
        queryFn: ({ signal }) => fetchDmGifs(debouncedQuery, signal),
        enabled: open,
        staleTime: 60_000,
    });

    const content = (
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
            <div className="mb-3 flex items-center rounded-xl bg-lightBg pl-3 text-main">
                <SearchIcon width={18} height={18} className="shrink-0 text-primaryMain" />
                <div className="min-w-0 flex-1">
                    <SearchInput
                        value={query}
                        onChange={(event) => setQuery(event.currentTarget.value)}
                        onClear={() => setQuery('')}
                    />
                </div>
            </div>
            {gifsQuery.isPending ? (
                <div className="flex flex-1 items-center justify-center">
                    <Loading />
                </div>
            ) : gifsQuery.error ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-second">
                    <Trans>GIFs could not be loaded</Trans>
                    <button
                        type="button"
                        className="rounded-xl bg-lightBg px-4 py-2 font-bold text-main"
                        onClick={() => void gifsQuery.refetch()}
                    >
                        <Trans>Retry</Trans>
                    </button>
                </div>
            ) : (
                <div className="no-scrollbar grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto md:grid-cols-3">
                    {gifsQuery.data.map((gif) => (
                        <button
                            key={gif.id}
                            type="button"
                            className="h-36 overflow-hidden rounded-xl bg-lightBg"
                            onClick={() => {
                                onSelect(createDmGifDraft(gif.url, gif.width, gif.height));
                                onClose();
                            }}
                        >
                            {/* GIPHY media hosts are not compatible with the Next Image allowlist. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={gif.preview} alt="" className="size-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    if (isMedium) {
        return (
            <Modal
                open={open}
                size="md"
                className="h-[min(680px,calc(100vh-32px))]"
                title={<Trans>GIFs</Trans>}
                enableClose
                disableDialogClose={false}
                panelClassName="flex min-h-0 flex-1 flex-col overflow-hidden !p-0 !pt-0"
                onClose={onClose}
            >
                {content}
            </Modal>
        );
    }

    return (
        <Popover
            open={open}
            enableOverflow={false}
            dialogPanelClassName="!inset-x-3 !bottom-2 !p-0 !pt-8"
            onClose={onClose}
        >
            <div className="flex h-[min(680px,75dvh)] min-h-0 flex-col overflow-hidden">
                <ModalTitle title={<Trans>GIFs</Trans>} onClose={onClose} />
                {content}
            </div>
        </Popover>
    );
});
