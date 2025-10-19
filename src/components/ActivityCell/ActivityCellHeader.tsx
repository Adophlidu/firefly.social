import type { HTMLProps, ReactNode } from 'react';
import type { Address } from 'viem';

import { Link } from '@/components/Link.js';
import { Time } from '@/components/Semantic/Time.js';
import { TimestampFormatter } from '@/components/TimeStampFormatter.js';
import { Source } from '@/constants/enum.js';
import { classNames } from '@/helpers/classNames.js';
import { formatAddressEthereum } from '@/helpers/formatAddress.js';
import { getProfileUrl } from '@/helpers/getProfileUrl.js';
import { stopPropagation } from '@/helpers/stopEvent.js';

export interface ActivityCellHeaderProps extends HTMLProps<HTMLDivElement> {
    address: Address;
    displayName?: ReactNode;
    time?: number | string | Date | null;
    icon?: ReactNode;
}

export function ActivityCellHeader({
    address,
    displayName,
    time,
    icon,
    className,
    children,
    ...rest
}: ActivityCellHeaderProps) {
    const authorUrl = getProfileUrl({ source: Source.Wallet, profileId: address });

    return (
        <header className={classNames('flex items-start gap-3', className)} {...rest}>
            <div className="flex flex-1 grow flex-row items-center truncate text-medium leading-6 max-md:max-w-[calc(100%_-_56px)]">
                <Link
                    href={authorUrl}
                    onClick={stopPropagation}
                    className="block min-w-0 max-w-full truncate font-bold text-main"
                >
                    {displayName ? displayName : formatAddressEthereum(address, 4)}
                </Link>
                {displayName ? (
                    <Link
                        href={authorUrl}
                        className="ml-2 block max-w-full shrink-0 truncate text-secondary max-md:hidden"
                    >
                        <address className="not-italic">{formatAddressEthereum(address, 4)}</address>
                    </Link>
                ) : null}
                {time ? (
                    <Time dateTime={time} className="mx-1 whitespace-nowrap text-secondary">
                        · <TimestampFormatter time={time} />
                    </Time>
                ) : null}
                {icon ? <span className="mx-1"> · </span> : null}
                {icon}
            </div>

            <div className="flex items-center space-x-2">{children}</div>
        </header>
    );
}
