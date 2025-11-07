import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { ClickableArea } from '@/components/ClickableArea.js';
import { CloseButton } from '@/components/IconButton.js';
import { Loading } from '@/components/Loading.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { Post } from '@/providers/types/SocialMedia.js';

const PostCollect = dynamic(() => import('@/components/Posts/PostCollect.js').then((m) => m.PostCollect), {
    ssr: false,
    loading: () => <Loading minHeight={236} />,
});

interface CollectPostModalOpenProps {
    post: Post;
}
type Props = {
    ref: React.Ref<SingletonModalRefCreator<CollectPostModalOpenProps>>;
};

export function CollectPostModal({ ref }: Props) {
    const [props, setProps] = useState<CollectPostModalOpenProps>();
    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => {
            setProps({
                post: props.post,
            });
        },
    });

    return (
        <Modal disableDialogClose onClose={() => dispatch?.close()} open={open}>
            <ClickableArea className="relative w-[432px] max-w-[90vw] rounded-xl bg-lightBottom shadow-popover transition-all dark:bg-darkBottom dark:text-gray-950">
                <div className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-t-[12px] p-4">
                    <CloseButton
                        onClick={() => {
                            dispatch?.close();
                        }}
                    />
                    <div className="shrink grow basis-0 text-center text-lg font-bold leading-snug text-main">
                        <Trans>Collect Post</Trans>
                    </div>
                    <div className="relative size-6" />
                </div>
                {props?.post ? <PostCollect post={props?.post} onClose={() => dispatch?.close()} /> : null}
            </ClickableArea>
        </Modal>
    );
}

export const CollectPostModalRef = new SingletonModal<CollectPostModalOpenProps>();
