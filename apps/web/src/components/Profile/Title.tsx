'use client';

import ComeBackIcon from '@dimensiondev/assets/comeback.svg';
import { classNames } from '@dimensiondev/utils';
import { type HTMLProps, type ReactNode } from 'react';

import { useComeBack } from '@/hooks/useComeback.js';

export function Title({ title, className, children }: Omit<HTMLProps<'div'>, 'title'> & { title?: ReactNode | null }) {
    const comeback = useComeBack();
    return (
        <div className={classNames('bg-primaryBottom z-40 flex h-[60px] w-full items-center pl-4 pr-3', className)}>
            <div className="mr-auto flex items-center gap-7 overflow-auto">
                <ComeBackIcon className="text-lightMain shrink-0 cursor-pointer" onClick={comeback} />
                <span className="text-lightMain truncate text-xl font-black">{title ?? '-'}</span>
            </div>
            {children}
        </div>
    );
}
