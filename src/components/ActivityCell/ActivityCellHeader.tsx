import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, type ReactNode } from 'react';
import { type Address } from 'viem';

import { ConditionalLink } from '@/components/ConditionalLink.js';
import { EnsName } from '@/components/Profile/EnsName.js';
import { Time } from '@/components/Semantic/Time.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { Source } from '@/constants/enum.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';

export interface ActivityCellHeaderProps extends HTMLProps<HTMLDivElement> {
    address?: Address | null;
    displayName?: ReactNode;
    username?: ReactNode;
    time?: number | string | Date | null;
    icon?: ReactNode;
    authorUrl?: string | null;
    target?: string;
    onClickLink?: () => void;
}

export function ActivityCellHeader({
    address,
    displayName,
    username,
    time,
    icon,
    authorUrl: externalAuthorUrl,
    target,
    className,
    children,
    onClickLink,
    ...rest
}: ActivityCellHeaderProps) {
    const authorUrl =
        externalAuthorUrl ?? (address ? getProfileUrl({ source: Source.Wallet, profileId: address }) : null);
    const addressText = address ? formatAddressEthereum(address, 4) : '';
    const mainContent = displayName || addressText;

    return (
        <div className={classNames('flex items-start gap-3', className)} {...rest}>
            <div className="flex flex-1 grow flex-row items-center truncate text-[15px] leading-6 max-md:max-w-[calc(100%_-_56px)]">
                <ConditionalLink
                    href={authorUrl}
                    className="block max-w-full truncate font-bold text-main"
                    target={target}
                    onClick={onClickLink}
                >
                    {displayName && typeof displayName === 'string' ? <EnsName ens={displayName} /> : mainContent}
                </ConditionalLink>

                {displayName ? (
                    <ConditionalLink
                        href={authorUrl}
                        className="ml-2 block min-w-0 max-w-full truncate text-secondary max-md:hidden"
                        target={target}
                        onClick={onClickLink}
                    >
                        {username ? <>@{username}</> : <address className="truncate not-italic">{addressText}</address>}
                    </ConditionalLink>
                ) : null}

                {time ? (
                    <Time dateTime={time} className="mx-1 whitespace-nowrap text-secondary">
                        · <TimestampFormatter time={time} />
                    </Time>
                ) : null}

                {icon ? <span className="mx-1"> · </span> : null}
                {icon}
            </div>

            <div className="flex shrink-0 items-center space-x-2">{children}</div>
        </div>
    );
}
