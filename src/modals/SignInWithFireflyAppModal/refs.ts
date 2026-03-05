import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export type SignInWithFireflyAppModalRefType = SingletonModalRefCreator;

export const SignInWithFireflyAppModalRef = new SingletonModal();
