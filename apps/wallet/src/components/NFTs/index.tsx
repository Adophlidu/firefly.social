import UndoSVG from '@dimensiondev/assets/undo.svg';
import { Trans } from '@lingui/react/macro';
import { Suspense, useState } from 'react';

import { IconButton } from '@/components/IconButton.js';
import { Image } from '@/components/Image.js';
import { LoadingPanel } from '@/components/LoadingPanel.js';
import { NFTCollectionList } from '@/components/NFTs/NFTCollectionList.js';
import { NFTListByContract } from '@/components/NFTs/NFTListByContract.js';
import { POAPList } from '@/components/NFTs/POAPList.js';
import { type EthereumChainId } from '@/constants/ethereum.js';
import { POAP_CONTRACT_ADDRESS } from '@/constants/static.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { type EVM } from '@/providers/nftscan/types.js';

interface SelectedCollection {
    chainId: EthereumChainId;
    collectionId: string;
    collection: EVM.CollectionBasics;
}

export function NFTs({ address, addresses = [address] }: { address: string; addresses?: string[] }) {
    const [selectedCollection, setSelectedCollection] = useState<SelectedCollection | null>(null);

    return (
        <div className="px-4 py-2">
            {selectedCollection ? (
                <>
                    <div className="mb-2 flex flex-row items-center">
                        <IconButton
                            tooltip={<Trans>Back</Trans>}
                            className="bg-lightBg mr-2 rounded-full p-2"
                            onClick={() => setSelectedCollection(null)}
                        >
                            <UndoSVG className="size-4" />
                        </IconButton>
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
                    <Suspense fallback={<LoadingPanel />}>
                        {isSameAddress(selectedCollection.collection.contract_address, POAP_CONTRACT_ADDRESS) ? (
                            <POAPList address={address} />
                        ) : (
                            <NFTListByContract
                                contract={selectedCollection.collection.contract_address}
                                owner={address}
                                chainId={selectedCollection.chainId}
                            />
                        )}
                    </Suspense>
                </>
            ) : null}
            {!selectedCollection ? (
                <NFTCollectionList
                    addresses={addresses}
                    address={address}
                    onClickCollection={(chainId, collectionId, collection) => {
                        setSelectedCollection({ chainId, collectionId, collection });
                    }}
                />
            ) : null}
        </div>
    );
}
