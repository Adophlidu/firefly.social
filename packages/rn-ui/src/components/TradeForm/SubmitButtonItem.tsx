import { memo } from 'react';
import { Text } from 'tamagui';

import { WalletActionButton } from '@/components/WalletActionButton';
import { useSubmitButtonLabel } from '@/hooks/Perps/useSubmitButtonLabel';

interface SubmitButtonItemProps {
    isLong: boolean;
    loading?: boolean;
    onPress?: () => void;
}

export const SubmitButtonItem = memo<SubmitButtonItemProps>(function SubmitButtonItem({ isLong, loading, onPress }) {
    const { disabled, label } = useSubmitButtonLabel();

    return (
        <WalletActionButton
            unstyled
            backgroundColor={isLong ? '$textSuccess' : '$textCritical'}
            borderRadius={22}
            height={36}
            alignItems="center"
            justifyContent="center"
            width="100%"
            loading={loading}
            disabled={disabled}
            pressStyle={{ opacity: 0.9 }}
            onPress={onPress}
        >
            <Text color="$bg" fontSize={12} lineHeight={14} fontWeight={500} textAlign="center">
                {label || (isLong ? 'Buy/Long' : 'Sell/Short')}
            </Text>
        </WalletActionButton>
    );
});
