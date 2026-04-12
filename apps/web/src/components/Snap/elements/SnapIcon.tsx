/* cspell:disable */

'use client';

import { classNames } from '@dimensiondev/utils';
import {
    ArrowDownIcon,
    ArrowDownTrayIcon,
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowRightIcon,
    ArrowTopRightOnSquareIcon,
    ArrowUpIcon,
    ArrowUpTrayIcon,
    BanknotesIcon,
    BellIcon,
    BoltIcon,
    CalendarIcon,
    ChartBarIcon,
    ChatBubbleOvalLeftIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ClipboardIcon,
    ClockIcon,
    Cog6ToothIcon,
    ExclamationTriangleIcon,
    FireIcon,
    GiftIcon,
    GlobeAltIcon,
    HandThumbDownIcon,
    HandThumbUpIcon,
    HeartIcon,
    InformationCircleIcon,
    LinkIcon,
    LockClosedIcon,
    LockOpenIcon,
    MagnifyingGlassIcon,
    MinusIcon,
    PencilIcon,
    PlusIcon,
    ShareIcon,
    StarIcon,
    TrashIcon,
    TrophyIcon,
    UserIcon,
    UsersIcon,
    WalletIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType } from 'react';

import { ACCENT_TEXT_MAP, useSnapContext } from '@/components/Snap/SnapContext.js';
import type { SnapAccentColor, SnapIconProps } from '@/types/snap.js';

function iconTextClass(color: SnapIconProps['color'], themeAccent: SnapAccentColor): string {
    if (!color) return 'text-secondary';
    if (color === 'inherit') return 'text-inherit';
    if (color === 'accent') return ACCENT_TEXT_MAP[themeAccent];
    return ACCENT_TEXT_MAP[color];
}

const SIZE_PX: Record<NonNullable<SnapIconProps['size']>, number> = { sm: 16, md: 24 };

type SvgIcon = ComponentType<{ width?: number; height?: number }>;

// Curated icon name → Heroicon component. Resolved once at module load.
// The Farcaster snap icon set will be resolved by the client in native apps;
// on web we render a matching Heroicon as a graceful fallback.
const ICON_MAP: Record<string, SvgIcon> = {
    'thumbs-up': HandThumbUpIcon,
    'thumbs-down': HandThumbDownIcon,
    'refresh-cw': ArrowPathIcon,
    'external-link': ArrowTopRightOnSquareIcon,
    'message-circle': ChatBubbleOvalLeftIcon,
    coins: BanknotesIcon,
    star: StarIcon,
    heart: HeartIcon,
    fire: FireIcon,
    check: CheckIcon,
    x: XMarkIcon,
    plus: PlusIcon,
    minus: MinusIcon,
    flame: FireIcon,
    trophy: TrophyIcon,
    clock: ClockIcon,
    calendar: CalendarIcon,
    lock: LockClosedIcon,
    unlock: LockOpenIcon,
    wallet: WalletIcon,
    chart: ChartBarIcon,
    gift: GiftIcon,
    bell: BellIcon,
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
    error: XMarkIcon,
    success: CheckIcon,
    user: UserIcon,
    users: UsersIcon,
    globe: GlobeAltIcon,
    link: LinkIcon,
    share: ShareIcon,
    search: MagnifyingGlassIcon,
    settings: Cog6ToothIcon,
    edit: PencilIcon,
    trash: TrashIcon,
    copy: ClipboardIcon,
    download: ArrowDownTrayIcon,
    upload: ArrowUpTrayIcon,
    zap: BoltIcon,
    'arrow-up': ArrowUpIcon,
    'arrow-down': ArrowDownIcon,
    'arrow-left': ArrowLeftIcon,
    'arrow-right': ArrowRightIcon,
    'chevron-right': ChevronRightIcon,
    'chevron-left': ChevronLeftIcon,
    'chevron-up': ChevronUpIcon,
    'chevron-down': ChevronDownIcon,
};

function Icon({ name, px = 24 }: { name: string; px?: number }) {
    const IconComponent = ICON_MAP[name];
    if (!IconComponent) return <>{name.slice(0, 2)}</>;
    return <IconComponent width={px} height={px} />;
}

interface Props {
    props: SnapIconProps;
}

export function SnapIcon({ props: { name, size = 'md', color } }: Props) {
    const { accent } = useSnapContext();
    return (
        <span
            className={classNames('inline-flex items-center justify-center text-base', iconTextClass(color, accent))}
            aria-label={name}
        >
            <Icon name={name} px={SIZE_PX[size]} />
        </span>
    );
}
