import { ActivityProvider } from '@/components/Activity/ActivityContext.js';
import { type LayoutProps } from '@/types/utility.js';

interface Props extends LayoutProps<{ name: string }> {}

export default async function Layout(props: Props) {
    const { children } = props;

    const { name } = await props.params;
    return <ActivityProvider name={name}>{children}</ActivityProvider>;
}
