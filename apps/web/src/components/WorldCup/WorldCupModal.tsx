'use client';

import { SITE_URL } from '@dimensiondev/envs/web';
import { memo } from 'react';
import urlcat from 'urlcat';

import { CloseButton } from '@/components/IconButton.js';
import { useComeBack } from '@/hooks/useComeback.js';

export const WorldCupModal = memo(function WorldCupModal() {
    const onClose = useComeBack();
    return (
        <div className="z-modal fixed inset-0 flex flex-col bg-black/50 backdrop-blur-sm">
            <div className="hidden h-10 shrink-0 items-center justify-end md:flex">
                <CloseButton
                    className="mr-2 cursor-pointer text-white hover:opacity-80"
                    size={24}
                    onClick={() => onClose()}
                    aria-label="Close"
                />
            </div>
            <div className="relative flex-1 md:rounded-t-[32px]">
                <iframe
                    src={urlcat(SITE_URL, '/world-cup-iframe')}
                    className="size-full md:rounded-t-[32px]"
                    title="World Cup"
                />
            </div>
        </div>
    );
});
