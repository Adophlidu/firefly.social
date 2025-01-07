import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { t } from '@lingui/core/macro';
import { Theme } from 'emoji-picker-react';
import { $getRoot, $getSelection } from 'lexical';
import { memo, useState } from 'react';

import EmojiIcon from '@/assets/emoji.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
import { Tooltip } from '@/components/Tooltip.js';
import { EmojiPicker } from '@/esm/EmojiPicker.js';
import { writeChars } from '@/helpers/chars.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export const EmojiAction = memo(function EmojiAction() {
    const isMedium = useIsMedium();
    const isDarkMode = useIsDarkMode();

    const [open, setOpen] = useState(false);

    const [editor] = useLexicalComposerContext();
    const { updateChars } = useComposeStateStore();
    const buttonContent = (
        <Tooltip content={t`Emoji`} placement="top">
            <EmojiIcon className="cursor-pointer text-main" width={24} height={24} />
        </Tooltip>
    );

    if (isMedium) {
        return (
            <Popover as="div" className="relative">
                <PopoverButton className="flex cursor-pointer">{buttonContent}</PopoverButton>
                <PopoverPanel portal modal unmount={false} anchor="top">
                    <EmojiPicker
                        skinTonesDisabled
                        lazyLoadEmojis
                        previewConfig={{ showPreview: false }}
                        height={300}
                        theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
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
                </PopoverPanel>
            </Popover>
        );
    }
    return (
        <>
            <ClickableButton
                className="flex items-center gap-1 text-main focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setOpen(true)}
            >
                {buttonContent}
            </ClickableButton>
            <PopoverModal open={open} onClose={() => setOpen(false)}>
                <EmojiPicker
                    skinTonesDisabled
                    lazyLoadEmojis
                    previewConfig={{ showPreview: false }}
                    height={300}
                    width={277}
                    className="!border-none"
                    theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
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
            </PopoverModal>
        </>
    );
});
