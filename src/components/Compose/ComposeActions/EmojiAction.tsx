import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Trans } from '@lingui/react/macro';
import type { Theme } from 'emoji-picker-react';
import { $getRoot, $getSelection } from 'lexical';
import { memo, useState } from 'react';

import EmojiIcon from '@/assets/emoji.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { EmojiPickerPlaceholder } from '@/components/Compose/ComposeActions/EmojiPickerPlaceholder.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
import { Tooltip } from '@/components/Tooltip.js';
import { dynamic } from '@/esm/dynamic.js';
import { Tippy } from '@/esm/Tippy.js';
import { writeChars } from '@/helpers/chars.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useStateStable } from '@/hooks/useStateStable.js';
import { captureEmojiClickEvent } from '@/providers/telemetry/captureClickEvent.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

const DynamicEmojiPicker = dynamic(() => import('@/esm/EmojiPicker.js').then((m) => m.EmojiPicker), {
    ssr: false,
    loading: () => <EmojiPickerPlaceholder />,
});

export const EmojiAction = memo(function EmojiAction() {
    const isMedium = useIsMedium();
    const isDarkMode = useIsDarkMode();

    const [open, setOpen] = useState(false);
    const [opened] = useStateStable(open);

    const [editor] = useLexicalComposerContext();
    const { updateChars } = useComposeStateStore();

    const buttonContent = (
        <Tooltip content={<Trans>Emoji</Trans>} placement="top">
            <EmojiIcon className="cursor-pointer text-main" width={24} height={24} />
        </Tooltip>
    );

    const theme = (isDarkMode ? 'dark' : 'light') as Theme;

    if (isMedium) {
        return (
            <Tippy
                visible={open}
                onClickOutside={() => setOpen(false)}
                content={
                    opened ? (
                        <DynamicEmojiPicker
                            skinTonesDisabled
                            previewConfig={{ showPreview: false }}
                            height={300}
                            theme={theme}
                            onEmojiClick={({ emoji }) => {
                                editor.update(() => {
                                    const selection = $getSelection();
                                    if (!selection) {
                                        const root = $getRoot();
                                        root.selectEnd();

                                        const selection = $getSelection();
                                        selection?.insertText(emoji);
                                    }
                                    selection?.insertText(emoji);
                                });

                                updateChars((chars) => writeChars(chars, emoji));
                                setOpen(false);
                            }}
                        />
                    ) : (
                        <EmojiPickerPlaceholder />
                    )
                }
                placement="top"
                className="tippy-card"
                duration={200}
                arrow={false}
                interactive
                appendTo={() => document.body}
            >
                <div
                    onClick={() => {
                        setOpen(true);
                        captureEmojiClickEvent();
                    }}
                >
                    {buttonContent}
                </div>
            </Tippy>
        );
    }
    return (
        <>
            <ClickableButton
                className="flex items-center gap-1 text-main focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                    setOpen(true);
                    captureEmojiClickEvent();
                }}
            >
                {buttonContent}
            </ClickableButton>
            <PopoverModal open={open} onClose={() => setOpen(false)} dialogPanelClassName="!bg-[#222222]">
                {opened ? (
                    <DynamicEmojiPicker
                        skinTonesDisabled
                        lazyLoadEmojis
                        previewConfig={{ showPreview: false }}
                        height={300}
                        width="100%"
                        className="!border-none"
                        theme={theme}
                        onEmojiClick={({ emoji }) => {
                            editor.update(() => {
                                const selection = $getSelection();
                                if (!selection) {
                                    const root = $getRoot();
                                    root.selectEnd();

                                    const selection = $getSelection();
                                    selection?.insertText(emoji);
                                }
                                selection?.insertText(emoji);
                            });

                            updateChars((chars) => writeChars(chars, emoji));
                        }}
                    />
                ) : (
                    <EmojiPickerPlaceholder />
                )}
            </PopoverModal>
        </>
    );
});
