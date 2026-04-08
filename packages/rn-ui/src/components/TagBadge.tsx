import { memo } from 'react';
import { Text, XStack } from 'tamagui';

interface TagBadgeProps {
    label: string;
    variant?: 'buy' | 'sell' | 'neutral';
}

const variantStyles = {
    buy: { bg: '#DCF1D9', color: '#48AD3C' },
    sell: { bg: '#FFE6E4', color: '#FF564D' },
    neutral: { bg: '#EFEFF3', color: '#A9A6BC' },
};

export const TagBadge = memo<TagBadgeProps>(function TagBadge({ label, variant = 'neutral' }) {
    const style = variantStyles[variant];

    return (
        <XStack
            backgroundColor={style.bg}
            borderRadius={96}
            paddingHorizontal={6}
            paddingVertical={2}
            alignItems="center"
            justifyContent="center"
        >
            <Text color={style.color} fontSize={12} lineHeight={14} fontWeight={500}>
                {label}
            </Text>
        </XStack>
    );
});
