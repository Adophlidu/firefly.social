import { SingletonModal, type SingletonModalRefCreator } from '@/libs/SingletonModal.js';

export type SignInToFireflyAppModalRefType = SingletonModalRefCreator;

export const SignInToFireflyAppModalRef = new SingletonModal();
