import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { t } from '@lingui/core/macro';
import { $getRoot, $getSelection } from 'lexical';
import { memo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { Tooltip } from '@/components/Tooltip.js';
import { Source } from '@/constants/enum.js';
import { useCompositePost } from '@/hooks/useCompositePost.js';
import { LaunchTokenModalRef } from '@/modals/controls.js';
import { useComposeStateStore } from '@/store/useComposeStore.js';

export const LaunchTokenAction = memo(function LaunchTokenAction() {
    const [editor] = useLexicalComposerContext();
    const { updateChars } = useComposeStateStore();
    const { availableSources } = useCompositePost();
    const enabled = availableSources.includes(Source.Twitter);

    const openLaunchTokenModal = () => {
        if (!enabled) return;
        LaunchTokenModalRef.open({
            onConfirm({ name, symbol, address }) {
                // cspell:ignore rocketsdotfun
                const text = `@rocketsdotfun launch a token ${name} (${symbol}) for my BNB address ${address}`;

                editor.update(() => {
                    const root = $getRoot();
                    root.selectEnd();
                    const selection = $getSelection();
                    selection?.insertText(text);
                });
                updateChars(text);
            },
        });
    };
    return (
        <Tooltip content={enabled ? t`Launch Token` : t`Token launch only support on X`} placement="top">
            <ClickableButton onClick={openLaunchTokenModal} className={enabled ? '' : 'cursor-not-allowed opacity-50'}>
                <Image
                    alt=""
                    unoptimized
                    src={new URL('../../../assets/rocket-fun.png', import.meta.url).href}
                    width={24}
                    height={24}
                />
            </ClickableButton>
        </Tooltip>
    );
});
