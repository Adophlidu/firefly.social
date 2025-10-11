'use client';
import { memo } from 'react';
import urlcat from 'urlcat';

import CloseIcon from '@/assets/close.svg';
import { SITE_URL } from '@/constants/index.js';
import { useComeBack } from '@/hooks/useComeback.js';

interface SparksModalProps {
    uid?: string;
}

export const SparksModal = memo<SparksModalProps>(function SparksModal({ uid }) {
    const onClose = useComeBack();
    return (
        <div className="fixed inset-0 z-modal flex flex-col bg-black/50 backdrop-blur-sm">
            <div className="hidden h-10 shrink-0 items-center justify-end md:flex">
                <CloseIcon
                    width={24}
                    height={24}
                    className="mr-2 cursor-pointer text-white hover:opacity-80"
                    onClick={() => onClose()}
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
