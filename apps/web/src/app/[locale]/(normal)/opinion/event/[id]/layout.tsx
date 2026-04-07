import { type LayoutProps } from '@dimensiondev/types';

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
