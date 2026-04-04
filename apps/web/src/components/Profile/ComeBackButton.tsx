'use client';

import ComeBackIcon from '@dimensiondev/assets/comeback.svg';

import { ClickableButton } from '@/components/ClickableButton.js';
import { useComeBack } from '@/hooks/useComeback.js';

export function ComeBackButton() {
    const comeback = useComeBack();
    return (
        <ClickableButton
            className="bg-bg text-main inline-flex size-8 items-center justify-center rounded-lg active:opacity-50 md:hover:opacity-60"
            onClick={comeback}
        >
            <ComeBackIcon className="size-6 shrink-0" />
        </ClickableButton>
    );
}
