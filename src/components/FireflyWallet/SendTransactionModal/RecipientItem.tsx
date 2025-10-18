import { omitBy } from 'lodash-es';
import type { HTMLProps, ReactNode } from 'react';

import LinkIcon from '@/assets/link-square.svg';
import WalletIcon from '@/assets/wallet.fill.svg';
import { Avatar } from '@/components/Avatar.js';
import { Link } from '@/components/Link.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import type { SocialSource } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddress } from '@/helpers/formatAddress.js';
import { resolveExplorerLink } from '@/helpers/resolveExplorerLink.js';
import { ChainId } from '@/types/frame.js';

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
    tag?: ReactNode;
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
    tag,
    ...props
}: RecipientItemProps) {
    return (
        <div className={classNames('flex w-full flex-row text-left', className)} {...props}>
            <div className="relative mr-3 size-9">
                {!forceAddress && avatar ? (
                    <Avatar src={avatar} alt={address} size={36} />
                ) : (
                    <div className="border-line2 flex size-9 items-center justify-center rounded-lg border bg-primaryBottom">
                        <WalletIcon width={24} height={24} className="text-third" />
                    </div>
                )}
                {!forceAddress && source ? (
                    <SocialSourceIcon
                        source={source}
                        size={15}
                        className="absolute -right-2 bottom-0 z-10 rounded-full border border-primaryBottom"
                    />
                ) : null}
            </div>
            {forceAddress || (!username && !ens) ? (
                <div className="flex w-full flex-1 flex-col items-center justify-center space-y-1 text-[13px]">
                    <div className="break-word line-clamp-2 w-full whitespace-pre-wrap pr-3 font-bold leading-[18px]">
                        {address}
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 flex-col items-start space-y-1 text-[13px]">
                    <div className="h-[18px] truncate font-bold leading-[18px]">{username || ens}</div>
                    <div className="h-3.5 leading-[14px] text-second">
                        {handle ? `@${handle}` : formatAddress(address, 4)}
                    </div>
                </div>
            )}
            <div className="ml-auto flex items-center space-x-2">
                {tag ? (
                    <div className="h-6 whitespace-nowrap rounded bg-walletBg px-2 text-[13px] font-medium leading-6 text-highlight">
                        {tag}
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
    const link = resolveExplorerLink(ChainId.Ethereum, address, 'address');
    if (!link) return null;
    return (
        <Link href={link} className="my-auto ml-auto text-second">
            <LinkIcon width={20} height={20} />
        </Link>
    );
}

export function isOnlyAddress(recipient: RecipientItemProps) {
    return Object.keys(omitBy(recipient, (x) => x === undefined || x === null)).length === 1 && 'address' in recipient;
}

export function isSocialRecipient(recipient: RecipientItemProps | undefined) {
    return !!recipient?.source;
}
