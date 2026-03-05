import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export type CreateFireflyAccountGuideModalOpenProps = void;

export type CreateFireflyAccountGuideModalCloseProps = void;

export type CreateFireflyAccountGuideModalRefType = SingletonModalRefCreator;

export const CreateFireflyAccountGuideModalRef = new SingletonModal<
    CreateFireflyAccountGuideModalOpenProps,
    CreateFireflyAccountGuideModalCloseProps
>();
