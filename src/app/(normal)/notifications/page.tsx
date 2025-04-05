import { redirect, RedirectType } from 'next/navigation.js';

import { DEFAULT_NOTIFICATION_SOURCE } from '@/constants/index.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';

export default function Page() {
    redirect(resolveNotificationUrl(DEFAULT_NOTIFICATION_SOURCE), RedirectType.replace);
}
