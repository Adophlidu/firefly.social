import urlcat from 'urlcat';

import type { SocialSourceInURL } from '@/constants/enum.js';
import { redirect } from '@/esm/navigation.js';
import type { NextPageProps } from '@/types/index.js';

interface Props extends NextPageProps<{ id: string; index: string; source: SocialSourceInURL }> {}

export default async function Photo(props: Props) {
    const params = await props.params;
    const { id: postId, source } = params;

    redirect(urlcat('/post/:source/:id', { id: postId, source }));
}
