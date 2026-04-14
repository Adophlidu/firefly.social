import type { LayoutProps } from '@dimensiondev/types';

type Props = LayoutProps<{
    id: string;
}>;

export default async function OpinionEventLayout(props: Props) {
    return props.children;
}
