import LinkIcon from '@dimensiondev/assets/link-square.svg';
import { EthExplorerResolver } from '@dimensiondev/web3/resolvers';
import type { NonFungibleCollection } from '@dimensiondev/web3/types';
import { Trans } from '@lingui/react/macro';

import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';

export interface Collection
    extends Pick<NonFungibleCollection<number>, 'chainId' | 'address' | 'name' | 'iconURL' | 'ownersTotal' | 'id'> {
    custom?: boolean;
}

interface CollectionProps {
    collection: Collection;
}

export function CollectionItem({ collection }: CollectionProps) {
    const link = EthExplorerResolver.addressLink(collection.chainId, collection.address!);
    return (
        <ClickableButton
            className="text-lightMain flex w-full items-center justify-between rounded-lg px-3 py-2 font-bold"
            enablePropagate
        >
            <div className="flex items-center gap-x-2.5">
                <Image
                    alt={collection.name}
                    src={collection.iconURL!}
                    className="size-8 rounded-full object-cover"
                    height={24}
                    width={24}
                />
                <div className="text-left">
                    <span>{collection.name}</span>
                    {collection.custom ? (
                        <span className="bg-lightBg text-second ml-2.5 inline-block h-5 rounded px-2 text-xs font-medium leading-5">
                            <Trans>Added</Trans>
                        </span>
                    ) : null}
                    <br />
                    {collection.ownersTotal ? (
                        <span className="text-second text-[13px]">
                            <Trans>{collection.ownersTotal} items</Trans>
                        </span>
                    ) : null}
                </div>
            </div>
            <a href={link} target="_blank" className="ml-1 inline-block" onClick={(e) => e.stopPropagation()}>
                <LinkIcon className="size-5" />
            </a>
        </ClickableButton>
    );
}
