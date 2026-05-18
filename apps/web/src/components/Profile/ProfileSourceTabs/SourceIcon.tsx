import { Source } from '@dimensiondev/enums';
import ArrowLineDownIcon from '@dimensiondev/assets/arrow-line-down.svg';
import DangerIcon from '@dimensiondev/assets/danger.svg';
import FireflyLogo from '@dimensiondev/assets/firefly.round.svg';
import WalletIcon from '@dimensiondev/assets/wallet-bold.svg';
import { classNames, resolveValue } from '@dimensiondev/utils';
import type { HTMLProps } from 'react';

import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import type { ProfilePageSource } from '@/constants/enum.js';

export function SourceIcon({
    source,
    size,
    danger = false,
    square = false,
    active = false,
    isMPC = false,
}: {
    source: ProfilePageSource;
    size: number;
    danger?: boolean;
    square?: boolean;
    active?: boolean;
    isMPC?: boolean;
}) {
    if (danger) return <DangerIcon width={size} height={size} className="shrink-0" />;
    size = square ? size - 2 : size;
    const icon = resolveValue(() => {
        if (source === Source.Wallet || source === Source.WalletMix) {
            if (isMPC) return <FireflyLogo width={size} height={size} className="shrink-0" />;
            return <WalletIcon width={size} height={size} className="shrink-0" />;
        }
        return <SocialSourceIcon source={source} size={size} className="shrink-0" mono />;
    });
    return square ? (
        <span
            className={classNames(
                'inline-flex shrink-0 items-center justify-center rounded duration-100',
                active
                    ? 'outline outline-[0.5px] outline-current'
                    : 'bg-main text-primaryBottom group-hover:bg-transparent group-hover:text-inherit group-hover:outline group-hover:outline-[0.5px] group-hover:outline-current',
            )}
            style={{ width: `${size + 2}px`, height: `${size + 2}px` }}
        >
            {icon}
        </span>
    ) : (
        icon
    );
}

export interface ProfileMenuItemProps extends Pick<HTMLProps<'div'>, 'className' | 'children'> {
    source: ProfilePageSource;
    danger?: boolean;
    arrow?: boolean;
    square?: boolean;
    active?: boolean;
    isMPC?: boolean;
}

export function ProfileTriggerContent({
    children,
    source,
    arrow = false,
    square = false,
    danger = false,
    active = false,
    isMPC = false,
    className,
}: ProfileMenuItemProps) {
    return (
        <span className={classNames('inline-flex w-full items-center justify-center', className)}>
            <SourceIcon source={source} size={14} square={square} danger={danger} active={active} isMPC={isMPC} />
            <span className="mx-1 min-w-0 truncate">{children}</span>
            {arrow ? <ArrowLineDownIcon width={12} height={12} className="ml-auto shrink-0" /> : null}
        </span>
    );
}
