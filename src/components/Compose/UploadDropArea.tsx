import { classNames } from '@dimensiondev/utils';
import { compact } from 'lodash-es';
import { type HTMLProps, useEffect, useRef, useState } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { SUPPORTED_VIDEO_SOURCES } from '@/constants/computed.js';
import { getCurrentPostImageLimits, getCurrentPostVideoLimits } from '@/helpers/getCurrentPostImageLimits.js';
import { isImageFileType, isMediaFileType, isVideoFileType } from '@/helpers/isMediaFileType.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { useForkRef } from '@/hooks/useForkRef.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

interface UploadDropAreaProps extends HTMLProps<HTMLDivElement> {
    loading?: boolean;
    onDropFiles: (files: File[]) => Promise<void>;
}

export function UploadDropArea({ loading, children, ref, onDrop, onDropFiles, ...props }: UploadDropAreaProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [canDrop, setCanDrop] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const forkedRef = useForkRef(containerRef, ref);

    const { type } = useComposeStateStore();
    const { availableSources, videos, images } = useCompositePost();
    const maxImageCount = getCurrentPostImageLimits(type, availableSources);
    const maxVideoCount = getCurrentPostVideoLimits(availableSources);
    const disableVideo =
        videos.length >= maxVideoCount ||
        images.length > 0 ||
        availableSources.some((source) => !SUPPORTED_VIDEO_SOURCES.includes(source));
    const disableImage = images.length >= maxImageCount;

    useEffect(() => {
        const ele = containerRef.current;
        if (!ele) return;
        const controller = new AbortController();

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            setIsDragging(true);
            if (!e.dataTransfer) return;
            const items = [...e.dataTransfer.items].filter((item) => item.kind === 'file');
            const canDropVideo = disableVideo ? false : items.some((item) => isVideoFileType(item.type));
            const canDropImage = disableImage ? false : items.some((file) => isImageFileType(file.type));
            const canDrop = canDropVideo || canDropImage;
            setCanDrop(canDrop);
        };
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            onDropFiles(Array.from(e.dataTransfer?.files ?? []));
        };
        const handleDragLeave = () => {
            setIsDragging(false);
        };
        ele.addEventListener('dragover', handleDragOver, { signal: controller.signal });
        ele.addEventListener('drop', handleDrop, { signal: controller.signal });
        ele.addEventListener('dragleave', handleDragLeave, { signal: controller.signal });
        return () => controller.abort();
    }, [onDropFiles, disableVideo, disableImage]);

    useEffect(() => {
        const ele = containerRef.current;
        if (!ele) return;
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            const files = compact([...items].map((x) => (isMediaFileType(x.type) ? x.getAsFile() : null)));
            onDropFiles(files);
        };
        ele.addEventListener('paste', handlePaste);
        return () => {
            ele.removeEventListener('paste', handlePaste);
        };
    }, [onDropFiles]);

    return (
        <div
            {...props}
            className={classNames(
                'relative',
                props.className,
                isDragging ? 'border-dashed border-highlight' : 'border-secondaryLine',
                {
                    'cursor-not-allowed [&_*]:cursor-not-allowed': !canDrop && isDragging,
                },
            )}
            ref={forkedRef}
        >
            {children}
            {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 text-secondary">
                    <LoadingIcon size={40} />
                </div>
            ) : null}
        </div>
    );
}
