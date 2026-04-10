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

import { ACCENT_TEXT_MAP, useSnapContext } from '@/components/Snap/SnapContext.js';
import { type SnapAccentColor, type SnapIconProps } from '@/types/snap.js';

function iconTextClass(color: SnapIconProps['color'], themeAccent: SnapAccentColor): string {
    if (!color) return 'text-secondary';
    if (color === 'inherit') return 'text-inherit';
    if (color === 'accent') return ACCENT_TEXT_MAP[themeAccent];
    return ACCENT_TEXT_MAP[color];
}

const SIZE_PX: Record<NonNullable<SnapIconProps['size']>, number> = { sm: 16, md: 24 };

// Curated icon name → Unicode emoji fallback for unsupported icons
// The Farcaster snap icon set will be resolved by the client in native apps;
// on web we render a small text label as a graceful fallback.
function Icon({ name, px = 24 }: { name: string; px?: number }) {
    const ICON_EMOJI_MAP: Record<string, React.ReactNode> = {
        'thumbs-up': <HandThumbUpIcon width={px} height={px} />,
        'thumbs-down': <HandThumbDownIcon width={px} height={px} />,
        'refresh-cw': <ArrowPathIcon width={px} height={px} />,
        'external-link': <ArrowTopRightOnSquareIcon width={px} height={px} />,
        'message-circle': <ChatBubbleOvalLeftIcon width={px} height={px} />,
        coins: <BanknotesIcon width={px} height={px} />,
        star: <StarIcon width={px} height={px} />,
        heart: <HeartIcon width={px} height={px} />,
        fire: <FireIcon width={px} height={px} />,
        check: <CheckIcon width={px} height={px} />,
        x: <XMarkIcon width={px} height={px} />,
        plus: <PlusIcon width={px} height={px} />,
        minus: <MinusIcon width={px} height={px} />,
        flame: <FireIcon width={px} height={px} />,
        trophy: <TrophyIcon width={px} height={px} />,
        clock: <ClockIcon width={px} height={px} />,
        calendar: <CalendarIcon width={px} height={px} />,
        lock: <LockClosedIcon width={px} height={px} />,
        unlock: <LockOpenIcon width={px} height={px} />,
        wallet: <WalletIcon width={px} height={px} />,
        chart: <ChartBarIcon width={px} height={px} />,
        gift: <GiftIcon width={px} height={px} />,
        bell: <BellIcon width={px} height={px} />,
        info: <InformationCircleIcon width={px} height={px} />,
        warning: <ExclamationTriangleIcon width={px} height={px} />,
        error: <XMarkIcon width={px} height={px} />,
        success: <CheckIcon width={px} height={px} />,
        user: <UserIcon width={px} height={px} />,
        users: <UsersIcon width={px} height={px} />,
        globe: <GlobeAltIcon width={px} height={px} />,
        link: <LinkIcon width={px} height={px} />,
        share: <ShareIcon width={px} height={px} />,
        search: <MagnifyingGlassIcon width={px} height={px} />,
        settings: <Cog6ToothIcon width={px} height={px} />,
        edit: <PencilIcon width={px} height={px} />,
        trash: <TrashIcon width={px} height={px} />,
        copy: <ClipboardIcon width={px} height={px} />,
        download: <ArrowDownTrayIcon width={px} height={px} />,
        upload: <ArrowUpTrayIcon width={px} height={px} />,
        zap: <BoltIcon width={px} height={px} />,
        'arrow-up': <ArrowUpIcon width={px} height={px} />,
        'arrow-down': <ArrowDownIcon width={px} height={px} />,
        'arrow-left': <ArrowLeftIcon width={px} height={px} />,
        'arrow-right': <ArrowRightIcon width={px} height={px} />,
        'chevron-right': <ChevronRightIcon width={px} height={px} />,
        'chevron-left': <ChevronLeftIcon width={px} height={px} />,
        'chevron-up': <ChevronUpIcon width={px} height={px} />,
        'chevron-down': <ChevronDownIcon width={px} height={px} />,
    };

    const emoji = ICON_EMOJI_MAP[name];
    return <>{emoji ?? name.slice(0, 2)}</>;
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
