import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { Tooltip } from '@/components/Tooltip.js';
import { LaunchTokenModalRef } from '@/modals/controls.js';
import { $getRoot, $getSelection } from 'lexical';
import { useComposeStateStore } from '@/store/useComposeStore.js';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { t } from '@lingui/core/macro';
import { memo } from 'react';

export const LaunchTokenAction = memo(function LaunchTokenAction() {
    const [editor] = useLexicalComposerContext();
    const { updateChars } = useComposeStateStore();

    const openLaunchTokenModal = () => {
        LaunchTokenModalRef.open({
            onConfirm({ name, symbol, address }) {
                const text = `@rockets_fun_bot launch a token ${name} (${symbol}) for my $BnB address ${address}`;

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
        <Tooltip content={t`Launch Token`}>
            <ClickableButton onClick={openLaunchTokenModal}>
                <Image
                    alt=""
                    src={new URL('../../../assets/rocket-fun.png', import.meta.url).href}
                    width={24}
                    height={24}
                />
            </ClickableButton>
        </Tooltip>
    );
});
