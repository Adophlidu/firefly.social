import { memo, type SVGAttributes, useState } from 'react';
import { useUpdateEffect } from 'react-use';

import { useResolveAvatarFallbackUrl } from '@/components/Avatar.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

export const TraderAvatar = memo(function UserAvatar(props: SVGAttributes<SVGImageElement>) {
    const [failed, setFailed] = useState(false);
    const isDarkMode = useIsDarkMode();
    const { data: xFallbackUrl } = useResolveAvatarFallbackUrl(props.href);

    const fallbackUrl = isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';
    const avatar = failed ? fallbackUrl : xFallbackUrl || props.href || fallbackUrl;

    useUpdateEffect(() => {
        setFailed(false);
    }, [xFallbackUrl]);

    return <image {...props} href={avatar} onError={() => setFailed(true)} />;
});
