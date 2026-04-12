import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import type { AllConnections, FireflyAccountProfile } from '@/providers/types/Firefly.js';

export interface EditFireflyProfileModalOpenProps {
    profile?: FireflyAccountProfile | null;
    connections?: AllConnections;
}

export type EditFireflyProfileModalRefType = SingletonModalRefCreator<EditFireflyProfileModalOpenProps>;

export const EditFireflyProfileModalRef = new SingletonModal<EditFireflyProfileModalOpenProps>();
