import { delay } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { ArticleCollect } from '@/components/Article/ArticleCollect.js';
import { CloseButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { stopEvent } from '@/helpers/stopEvent.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import {
    type CollectArticleModalOpenProps,
    type CollectArticleModalRefType,
} from '@/modals/CollectArticleModal/refs.js';

interface Props {
    ref: React.Ref<CollectArticleModalRefType>;
}

export function CollectArticleModal({ ref }: Props) {
    const [props, setProps] = useState<CollectArticleModalOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps(props);
        },
        onClose: async () => {
            await delay(300);
            setProps(undefined);
        },
    });

    return (
        <Modal onClose={() => dispatch?.close()} open={open}>
            <div
                className="bg-lightBottom shadow-popover dark:bg-darkBottom relative w-[432px] max-w-[90vw] rounded-xl transition-all dark:text-gray-950"
                onClick={stopEvent}
            >
                <div className="inline-flex w-full items-center justify-center gap-2 rounded-t-[12px] p-6">
                    <CloseButton
                        onClick={() => {
                            dispatch?.close();
                        }}
                    />
                    <div className="text-main shrink grow basis-0 text-center text-lg font-bold leading-snug">
                        <Trans>Collect Article</Trans>
                    </div>
                    <div className="relative size-6" />
                </div>

                {props?.article ? <ArticleCollect article={props.article} /> : null}
            </div>
        </Modal>
    );
}
