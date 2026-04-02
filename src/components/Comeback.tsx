'use client';

import ComeBackIcon from '@dimensiondev/assets/comeback.svg';
import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

import { useComeBack } from '@/hooks/useComeback.js';

interface ComebackProps {
    className?: string;
}

export const Comeback = memo<ComebackProps>(function Comeback({ className }) {
    const comeback = useComeBack();

    return (
        <ComeBackIcon width={24} height={24} className={classNames('cursor-pointer', className)} onClick={comeback} />
    );
});
