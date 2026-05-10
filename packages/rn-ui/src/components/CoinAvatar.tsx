import { memo } from 'react';
import { Avatar, Text } from 'tamagui';

import { formatCoinName } from '@/helpers/formatCoinName';
import { resolveMetaAvatar } from '@/helpers/resolveMetaAvatar';

interface CoinAvatarProps {
    name: string;
    size?: number;
}

export const CoinAvatar = memo<CoinAvatarProps>(function CoinAvatar({ name, size = 36 }) {
    return (
        <Avatar circular size={size} flexShrink={0}>
            <Avatar.Image src={resolveMetaAvatar(name)} />
            <Avatar.Fallback delayMs={600} backgroundColor="#FF9800" alignItems="center" justifyContent="center">
                <Text color="$bg" fontSize={16} lineHeight={18} fontWeight={700}>
                    {formatCoinName(name).slice(0, 1)}
                </Text>
            </Avatar.Fallback>
        </Avatar>
    );
});
