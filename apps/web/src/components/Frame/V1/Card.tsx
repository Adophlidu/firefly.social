import type { SocialSource } from '@dimensiondev/enums';
import { ActionType } from '@dimensiondev/enums';
import { useRef } from 'react';

import { FootnoteLink } from '@/components/FootnoteLink.js';
import { Button } from '@/components/Frame/V1/Button.js';
import { Input } from '@/components/Frame/V1/Input.js';
import { Image } from '@/components/Image.js';
import { openLoginModalWithGuard } from '@/controllers/openLoginModal.js';
import { getSessionFromStorageBySource } from '@/helpers/getSessionFromStorage.js';
import type { FrameButton, FrameV1 } from '@/types/frame.js';

interface CardProps {
    frame: FrameV1;
    source: SocialSource;
    readonly?: boolean;
    loading?: boolean;
    onButtonClick?: (button: FrameButton, input?: string) => Promise<void>;
}

export function Card({ frame, source, readonly = false, loading = false, onButtonClick }: CardProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="mt-4 flex flex-col" data-prevent-progress="true">
            <div
                className="w-full rounded-xl border border-line bg-bg p-2 text-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative w-full">
                    {loading ? (
                        <div className="absolute inset-0 z-10 overflow-hidden rounded-xl bg-white shadow-primary backdrop-blur-sm dark:bg-bg" />
                    ) : null}
                    <Image
                        className="divider aspect-2 w-full rounded-xl object-cover"
                        style={{
                            aspectRatio: frame.aspectRatio?.replace(':', ' / '),
                        }}
                        unoptimized
                        priority={false}
                        src={frame.image.url}
                        alt={frame.image.alt ?? frame.title}
                        width={frame.image.width}
                        height={frame.image.height}
                    />
                </div>
                {frame.input ? (
                    <div className="mt-2 flex">
                        <Input input={frame.input} ref={inputRef} />
                    </div>
                ) : null}
                {frame.buttons.length ? (
                    <div className="mt-2 flex gap-2">
                        {frame.buttons.map((button) => (
                            <Button
                                key={button.index}
                                button={button}
                                disabled={loading || readonly}
                                onClick={async () => {
                                    if (readonly || loading) return;

                                    if (button.action === ActionType.Post) {
                                        const session = getSessionFromStorageBySource(source);
                                        if (!session) {
                                            openLoginModalWithGuard({ source });
                                            return;
                                        }
                                    }

                                    const inputText = inputRef.current?.value;
                                    // there is only one input field in the frame
                                    // when a new frame arrives, clear the input field
                                    if (inputRef.current) inputRef.current.value = '';

                                    await onButtonClick?.(button, inputText);
                                }}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
            <FootnoteLink href={frame.url} />
        </div>
    );
}
