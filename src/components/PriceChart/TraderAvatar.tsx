import { memo, type SVGAttributes, useState } from 'react';
import { useUpdateEffect } from 'react-use';

import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';

export const TraderAvatar = memo(function UserAvatar(props: SVGAttributes<SVGImageElement>) {
    const [failed, setFailed] = useState(false);
    const isDarkMode = useIsDarkMode();

    const fallbackUrl = isDarkMode ? '/image/firefly-dark-avatar.png' : '/image/firefly-light-avatar.png';
    const avatar = failed ? fallbackUrl : props.href || fallbackUrl;

    useUpdateEffect(() => {
        setFailed(false);
    }, []);

    return <image {...props} href={avatar} onError={() => setFailed(true)} />;
});
