
import FireflyIcon from '@dimensiondev/assets/logo.svg';
import { useParams } from '@dimensiondev/ssr';

import { useRouter } from '@/esm/navigation.js';
import { usePollingAppScanLogin } from '@/hooks/usePollingAppScanLogin.js';

export default function LoginScanPage() {
    const router = useRouter();
    const { session, otp } = useParams();

    usePollingAppScanLogin(otp, session, {
        onSuccess() {
            router.push('/');
        },
        onCancel() {
            router.push('/');
        },
        onExpired() {
            router.push('/');
        },
        onFailure() {
            router.push('/');
        },
    });

    return (
        <div className="fixed inset-0 z-10 flex h-screen items-center justify-center">
            <FireflyIcon className="size-24 animate-pulse" />
        </div>
    );
}
