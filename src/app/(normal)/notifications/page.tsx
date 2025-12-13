import { DEFAULT_NOTIFICATION_SOURCE } from '@/constants/computed.js';
import { redirect, RedirectType } from '@/esm/navigation/server.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';

export default function Page() {
    redirect(resolveNotificationUrl(DEFAULT_NOTIFICATION_SOURCE), RedirectType.replace);
}
