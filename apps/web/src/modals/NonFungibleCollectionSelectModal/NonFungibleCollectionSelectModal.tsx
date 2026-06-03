'use client';

import AddIcon from '@dimensiondev/assets/add-circle.svg';
import { isSameEthereumAddress } from '@dimensiondev/web3/utils';
import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { type Ref, useCallback, useState } from 'react';
import { useChainId } from 'wagmi';

import { ClickableButton } from '@/components/ClickableButton.js';
import { BackButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { openAddCustomERC721Modal } from '@/controllers/openAddCustomERC721Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { Collection } from '@/modals/NonFungibleCollectionSelectModal/CollectionItem.js';
import type {
    NonFungibleCollectionSelectModalOpenProps,
    NonFungibleCollectionSelectModalRefType,
} from '@/modals/NonFungibleCollectionSelectModal/refs.js';

interface Props {
    ref: Ref<NonFungibleCollectionSelectModalRefType>;
}

const NonFungibleCollectionSelectPanel = dynamic(() => import('./NonFungibleCollectionSelectPanel.js'), {
    ssr: false,
    loading: () => null,
});

export function NonFungibleCollectionSelectModal({ ref }: Props) {
    const [props, setProps] = useState<NonFungibleCollectionSelectModalOpenProps>();

    const [open, dispatch] = useSingletonModal(ref, {
        onOpen: (props) => setProps(props),
        onClose: () => setProps(undefined),
    });

    const isSelected = useCallback(
        (collection: Collection) => {
            if (!props?.selected) return false;
            const selected = props.selected;
            if (Array.isArray(selected)) {
                return selected.some(
                    (item) =>
                        item.chainId === collection.chainId && isSameEthereumAddress(item.address, collection.address),
                );
            }
            return (
                collection.chainId === selected.chainId && isSameEthereumAddress(collection.address, selected.address)
            );
        },
        [props?.selected],
    );

    const chainId = useChainId();

    if (!props) return null;

    return (
        <Modal open={open} onClose={() => dispatch?.close(null)} dialogClassName="z-50">
            <div className="z-50 flex h-[70vh] w-4/5 flex-col rounded-md bg-lightBottom p-4 pt-0 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:h-[620px] md:w-[600px] md:rounded-xl">
                <DialogTitle as="h3" className="relative h-14 shrink-0 pt-safe">
                    <BackButton
                        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                        onClick={() => dispatch?.close(null)}
                    />
                    <span className="flex size-full items-center justify-center text-lg font-bold text-main">
                        <Trans>Select Collection</Trans>
                    </span>
                    <ClickableButton
                        className="absolute right-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center space-x-2 text-main"
                        onClick={() => {
                            openAddCustomERC721Modal({
                                initialChainId: props.initialAddTokenChainId ?? chainId,
                            });
                        }}
                    >
                        <AddIcon width={24} height={24} className="size-6 shrink-0 text-highlight" />
                    </ClickableButton>
                </DialogTitle>
                <div className="min-h-0 flex-1 overflow-hidden">
                    <NonFungibleCollectionSelectPanel
                        isSelected={isSelected}
                        onSelected={(collection) => dispatch?.close(collection)}
                    />
                </div>
            </div>
        </Modal>
    );
}
