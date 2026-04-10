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

// Curated icon name → Unicode emoji fallback for unsupported icons
// The Farcaster snap icon set will be resolved by the client in native apps;
// on web we render a small text label as a graceful fallback.
function Icon({ name, width = 20, height = 20 }: Pick<SnapIconProps, 'name' | 'width' | 'height'>) {
    const ICON_EMOJI_MAP: Record<string, React.ReactNode> = {
        'thumbs-up': <HandThumbUpIcon width={width} height={height} />,
        'thumbs-down': <HandThumbDownIcon width={width} height={height} />,
        'refresh-cw': <ArrowPathIcon width={width} height={height} />,
        'external-link': <ArrowTopRightOnSquareIcon width={width} height={height} />,
        'message-circle': <ChatBubbleOvalLeftIcon width={width} height={height} />,
        coins: <BanknotesIcon width={width} height={height} />,
        star: <StarIcon width={width} height={height} />,
        heart: <HeartIcon width={width} height={height} />,
        fire: <FireIcon width={width} height={height} />,
        check: <CheckIcon width={width} height={height} />,
        x: <XMarkIcon width={width} height={height} />,
        plus: <PlusIcon width={width} height={height} />,
        minus: <MinusIcon width={width} height={height} />,
        flame: <FireIcon width={width} height={height} />,
        trophy: <TrophyIcon width={width} height={height} />,
        clock: <ClockIcon width={width} height={height} />,
        calendar: <CalendarIcon width={width} height={height} />,
        lock: <LockClosedIcon width={width} height={height} />,
        unlock: <LockOpenIcon width={width} height={height} />,
        wallet: <WalletIcon width={width} height={height} />,
        chart: <ChartBarIcon width={width} height={height} />,
        gift: <GiftIcon width={width} height={height} />,
        bell: <BellIcon width={width} height={height} />,
        info: <InformationCircleIcon width={width} height={height} />,
        warning: <ExclamationTriangleIcon width={width} height={height} />,
        error: <XMarkIcon width={width} height={height} />,
        success: <CheckIcon width={width} height={height} />,
        user: <UserIcon width={width} height={height} />,
        users: <UsersIcon width={width} height={height} />,
        globe: <GlobeAltIcon width={width} height={height} />,
        link: <LinkIcon width={width} height={height} />,
        share: <ShareIcon width={width} height={height} />,
        search: <MagnifyingGlassIcon width={width} height={height} />,
        settings: <Cog6ToothIcon width={width} height={height} />,
        edit: <PencilIcon width={width} height={height} />,
        trash: <TrashIcon width={width} height={height} />,
        copy: <ClipboardIcon width={width} height={height} />,
        download: <ArrowDownTrayIcon width={width} height={height} />,
        upload: <ArrowUpTrayIcon width={width} height={height} />,
        zap: <BoltIcon width={width} height={height} />,
        'arrow-up': <ArrowUpIcon width={width} height={height} />,
        'arrow-down': <ArrowDownIcon width={width} height={height} />,
        'arrow-left': <ArrowLeftIcon width={width} height={height} />,
        'arrow-right': <ArrowRightIcon width={width} height={height} />,
        'chevron-right': <ChevronRightIcon width={width} height={height} />,
        'chevron-left': <ChevronLeftIcon width={width} height={height} />,
        'chevron-up': <ChevronUpIcon width={width} height={height} />,
        'chevron-down': <ChevronDownIcon width={width} height={height} />,
    };

    const emoji = ICON_EMOJI_MAP[name];
    return <>{emoji ?? name.slice(0, 2)}</>;
}

interface Props {
    props: SnapIconProps;
}

export function SnapIcon({ props: { name, width = 20, height = 20, color } }: Props) {
    const { accent } = useSnapContext();
    return (
        <span
            className={classNames('inline-flex items-center justify-center text-base', iconTextClass(color, accent))}
            aria-label={name}
        >
            <Icon name={name} width={width} height={height} />
        </span>
    );
}
