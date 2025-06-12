import { Trans } from '@lingui/react/macro';
import { useIsMutating, useMutation } from '@tanstack/react-query';

import { Link } from '@/esm/Link.js';
import { ConfirmModalRef } from '@/modals/controls.js';
import { usePreferencesState } from '@/store/usePreferenceStore.js';

export function useToggleEnableTruthSocial(showAlert = false) {
    const { preferences, setPreference } = usePreferencesState();
    const enabled = preferences.SHOW_TRUTH_SOCIAL;

    const mutationKey = ['toggle-enable-truth-social'];
    const isMutating = useIsMutating({ mutationKey, exact: true }) > 0;

    const mutation = useMutation({
        mutationKey,
        mutationFn: async () => {
            if (showAlert && preferences.SHOW_TRUTH_SOCIAL_ALERT) {
                const confirmed = await ConfirmModalRef.openAndWaitForClose({
                    title: <Trans>Remove Truth Social</Trans>,
                    variant: 'normal',
                    content: (
                        <div className="text-main">
                            <Trans>
                                You can turn it back on anytime in{' '}
                                <Link className="text-highlight" href={'/settings/preference'}>
                                    Settings &gt; Content preference
                                </Link>
                            </Trans>
                        </div>
                    ),
                });
                if (!confirmed) return;

                setPreference('SHOW_TRUTH_SOCIAL_ALERT', (prev) => !prev);
            }

            setPreference('SHOW_TRUTH_SOCIAL', (prev) => !prev);
        },
    });

    return {
        enable: enabled,
        isMutating,
        mutation,
    };
}
