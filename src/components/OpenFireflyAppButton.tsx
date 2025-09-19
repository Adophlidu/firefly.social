'use client';

import { useAsyncFn } from 'react-use';

import { ClickableButton, type ClickableButtonProps } from '@/components/ClickableButton.js';
import { openAppSchemes } from '@/helpers/openAppSchemes.js';
import { DeviceType, type Schemes } from '@/types/device.js';

interface OpenAppButtonProps extends ClickableButtonProps {
    schemes?: Schemes;
}

export function OpenFireflyAppButton({ schemes, ref, ...props }: OpenAppButtonProps) {
    const [{ loading }, tryOpenApp] = useAsyncFn(async () => {
        await openAppSchemes(
            schemes ?? {
                [DeviceType.Android]: 'firefly://LoginToDesktop/ConfirmDialog',
                [DeviceType.IOS]: 'firefly://',
            },
        );
    }, [schemes]);

    return <ClickableButton {...props} onClick={tryOpenApp} disabled={loading} />;
}
