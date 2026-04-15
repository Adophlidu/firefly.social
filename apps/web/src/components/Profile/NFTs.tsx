'use client';

import { isSameAddress } from '@dimensiondev/web3/utils';
import { Trans } from '@lingui/react/macro';
import { useState } from 'react';

import { NFTListByContract } from '@/components/CollectionDetail/NFTListByContract.js';
import { UndoButton } from '@/components/IconButton.js';
import { Image } from '@/components/Image.js';
import { NFTCollectionList } from '@/components/Profile/NFTCollectionList.js';
import { POAPList } from '@/components/Profile/POAPList.js';
import { useWalletMixAddresses } from '@/components/Profile/useWalletMixAddresses.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/static.js';
import type { EVM } from '@/providers/nftscan/types.js';
import type { EthereumChainId } from '@/web3-shared/evm/types.js';

interface SelectedCollection {
    chainId: EthereumChainId;
    collectionId: string;
    collection: EVM.CollectionBasics;
}

export function ProfileNFTs({ address, ...rest }: { address: string; addresses?: string[] }) {
    const mixAddresses = useWalletMixAddresses(address);
    const addresses = rest.addresses || mixAddresses;
    const [selectedCollection, setSelectedCollection] = useState<SelectedCollection | null>(null);

    return (
        <div className="px-3 py-2">
            {selectedCollection ? (
                <>
                    <div className="mb-2 flex flex-row items-center">
                        <UndoButton
                            className="bg-lightBg mr-2 rounded-full p-2"
                            tooltip={<Trans>Back</Trans>}
                            onClick={() => setSelectedCollection(null)}
                        />
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
                    {isSameAddress(selectedCollection.collection.contract_address, POAP_CONTRACT_ADDRESS) ? (
                        <POAPList address={address} />
                    ) : (
                        <NFTListByContract
                            contract={selectedCollection.collection.contract_address}
                            owner={address}
                            chainId={selectedCollection.chainId}
                        />
                    )}
                </>
            ) : (
                <NFTCollectionList
                    addresses={addresses}
                    address={address}
                    onClickCollection={(chainId, collectionId, collection) => {
                        setSelectedCollection({ chainId, collectionId, collection });
                    }}
                />
            )}
        </div>
    );
}
