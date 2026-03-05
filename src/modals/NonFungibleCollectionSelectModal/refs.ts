import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type Collection } from '@/modals/NonFungibleCollectionSelectModal/CollectionItem.js';

export interface NonFungibleCollectionSelectModalOpenProps {
    selected?: Collection | Collection[];
    initialAddTokenChainId?: number;
}

export type NonFungibleCollectionSelectModalCloseProps = Collection | null;

export type NonFungibleCollectionSelectModalRefType = SingletonModalRefCreator<
    NonFungibleCollectionSelectModalOpenProps,
    NonFungibleCollectionSelectModalCloseProps
>;

export const NonFungibleTokenCollectionSelectModalRef = new SingletonModal<
    NonFungibleCollectionSelectModalOpenProps,
    NonFungibleCollectionSelectModalCloseProps
>();
