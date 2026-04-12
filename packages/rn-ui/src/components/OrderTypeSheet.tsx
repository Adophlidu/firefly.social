import { memo, useEffect, useState } from 'react';
import { Path, Svg } from 'react-native-svg';
import { Button, Sheet, Text, YStack } from 'tamagui';

import type { OrderTypeSheetData, PerpsTradeOrderType } from '@/types/ui';

interface OrderTypeSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: OrderTypeSheetData;
    loading?: boolean;
    onConfirm?: (orderType: PerpsTradeOrderType) => void;
}

function RadioChecked() {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z"
                fill="#171717"
            />
            <Path
                d="M8.1 12L10.9 14.8L15.9 9.8"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function RadioUnchecked() {
    return (
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22Z"
                stroke="rgba(23, 23, 23, 0.4)"
                strokeWidth="1.5"
            />
        </Svg>
    );
}

function SheetOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
    return (
        <Button
            unstyled
            width="100%"
            padding={8}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            pressStyle={{ opacity: 0.78 }}
            onPress={onPress}
        >
            <Text color="#171717" fontSize={16} lineHeight={24} fontWeight={600}>
                {label}
            </Text>
            {selected ? <RadioChecked /> : <RadioUnchecked />}
        </Button>
    );
}

export const OrderTypeSheet = memo<OrderTypeSheetProps>(function OrderTypeSheet({
    open,
    onOpenChange,
    data,
    loading = false,
    onConfirm,
}) {
    const [position, setPosition] = useState(0);
    const [selectedType, setSelectedType] = useState<PerpsTradeOrderType>(data.currentType);

    useEffect(() => {
        setSelectedType(data.currentType);
    }, [data.currentType, open]);

    const handleSelect = (type: PerpsTradeOrderType) => {
        setSelectedType(type);
        onConfirm?.(type);
        onOpenChange(false);
    };

    return (
        <Sheet
            modal
            open={open}
            onOpenChange={onOpenChange}
            snapPointsMode="fit"
            dismissOnSnapToBottom
            position={position}
            onPositionChange={setPosition}
            zIndex={100_000}
        >
            <Sheet.Overlay
                animation="quick"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
                opacity={0.16}
                backgroundColor="#000000"
            />

            <Sheet.Frame
                borderWidth={1}
                borderColor="rgba(34, 33, 47, 0.03)"
                borderTopLeftRadius={36}
                borderTopRightRadius={36}
                borderBottomLeftRadius={36}
                borderBottomRightRadius={36}
                shadowColor="#403D57"
                shadowOpacity={0.1}
                shadowRadius={20}
                shadowOffset={{ width: 0, height: 16 }}
                paddingTop={8}
                paddingBottom={16}
                paddingHorizontal={16}
                gap={8}
                minHeight={124}
            >
                <YStack width="100%" gap={4}>
                    <YStack width="100%" alignItems="center">
                        <Sheet.Handle
                            width={48}
                            height={4}
                            borderRadius={100}
                            backgroundColor="#D1D1D1"
                            marginBottom={0}
                        />
                    </YStack>
                </YStack>

                <YStack width="100%" gap={0}>
                    {loading
                        ? null
                        : data.options.map((option) => (
                              <SheetOption
                                  key={option.value}
                                  label={option.label}
                                  selected={selectedType === option.value}
                                  onPress={() => handleSelect(option.value)}
                              />
                          ))}
                </YStack>
            </Sheet.Frame>
        </Sheet>
    );
});
