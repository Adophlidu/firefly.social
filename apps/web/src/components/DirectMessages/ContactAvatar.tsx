import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

interface ContactAvatarProps {
    name: string;
    initials: string;
    avatarClassName?: string;
    avatarUrl?: string;
    isOnline?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS_NAMES = {
    sm: 'size-9 text-[11px]',
    md: 'size-12 text-sm',
    lg: 'size-14 text-base',
} as const;

export const ContactAvatar = memo(function ContactAvatar({
    name,
    initials,
    avatarClassName = 'bg-lightBg text-main',
    avatarUrl,
    isOnline = false,
    size = 'md',
}: ContactAvatarProps) {
    return (
        <span className="relative inline-flex shrink-0" aria-label={name}>
            <span
                className={classNames(
                    'grid place-items-center overflow-hidden rounded-full border border-line font-bold',
                    SIZE_CLASS_NAMES[size],
                    avatarClassName,
                )}
            >
                {avatarUrl ? (
                    <>
                        {/* Orb avatars can use user-defined hosts that are not compatible with Next Image's allowlist. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarUrl} alt="" className="size-full object-cover" />
                    </>
                ) : (
                    initials
                )}
            </span>
            {isOnline ? (
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-primaryBottom bg-[#42C776]" />
            ) : null}
        </span>
    );
});
