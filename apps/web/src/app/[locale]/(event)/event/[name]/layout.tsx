import { type LayoutProps } from '@dimensiondev/types';

import { ActivityProvider } from '@/components/Activity/ActivityContext.js';

interface Props extends LayoutProps<{ name: string }> {}

export default async function Layout(props: Props) {
    const { name } = await props.params;
    return <ActivityProvider name={name}>{props.children}</ActivityProvider>;
}
