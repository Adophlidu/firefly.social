import { LoadingIcon } from '@/components/LoadingIcon.js';

export function LoadingOverlay() {
    return (
        <div className="fixed flex size-full items-center justify-center">
            <LoadingIcon />
        </div>
    );
}
