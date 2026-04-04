'use client';

import { memo } from 'react';
import urlcat from 'urlcat';

import { CloseButton } from '@/components/IconButton.js';
import { SITE_URL } from '@/constants/static.js';
import { useComeBack } from '@/hooks/useComeback.js';

export const SparksModal = memo(function SparksModal() {
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
            <div
                className="relative flex-1 md:rounded-t-[32px]"
                style={{
                    background: 'linear-gradient(180deg, #6B56D6 0%, #F0D6F0 100%)',
                }}
            >
                <iframe src={urlcat(SITE_URL, '/sparks-iframe')} className="h-full md:rounded-t-[32px]" />
            </div>
        </div>
    );
});
