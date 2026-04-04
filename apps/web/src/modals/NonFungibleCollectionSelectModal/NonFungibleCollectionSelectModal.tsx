'use client';

import AddIcon from '@dimensiondev/assets/add-circle.svg';
import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { type Ref, useCallback, useState } from 'react';
import { useChainId } from 'wagmi';

import { ClickableButton } from '@/components/ClickableButton.js';
import { BackButton } from '@/components/IconButton.js';
import { Modal } from '@/components/Modal.js';
import { dynamic } from '@/esm/dynamic.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import { AddCustomERC721ModalRef } from '@/modals/AddCustomERC721Modal/refs.js';
import { type Collection } from '@/modals/NonFungibleCollectionSelectModal/CollectionItem.js';
import {
    type NonFungibleCollectionSelectModalOpenProps,
    type NonFungibleCollectionSelectModalRefType,
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
            <div className="bg-lightBottom text-medium text-lightMain shadow-popover dark:bg-darkBottom z-50 flex h-[70vh] w-4/5 flex-col rounded-md p-4 pt-0 transition-all md:h-[620px] md:w-[600px] md:rounded-xl">
                <DialogTitle as="h3" className="pt-safe relative h-14 shrink-0">
                    <BackButton
                        className="text-main absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => dispatch?.close(null)}
                    />
                    <span className="text-main flex size-full items-center justify-center text-lg font-bold">
                        <Trans>Select Collection</Trans>
                    </span>
                    <ClickableButton
                        className="text-main absolute right-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center space-x-2"
                        onClick={() => {
                            AddCustomERC721ModalRef.open({
                                initialChainId: props.initialAddTokenChainId ?? chainId,
                            });
                        }}
                    >
                        <AddIcon width={24} height={24} className="text-highlight size-6 shrink-0" />
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
