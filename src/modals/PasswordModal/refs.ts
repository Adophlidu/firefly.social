import { type PasswordWorkflow } from '@/constants/enum.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';
import { type StepDescriptions } from '@/modals/PasswordModal/StepDescription.js';

export interface PasswordModalOpenProps {
    workflow: PasswordWorkflow;
    autoUploadMetrics?: boolean;
    descriptions?: StepDescriptions;
}

export type PasswordModalCloseProps = boolean | void;

export type PasswordModalRefType = SingletonModalRefCreator<PasswordModalOpenProps, PasswordModalCloseProps>;

export const PasswordModalRef = new SingletonModal<PasswordModalOpenProps, PasswordModalCloseProps>();
