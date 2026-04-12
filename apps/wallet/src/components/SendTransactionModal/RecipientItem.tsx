import LinkIcon from '@dimensiondev/assets/link-square.svg';
import WalletIcon from '@dimensiondev/assets/wallet.fill.svg';
import { omitBy } from 'lodash-es';
import type { HTMLProps, ReactNode } from 'react';

import { Image } from '@/components/Image.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import type { SocialSource } from '@/constants/enum.js';
import { EthereumChainId } from '@/constants/ethereum.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { getBlockExplorersURL } from '@/helpers/getBlockExplorersURL.js';
import { cn } from '@/lib/utils.js';

export interface RecipientItemProps extends Pick<HTMLProps<'div'>, 'className'> {
    address: string;
    avatar?: string;
    ens?: string;
    sources?: SocialSource[];
    source?: SocialSource;
    handle?: string;
    username?: string;
    explorerLink?: boolean;
    showSources?: boolean;
    fireflyId?: string;
    id?: string;
    forceAddress?: boolean;
    tags?: ReactNode[];
}

export function RecipientItem({
    address,
    avatar,
    ens,
    sources,
    source,
    handle,
    username,
    className,
    explorerLink,
    showSources = false,
    forceAddress = false,
    tags,
    ...props
}: RecipientItemProps) {
    return (
        <div className={cn('flex w-full flex-row text-left', className)} {...props}>
            <div className="relative mr-3 size-9">
                {(!forceAddress || ens) && avatar ? (
                    <Image src={avatar} alt={address} width={36} height={36} className="size-9 rounded-full" />
                ) : (
                    <div className="border-line2 bg-primaryBottom flex size-9 items-center justify-center rounded-lg border">
                        <WalletIcon width={24} height={24} className="text-third" />
                    </div>
                )}
                {!forceAddress && source ? (
                    <SocialSourceIcon
                        source={source}
                        size={15}
                        className="border-primaryBottom absolute -right-2 bottom-0 z-10 rounded-full border"
                    />
                ) : null}
            </div>
            {forceAddress || (!username && !ens) ? (
                <div className="flex w-full flex-1 flex-col items-center justify-center space-y-1 text-[13px]">
                    {forceAddress && ens ? (
                        <>
                            <div className="w-full truncate pr-3 font-bold leading-[18px]">{ens}</div>
                            <div className="text-second w-full truncate pr-3 leading-[14px]">
                                {formatAddress(address, 6)}
                            </div>
                        </>
                    ) : (
                        <div
                            className={cn(
                                'w-full pr-3 font-bold leading-[18px]',
                                tags?.length ? 'truncate' : 'line-clamp-2 whitespace-pre-wrap break-all',
                            )}
                        >
                            {tags?.length ? formatAddress(address, 6) : address}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-1 flex-col items-start space-y-1 text-[13px]">
                    <div className="h-[18px] truncate font-bold leading-[18px]">{username || ens}</div>
                    <div className="text-second h-3.5 leading-[14px]">
                        {handle ? `@${handle}` : formatAddress(address, 4)}
                    </div>
                </div>
            )}
            <div className="ml-auto flex items-center space-x-2">
                {tags?.length ? (
                    <div className="flex items-center space-x-1">
                        {tags.map((tag, index) => (
                            <div
                                key={index}
                                className="bg-walletBg text-highlight flex h-6 items-center whitespace-nowrap rounded px-2 text-[13px] font-medium leading-6"
                            >
                                {tag}
                            </div>
                        ))}
                    </div>
                ) : null}
                {!forceAddress && showSources && sources?.length ? (
                    <div className="flex flex-row items-center -space-x-1">
                        {sources?.map((source) => (
                            <SocialSourceIcon
                                source={source}
                                key={source}
                                width={20}
                                height={20}
                                className="shrink-0"
                            />
                        ))}
                    </div>
                ) : explorerLink ? (
                    <ExplorerLink address={address} />
                ) : null}
            </div>
        </div>
    );
}

function ExplorerLink({ address }: { address: string }) {
    const link = getBlockExplorersURL(EthereumChainId.Mainnet, address, 'address');
    if (!link) return null;
    return (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-second my-auto ml-auto">
            <LinkIcon width={20} height={20} />
        </a>
    );
}

export function isOnlyAddress(recipient: RecipientItemProps) {
    return Object.keys(omitBy(recipient, (x) => x === undefined || x === null)).length === 1 && 'address' in recipient;
}

export function isSocialRecipient(recipient: RecipientItemProps | undefined) {
    return !!recipient?.source;
}
