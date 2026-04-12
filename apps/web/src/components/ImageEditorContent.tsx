'use client';

import { Trans } from '@lingui/react/macro';
import { type Ranger, useRanger } from '@tanstack/react-ranger';
import { Fragment, useCallback, useRef, useState } from 'react';
import type { AvatarEditorProps } from 'react-avatar-editor';
import AvatarEditor from 'react-avatar-editor';

import { ClickableButton } from '@/components/ClickableButton.js';
import { FileMimeType } from '@/constants/enum.js';

export interface ImageEditorContentProps {
    file: string | File;
    onSave?(blob: File | null): void;
    AvatarEditorProps?: Omit<AvatarEditorProps, 'image'>;
}

export function ImageEditorContent({ file, onSave, AvatarEditorProps }: ImageEditorContentProps) {
    const editorRef = useRef<AvatarEditor>(null);
    const rangerRef = useRef<HTMLDivElement>(null);

    const [scale, setScale] = useState(1);

    const rangerInstance = useRanger<HTMLDivElement>({
        getRangerElement: () => rangerRef.current,
        values: [scale],
        min: 1,
        max: 10,
        stepSize: 0.01,
        onChange: (instance: Ranger<HTMLDivElement>) => setScale(instance.sortedValues[0]),
        onDrag: (instance: Ranger<HTMLDivElement>) => setScale(instance.sortedValues[0]),
    });

    const handleSave = useCallback(async () => {
        const editor = editorRef.current;
        if (!editor) return;

        editor.getImageScaledToCanvas().toBlob((blob) => {
            if (blob) onSave?.(new File([blob], 'image.png', { type: blob?.type }));
            else onSave?.(null);
        }, FileMimeType.PNG);
    }, [onSave]);

    return (
        <div className="flex w-full flex-1 flex-col">
            <div className="flex min-h-0 w-full flex-col gap-4 p-4">
                <div className="mx-4">
                    <AvatarEditor
                        className="!h-auto !w-full rounded-lg"
                        {...AvatarEditorProps}
                        ref={editorRef}
                        image={file}
                        scale={AvatarEditorProps?.scale ?? scale}
                        rotate={AvatarEditorProps?.scale ?? 0}
                        border={AvatarEditorProps?.border ?? 50}
                        borderRadius={AvatarEditorProps?.borderRadius ?? 300}
                    />
                </div>
                <div ref={rangerRef} className="bg-bg relative mx-2 h-1.5 w-full rounded-2xl">
                    {rangerInstance
                        .handles()
                        .map(({ value, onKeyDownHandler, onMouseDownHandler, onTouchStart }, i) => (
                            <Fragment key={i}>
                                <div className="relative size-full overflow-hidden rounded-2xl">
                                    <div
                                        className="bg-link size-full origin-left"
                                        style={{
                                            transform: `scaleX(${rangerInstance.getPercentageForValue(value) / 100})`,
                                        }}
                                    />
                                </div>
                                <button
                                    onKeyDown={onKeyDownHandler}
                                    onMouseDown={onMouseDownHandler}
                                    onTouchStart={onTouchStart}
                                    role="slider"
                                    aria-valuemin={rangerInstance.options.min}
                                    aria-valuemax={rangerInstance.options.max}
                                    aria-valuenow={value}
                                    className="willChange-[left] bg-link shadow-messageShadow absolute left-0 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                    style={{
                                        left: `${rangerInstance.getPercentageForValue(value)}%`,
                                    }}
                                />
                            </Fragment>
                        ))}
                </div>
            </div>
            <div className="shadow-accountCardShadowLight mt-auto flex w-full p-4">
                <ClickableButton
                    enableDefault
                    enablePropagate
                    className="bg-main text-medium text-primaryBottom flex h-10 w-full items-center justify-center rounded-lg font-bold leading-10"
                    onClick={handleSave}
                >
                    <Trans>Confirm</Trans>
                </ClickableButton>
            </div>
        </div>
    );
}
