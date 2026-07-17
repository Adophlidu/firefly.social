'use client';

import EmojiIcon from '@dimensiondev/assets/emoji.svg';
import { t } from '@lingui/core/macro';
import type { Theme } from 'emoji-picker-react';
import { memo, useState } from 'react';

import { EmojiPickerPlaceholder } from '@/components/Compose/ComposeActions/EmojiPickerPlaceholder.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
import { dynamic } from '@/esm/dynamic.js';
import { Tippy } from '@/esm/Tippy.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useIsMedium } from '@/hooks/useMediaQuery.js';
import { useStateStable } from '@/hooks/useStateStable.js';

const DynamicEmojiPicker = dynamic(() => import('@/esm/EmojiPicker.js').then((module) => module.EmojiPicker), {
    ssr: false,
    loading: () => <EmojiPickerPlaceholder />,
});

interface DmEmojiPickerProps {
    onSelect: (emoji: string) => void;
}

export const DmEmojiPicker = memo(function DmEmojiPicker({ onSelect }: DmEmojiPickerProps) {
    const isMedium = useIsMedium();
    const isDarkMode = useIsDarkMode();
    const [open, setOpen] = useState(false);
    const [opened] = useStateStable(open);
    const theme = (isDarkMode ? 'dark' : 'light') as Theme;
    const button = (
        <button
            type="button"
            className="grid size-8 place-items-center rounded-md hover:bg-line"
            aria-label={t`Add emoji`}
            aria-expanded={open}
            onClick={() => setOpen(true)}
        >
            <EmojiIcon width={18} height={18} viewBox="0 0 24 24" />
        </button>
    );
    const picker = opened ? (
        <DynamicEmojiPicker
            skinTonesDisabled
            lazyLoadEmojis
            previewConfig={{ showPreview: false }}
            height={300}
            width={isMedium ? 350 : '100%'}
            className="!border-none"
            theme={theme}
            onEmojiClick={({ emoji }) => {
                onSelect(emoji);
                setOpen(false);
            }}
        />
    ) : (
        <EmojiPickerPlaceholder />
    );

    if (isMedium) {
        return (
            <Tippy
                visible={open}
                content={picker}
                placement="top"
                className="tippy-card"
                duration={200}
                arrow={false}
                interactive
                appendTo={() => document.body}
                onClickOutside={() => setOpen(false)}
            >
                {button}
            </Tippy>
        );
    }

    return (
        <>
            {button}
            <PopoverModal open={open} dialogPanelClassName="!bg-[#222222]" onClose={() => setOpen(false)}>
                {picker}
            </PopoverModal>
        </>
    );
});
