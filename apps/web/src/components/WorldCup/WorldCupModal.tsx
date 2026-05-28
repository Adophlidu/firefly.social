'use client';

import { SITE_URL } from '@dimensiondev/envs/web';
import { memo, useEffect, useState } from 'react';
import urlcat from 'urlcat';

import { CloseButton } from '@/components/IconButton.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useComeBack } from '@/hooks/useComeback.js';

export const WorldCupModal = memo(function WorldCupModal() {
    const onClose = useComeBack();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        document.documentElement.classList.add('no-scrollbar');
        return () => {
            document.documentElement.classList.remove('no-scrollbar');
        };
    }, []);

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
            <div className="relative flex-1 overflow-hidden md:rounded-t-[32px]">
                {!isLoaded ? (
                    <div className="flex size-full items-center justify-center">
                        <LoadingIcon className="text-white" size={40} />
                    </div>
                ) : null}
                <iframe
                    src={urlcat(SITE_URL, '/world-cup-iframe')}
                    className="size-full md:rounded-t-[32px]"
                    title="World Cup"
                    onLoad={() => {
                        setIsLoaded(true);
                    }}
                />
            </div>
        </div>
    );
});
