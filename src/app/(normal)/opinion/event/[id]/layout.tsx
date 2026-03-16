import { type LayoutProps } from '@/types/utility.js';

interface Props
    extends LayoutProps<
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
