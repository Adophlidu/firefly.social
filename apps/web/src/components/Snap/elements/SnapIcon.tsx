import { type SnapIconProps } from '@/types/snap.js';

// Curated icon name → Unicode emoji fallback for unsupported icons
// The Farcaster snap icon set will be resolved by the client in native apps;
// on web we render a small text label as a graceful fallback.
const ICON_EMOJI_MAP: Record<string, string> = {
    star: '⭐',
    heart: '❤️',
    fire: '🔥',
    check: '✓',
    x: '✕',
    plus: '＋',
    minus: '−',
    arrow_up: '↑',
    arrow_down: '↓',
    arrow_left: '←',
    arrow_right: '→',
    trophy: '🏆',
    clock: '🕐',
    calendar: '📅',
    lock: '🔒',
    unlock: '🔓',
    wallet: '👛',
    chart: '📊',
    gift: '🎁',
    bell: '🔔',
    info: 'ℹ',
    warning: '⚠',
    error: '✕',
    success: '✓',
    user: '👤',
    users: '👥',
    globe: '🌐',
    link: '🔗',
    share: '↗',
    search: '🔍',
    settings: '⚙',
    edit: '✏',
    trash: '🗑',
    copy: '📋',
    download: '↓',
    upload: '↑',
};

interface Props {
    props: SnapIconProps;
}

export function SnapIcon({ props: { name } }: Props) {
    const emoji = ICON_EMOJI_MAP[name];
    return (
        <span className="text-secondary inline-flex items-center justify-center text-base" aria-label={name}>
            {emoji ?? name.slice(0, 2)}
        </span>
    );
}
