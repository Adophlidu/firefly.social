'use client';

import { SITE_URL } from '@dimensiondev/envs/web';
import { memo } from 'react';
import urlcat from 'urlcat';

import { CloseButton } from '@/components/IconButton.js';
import { useComeBack } from '@/hooks/useComeback.js';

export const MysteryBoxModal = memo(function MysteryBoxModal() {
    const onClose = useComeBack();
    return (
        <div className="fixed inset-0 z-modal flex flex-col bg-black/50 backdrop-blur-sm">
            <div className="hidden h-10 shrink-0 items-center justify-end md:flex">
                <CloseButton
                    className="mr-2 cursor-pointer text-white hover:opacity-80"
                    size={24}
                    onClick={() => onClose()}
                    aria-label="Close"
                />
            </div>
            <div className="relative flex-1 md:rounded-t-[32px]" style={{ background: '#0a0a1a' }}>
                <iframe
                    src={urlcat(SITE_URL, '/mystery-box-iframe')}
                    className="size-full md:rounded-t-[32px]"
                    title="Mystery Box"
                />
            </div>
        </div>
    );
});
