import { useAtomValue, useSetAtom } from 'jotai';
import { memo } from 'react';
import { Slider, YStack } from 'tamagui';

import { setSliderValueAtom, sliderValueAtom } from '@/store/tradeForm';

interface SizeSliderProps {}

export const SizeSlider = memo<SizeSliderProps>(function SizeSlider() {
    const sliderValue = useAtomValue(sliderValueAtom);
    const setSliderValue = useSetAtom(setSliderValueAtom);

    return (
        <YStack height={24} paddingHorizontal={2} paddingVertical={6} justifyContent="center">
            <Slider value={[sliderValue]} onValueChange={([v]) => setSliderValue(v)} max={100} step={1} size="$1">
                <Slider.Track backgroundColor="#EFEFF3" height={2}>
                    <Slider.TrackActive backgroundColor="#171717" />
                </Slider.Track>
                <Slider.Thumb
                    index={0}
                    circular
                    size={14}
                    backgroundColor="#171717"
                    borderWidth={2}
                    borderColor="#FFFFFF"
                />
            </Slider>
        </YStack>
    );
});
