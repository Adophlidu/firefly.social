import { Signup } from '@/app/(whiteboard)/signup/pages/Signup.js';
import type { SignupStep } from '@/constants/enum.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<
        {},
        {
            step?: SignupStep;
        }
    > {}

export default async function Page(props: Props) {
    const searchParams = await props.searchParams;

    return <Signup initialStep={searchParams.step} />;
}
