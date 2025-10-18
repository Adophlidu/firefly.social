'use client';

import { type HTMLProps, type ReactNode } from 'react';

import ComeBackIcon from '@/assets/comeback.svg';
import { classNames } from '@/helpers/classNames.js';
import { useComeBack } from '@/hooks/useComeback.js';

export function Title({ title, className, children }: Omit<HTMLProps<'div'>, 'title'> & { title?: ReactNode | null }) {
    const comeback = useComeBack();
    return (
        <div className={classNames('z-40 flex h-[60px] w-full items-center bg-primaryBottom pl-4 pr-3', className)}>
            <div className="mr-auto flex items-center gap-7 overflow-auto">
                <ComeBackIcon className="shrink-0 cursor-pointer text-lightMain" onClick={comeback} />
                <span className="truncate text-xl font-black text-lightMain">{title ?? '-'}</span>
            </div>
            {children}
        </div>
    );
}
