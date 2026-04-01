import { memo, useState } from 'react';
import { Button, ScrollView, Sheet, styled, Text, XStack, YStack } from 'tamagui';

import { SolidArrowIcon } from '@/icons/SolidArrowIcon';

interface SortByFilterProps {
    data: Array<{ label: string; value: string }>;
    value: string;
    onChange: (value: string) => void;
}

const TriggerButton = styled(Button, {
    unstyled: true,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 1000,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
});

export const SortByFilter = memo<SortByFilterProps>(function SortByFilter({ value, data, onChange }) {
    const [position, setPosition] = useState(0);
    const [open, setOpen] = useState(false);

    return (
        <>
            <TriggerButton
                onPress={() => {
                    setOpen(true);
                }}
                iconAfter={<SolidArrowIcon />}
            >
                <Text color="#181818">{data.find((item) => item.value === value)?.label || 'Select'}</Text>
            </TriggerButton>

            <Sheet
                modal
                open={open}
                onOpenChange={setOpen}
                // snapPoints={[85, 50, 25]}
                snapPointsMode="fit"
                dismissOnSnapToBottom
                position={position}
                onPositionChange={setPosition}
                zIndex={100_000}
            >
                <Sheet.Overlay transition="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
                <Sheet.Handle />
                <Sheet.Frame padding="$4" justifyContent="center" alignItems="center" gap="$5">
                    <ScrollView>
                        <YStack gap="$4">
                            {data.map((item, index) => {
                                const isActive = value === item.value;

                                return (
                                    <XStack key={index}>
                                        <Button
                                            onPress={() => {
                                                onChange(item.value);
                                                setOpen(false);
                                            }}
                                        >
                                            <Text>{item.label}</Text>
                                        </Button>
                                    </XStack>
                                );
                            })}
                        </YStack>
                    </ScrollView>
                </Sheet.Frame>
            </Sheet>
        </>
    );
});
