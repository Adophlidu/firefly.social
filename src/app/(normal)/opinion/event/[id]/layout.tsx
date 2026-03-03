import { type NextPageProps } from '@/types/utility.js';

interface Props
    extends NextPageProps<
        {
            id: string;
        },
        {
            type: 'multi' | string;
        }
    > {}

export default async function OpinionEventLayout(props: Props) {
    return props.children;
}
