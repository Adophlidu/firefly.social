'use client';

import AppleDarkIcon from '@dimensiondev/assets/apple.dark.svg';
import AppleIcon from '@dimensiondev/assets/apple.svg';
import EmailDarkIcon from '@dimensiondev/assets/email-small.dark.svg';
import EmailIcon from '@dimensiondev/assets/email-small.svg';
import GoogleIcon from '@dimensiondev/assets/google.svg';
import GoogleSmallIcon from '@dimensiondev/assets/google-small.svg';
import FireflyIcon from '@dimensiondev/assets/logo.svg';
import TelegramIcon from '@dimensiondev/assets/telegram.svg';
import { safeUnreachable } from '@dimensiondev/utils';
import { type SVGProps } from 'react';

import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { type ProfileSource, Source } from '@/constants/enum.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { useSizeStyle } from '@/hooks/useSizeStyle.js';

interface ProfileSourceIcon extends SVGProps<SVGSVGElement> {
    size?: number;
    source: ProfileSource;
}

export function ProfileSourceIcon({ source, size = 20, ...props }: ProfileSourceIcon) {
    const isDark = useIsDarkMode();
    const style = useSizeStyle(size, props.style);

    switch (source) {
        case Source.Lens:
        case Source.Farcaster:
        case Source.Twitter:
        case Source.Bsky:
            return <SocialSourceIcon {...props} source={source} style={style} width={size} height={size} />;
        case Source.Firefly:
            return (
                <FireflyIcon
                    {...props}
                    style={{
                        ...style,
                        overflow: 'visible',
                    }}
                    width={size}
                    height={size}
                />
            );
        case Source.Google:
            if (size < 48) return <GoogleSmallIcon {...props} style={style} width={size} height={size} />;
            return <GoogleIcon {...props} style={style} width={size} height={size} />;
        case Source.Apple:
            return isDark ? (
                <AppleDarkIcon {...props} style={style} width={size} height={size} />
            ) : (
                <AppleIcon {...props} style={style} width={size} height={size} />
            );
        case Source.Telegram:
            return <TelegramIcon {...props} style={style} width={size} height={size} />;
        case Source.Email:
            return isDark ? (
                <EmailDarkIcon {...props} style={style} width={size} height={size} />
            ) : (
                <EmailIcon {...props} style={style} width={size} height={size} />
            );
        default:
            safeUnreachable(source);
            return null;
    }
}
