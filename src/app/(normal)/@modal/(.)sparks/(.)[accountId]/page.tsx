'use client';

import { use } from 'react';

import { SparksModal } from '@/components/Sparks/SparksModal.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ accountId: string }> {}

export default function SparksModalPage(props: Props) {
    const { accountId } = use(props.params);

    return <SparksModal uid={accountId} />;
}
