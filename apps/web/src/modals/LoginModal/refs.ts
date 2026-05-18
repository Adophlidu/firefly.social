import type { ProfileSource } from '@dimensiondev/enums';

import type { FarcasterSignType, LensSignType } from '@/constants/enum.js';
import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export interface LoginModalOpenProps {
    source?: ProfileSource;
    options?: {
        /**
         * profile id of expected profile.
         * The expected profile will be place at the top of the list.
         */
        expectedProfile?: string;
        /** open the farcaster login modal with the specified sign type */
        expectedSignType?: FarcasterSignType;
        /** only keep google/tg/apple/email */
        hideSocialLogin?: boolean;
        noBackButton?: boolean;
        /** open lens login modal with specified sign type */
        expectedLensSignType?: LensSignType;
        /** skip waiting for syncing metrics */
        skipWaitForMetricsSyncing?: boolean;
    };
}

export type LoginModalCloseProps = void;

export type LoginModalRefType = SingletonModalRefCreator<LoginModalOpenProps | void>;

export const LoginModalRef = new SingletonModal<LoginModalOpenProps | void, LoginModalCloseProps>();
