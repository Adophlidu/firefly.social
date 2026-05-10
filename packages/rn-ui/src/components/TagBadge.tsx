import { memo } from 'react';
import { Text, XStack } from 'tamagui';

interface TagBadgeProps {
    label: string;
    variant?: 'buy' | 'sell' | 'neutral';
}

const variantStyles = {
    buy: { bg: '$bgSuccessSubdued', color: '$textSuccess' },
    sell: { bg: '$bgCriticalSubdued', color: '$textCritical' },
    neutral: { bg: '$bgSubdued', color: '$textTertiary' },
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
