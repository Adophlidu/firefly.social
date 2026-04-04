'use client';

import { Trans } from '@lingui/react/macro';

import { SettingsSection } from '@/app/[locale]/(settings)/components/Section.js';
import { Switch } from '@/components/Switch/index.js';
import { ExploreSwitchType } from '@/constants/enum.js';
import { useExploreDataSwitchConfig } from '@/hooks/useExploreDataSwitchConfig.js';

export default function PreferencePage() {
    const { loading, status, toggleSwitch } = useExploreDataSwitchConfig(ExploreSwitchType.TruthSocial);

    return (
        <SettingsSection title={<Trans>Content preference</Trans>}>
            <div className="relative w-full">
                <div className="border-line flex items-center gap-2 rounded-lg border px-3 py-2">
                    <div className="min-w-0 flex-1 truncate">
                        <p className="text-main text-base font-bold">
                            <Trans>Truth Social</Trans>
                        </p>
                        <p className="text-medium text-second mt-1">
                            <Trans>Posts from Trump on Truth Social (Explore, profile)</Trans>
                        </p>
                    </div>
                    <Switch
                        disabled={loading}
                        checked={status}
                        loading={loading}
                        onChange={() => {
                            toggleSwitch(!status);
                        }}
                        className="bg-second data-[checked]:bg-highlight dark:bg-bg data-[checked]:dark:bg-highlight group inline-flex h-[22px] w-11 items-center rounded-full transition"
                    />
                </div>
            </div>
        </SettingsSection>
    );
}
