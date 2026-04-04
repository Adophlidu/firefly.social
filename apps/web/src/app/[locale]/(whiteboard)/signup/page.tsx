'use client';

import { getEnumAsArray } from '@dimensiondev/utils';
import { useSearchParams } from 'next/navigation.js';

import { Signup } from '@/app/[locale]/(whiteboard)/signup/pages/Signup.js';
import { SignupStep } from '@/constants/enum.js';

export default function Page() {
    const searchParams = useSearchParams();
    const step = searchParams.get('step') as SignupStep | null;

    const validStep = step
        ? getEnumAsArray(SignupStep).find((s) => s.value === step)?.value || SignupStep.Welcome
        : undefined;

    return <Signup initialStep={validStep} />;
}
