import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import LinkIcon from '@/assets/link-square.svg';
import { ClickableButton } from '@/components/ClickableButton.js';
import { Image } from '@/components/Image.js';
import { EVMExplorerResolver } from '@/mask/index.js';
import type { NonFungibleCollection } from '@/mask_pkgs/web3-shared/base/index.js';

export interface Collection
    extends Pick<
        NonFungibleCollection<number, unknown>,
        'chainId' | 'address' | 'name' | 'iconURL' | 'ownersTotal' | 'id'
    > {
    custom?: boolean;
}

interface CollectionProps {
    collection: Collection;
}
export function CollectionItem({ collection }: CollectionProps) {
    const link = EVMExplorerResolver.addressLink(collection.chainId, collection.address!);
    return (
        <ClickableButton
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 font-bold text-lightMain"
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
                        <span className="ml-2.5 inline-block h-5 rounded bg-lightBg px-2 text-xs font-medium leading-5 text-second">
                            <Trans>Added</Trans>
                        </span>
                    ) : null}
                    <br />
                    {collection.ownersTotal ? (
                        <span className="text-[13px] text-second">{t`${collection.ownersTotal} items`}</span>
                    ) : null}
                </div>
            </div>
            <a href={link} target="_blank" className="ml-1 inline-block" onClick={(e) => e.stopPropagation()}>
                <LinkIcon className="size-5" />
            </a>
        </ClickableButton>
    );
}
