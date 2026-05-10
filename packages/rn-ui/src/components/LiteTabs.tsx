import { memo } from 'react';
import { Button, ScrollView, styled, Text, XStack } from 'tamagui';

interface LiteTabsProps {
    value: string;
    data: Array<{ label: string; value: string }>;
    onChange: (value: string) => void;
}

const TabButton = styled(Button, {
    unstyled: true,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomWidth: 2.5,
});
const TabText = styled(Text, {
    fontSize: 16,
    fontWeight: 600,
});

export const LiteTabs = memo<LiteTabsProps>(function LiteTabs({ value, data, onChange }) {
    return (
        <ScrollView flexShrink={0} height={44} horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap={16} height="100%">
                {data.map((item, index) => {
                    const isActive = value === item.value;

                    return (
                        <TabButton
                            borderBottomColor={isActive ? '$text' : 'transparent'}
                            key={index}
                            onPress={() => onChange(item.value)}
                        >
                            <TabText color={isActive ? '$text' : '$textTertiary'}>{item.label}</TabText>
                        </TabButton>
                    );
                })}
            </XStack>
        </ScrollView>
    );
});
