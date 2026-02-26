import { getEnumAsArray } from '@dimensiondev/utils';

import { Signup } from '@/app/(whiteboard)/signup/pages/Signup.js';
import { SignupStep } from '@/constants/enum.js';
import { type NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<
        {},
        {
            step?: SignupStep;
        }
    > {}

export default async function Page(props: Props) {
    const searchParams = await props.searchParams;

    const validStep = searchParams.step
        ? getEnumAsArray(SignupStep).find((s) => s.value === searchParams.step)?.value || SignupStep.Welcome
        : undefined;

    return <Signup initialStep={validStep} />;
}
