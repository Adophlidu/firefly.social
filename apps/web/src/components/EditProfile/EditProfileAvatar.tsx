import FallbackAvatarSVG from '@dimensiondev/assets/firefly-avatar-fallback.svg';
import { FIREFLY_STAMP_URL } from '@dimensiondev/constants/static';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Avatar } from '@/components/Avatar.js';

export function EditProfileAvatar({ pfp, name, size = 108 }: { pfp: string; name: string; size?: number }) {
    const { control } = useFormContext();
    const value = useWatch({ control, name }) as File;
    const data = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);
    if (pfp?.startsWith(FIREFLY_STAMP_URL)) {
        return <FallbackAvatarSVG width={size} height={size} className="border-secondaryLine rounded-full border" />;
    }
    return <Avatar src={data || pfp} size={size} alt="avatar" />;
}
