'use client';

import { DialogTitle } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';
import { forwardRef, useCallback, useState } from 'react';

import AddIcon from '@/assets/add.svg';
import LeftArrowIcon from '@/assets/left-arrow.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Modal } from '@/components/Modal.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { useSingletonModal } from '@/hooks/useSingletonModal.js';
import type { SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { AddCustomERC721ModalRef } from '@/modals/controls.js';
import type { Collection } from '@/modals/NonFungibleCollectionSelectModal/CollectionItem.js';
import { NonFungibleCollectionSelectPanel } from '@/modals/NonFungibleCollectionSelectModal/NoFungibleTokenSelectPanel.js';

export interface NonFungibleCollectionSelectModalOpenProps {
    selected?: Collection | Collection[];
}

export type NonFungibleCollectionSelectModalCloseProps = Collection | null;

export const NonFungibleCollectionSelectModal = forwardRef<
    SingletonModalRefCreator<NonFungibleCollectionSelectModalOpenProps, NonFungibleCollectionSelectModalCloseProps>
>(function NonFungibleCollectionSelectModal(_, ref) {
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

    if (!props) return null;

    return (
        <Modal open={open} onClose={() => dispatch?.close(null)} dialogClassName="z-50">
            <div className="z-50 flex h-[70vh] w-4/5 flex-col rounded-md bg-lightBottom p-4 pt-0 text-medium text-lightMain shadow-popover transition-all dark:bg-darkBottom md:h-[620px] md:w-[600px] md:rounded-xl">
                <DialogTitle as="h3" className="relative h-14 shrink-0 pt-safe">
                    <LeftArrowIcon
                        onClick={() => dispatch?.close(null)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer text-main"
                    />
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-main">
                        <Trans>Select Collection</Trans>
                    </span>
                    <ClickableButton
                        className="text-md absolute right-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center space-x-2 text-main"
                        onClick={() => {
                            AddCustomERC721ModalRef.open();
                        }}
                    >
                        <AddIcon width={20} height={20} className="h-5 w-5 shrink-0" />
                        <span>
                            <Trans>Add</Trans>
                        </span>
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
});
