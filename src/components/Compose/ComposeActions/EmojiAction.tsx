import { autoUpdate, flip, offset, shift, useDismiss, useFloating, useInteractions } from '@floating-ui/react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Trans } from '@lingui/react/macro';
import { type PickerProps, Theme } from 'emoji-picker-react';
import { $getRoot, $getSelection } from 'lexical';
import { memo, useState } from 'react';
import { createPortal } from 'react-dom';

import EmojiIcon from '@/assets/emoji.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Popover as PopoverModal } from '@/components/Popover.js';
import { Tooltip } from '@/components/Tooltip.js';
import { EmojiPicker } from '@/esm/EmojiPicker.js';
import { Tippy } from '@/esm/Tippy.js';
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

    return (
        <EmojiActionUI
            isMedium={isMedium}
            isDarkMode={isDarkMode}
            open={open}
            setOpen={setOpen}
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
                if (isMedium) setOpen(false);
            }}
        />
    );
});

interface EmojiActionUIProps {
    isMedium: boolean;
    isDarkMode: boolean;
    onEmojiClick: PickerProps['onEmojiClick'];
    open: boolean;
    setOpen: (open: boolean) => void;
    old?: boolean;
}

export const EmojiActionUI = memo(function EmojiAction(props: EmojiActionUIProps) {
    const isMedium = props.isMedium;
    const isDarkMode = props.isDarkMode;

    const { open, setOpen, old = true } = props;
    const { refs, floatingStyles, context } = useFloating({
        open,
        onOpenChange: setOpen,
        placement: 'top',
        whileElementsMounted: autoUpdate,
        middleware: [offset({ mainAxis: 15, crossAxis: 10 }), shift(), flip()],
    });
    const dismiss = useDismiss(context, {
        enabled: !old,
    });
    const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

    const buttonContent = (
        <Tooltip content={<Trans>Emoji</Trans>} placement="top">
            <EmojiIcon
                className="cursor-pointer text-main"
                width={24}
                height={24}
                onClick={() => setOpen(true)}
                ref={old ? undefined : refs.setReference}
                {...(old ? undefined : getReferenceProps({ onClick: () => setOpen(true) }))}
            />
        </Tooltip>
    );

    if (isMedium) {
        const ui = (
            <EmojiPicker
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
                height={300}
                theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                onEmojiClick={props.onEmojiClick}
            />
        );
        if (!old) {
            return (
                <>
                    {buttonContent}
                    {open
                        ? createPortal(
                              <span ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                                  {ui}
                              </span>,
                              document.body,
                          )
                        : undefined}
                </>
            );
        }
        return (
            <Tippy
                visible={open}
                onClickOutside={() => setOpen(false)}
                content={ui}
                placement="top"
                className="tippy-card"
                duration={200}
                arrow={false}
                interactive
                appendTo={() => document.body}
            >
                {buttonContent}
            </Tippy>
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
                    width="100%"
                    className="!border-none"
                    theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
                    onEmojiClick={props.onEmojiClick}
                />
            </PopoverModal>
        </>
    );
});
