'use client';

import { t } from '@lingui/core/macro';
import { useState } from 'react';

import UndoSVG from '@/assets/undo.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { NFTListByContract } from '@/components/CollectionDetail/NFTListByContract.js';
import { Image } from '@/components/Image.js';
import { NFTCollectionList } from '@/components/Profile/NFTCollectionList.js';
import { useWalletMixAddresses } from '@/components/Profile/useWalletMixAddresses.js';
import { Tooltip } from '@/components/Tooltip.js';
import type { EVM } from '@/providers/nft-scan/types.js';
import { EthereumChainId } from '#masknet/web3-shared-evm';

interface SelectedCollection {
    chainId: EthereumChainId;
    collectionId: string;
    collection: EVM.Collection;
}

export function NFTs({ address }: { address: string }) {
    const addresses = useWalletMixAddresses(address);
    const [selectedCollection, setSelectedCollection] = useState<SelectedCollection | null>(null);

    return (
        <div className="px-3 py-2">
            {selectedCollection ? (
                <>
                    <div className="mb-2 flex flex-row items-center">
                        <ClickableButton
                            className="mr-2 rounded-full bg-lightBg p-2"
                            onClick={() => setSelectedCollection(null)}
                        >
                            <Tooltip content={t`Back`}>
                                <UndoSVG className="size-4" />
                            </Tooltip>
                        </ClickableButton>
                        {selectedCollection.collection.large_image_url ? (
                            <Image
                                className="mr-2 size-6 rounded-full object-cover"
                                src={selectedCollection.collection.large_image_url ?? ''}
                                alt={selectedCollection.collection.name}
                                width={24}
                                height={24}
                            />
                        ) : null}
                        <div className="max-w-[calc(100%-32px-24px-16px)] truncate text-base font-bold leading-5">
                            {selectedCollection.collection.name}
                        </div>
                    </div>
                    <NFTListByContract
                        contract={selectedCollection.collection.contract_address}
                        owner={address}
                        chainId={selectedCollection.chainId}
                    />
                </>
            ) : (
                <NFTCollectionList
                    addresses={addresses}
                    onClickCollection={(chainId, collectionId, collection) => {
                        setSelectedCollection({ chainId, collectionId, collection });
                    }}
                />
            )}
        </div>
    );
}
