'use client';

import { memo } from 'react';
import urlcat from 'urlcat';

import { CloseButton } from '@/components/IconButton.js';
import { SITE_URL } from '@/constants/static.js';
import { useComeBack } from '@/hooks/useComeback.js';

export const PredictionCampaignModal = memo(function PredictionCampaignModal() {
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
            <div className="relative flex-1 bg-white md:rounded-t-[32px]">
                <iframe src={urlcat(SITE_URL, '/prophet-iframe')} className="size-full md:rounded-t-[32px]" />
            </div>
        </div>
    );
});
