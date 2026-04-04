import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export type { VerifiedAddressModalProps } from '@/modals/VerifiedAddressModal/VerifiedAddressModalContent.js';

export type VerifiedAddressModalCloseProps = void;

export type VerifiedAddressModalRefType = SingletonModalRefCreator<
    import('@/modals/VerifiedAddressModal/VerifiedAddressModalContent.js').VerifiedAddressModalProps
>;

export const VerifiedAddressModalRef = new SingletonModal<
    import('@/modals/VerifiedAddressModal/VerifiedAddressModalContent.js').VerifiedAddressModalProps,
    VerifiedAddressModalCloseProps
>();
