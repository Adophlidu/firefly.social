'use client';

import { Switch } from '@headlessui/react';
import { Trans } from '@lingui/react/macro';

import { SettingsSection } from '@/app/(settings)/components/Section.js';
import { LoadingIcon } from '@/components/LoadingIcon.js';
import { useToggleEnableTruthSocial } from '@/hooks/useToggleEnableTruthSocial.js';

export default function PreferencePage() {
    const { enable, mutation, isMutating } = useToggleEnableTruthSocial();

    return (
        <SettingsSection title={<Trans>Content preference</Trans>}>
            <div className="relative w-full">
                <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                    <div className="min-w-0 flex-1 truncate">
                        <p className="text-base font-bold text-main">
                            <Trans>Truth Social</Trans>
                        </p>
                        <p className="mt-1 text-medium text-second">
                            <Trans>Posts from Trump on Truth Social (Explore, profile)</Trans>
                        </p>
                    </div>
                    <Switch
                        disabled={isMutating}
                        checked={enable}
                        onChange={() => {
                            mutation.mutate();
                        }}
                        className="group inline-flex h-[22px] w-11 items-center rounded-full bg-second transition data-[checked]:bg-highlight dark:bg-bg data-[checked]:dark:bg-highlight"
                    >
                        <span className="flex size-4 translate-x-1 items-center justify-center rounded-full bg-white transition group-data-[checked]:translate-x-6">
                            {isMutating ? <LoadingIcon className="text-darkBottom" size={12} /> : null}
                        </span>
                    </Switch>
                </div>
            </div>
        </SettingsSection>
    );
}
