import type { AddToPositionInput, AddToPositionResult, SubmitTpSlInput, SubmitTpSlResult } from '@/types/ui';

export type SubmitAddToPosition = (params: AddToPositionInput) => Promise<AddToPositionResult>;

export type SubmitTpSl = (params: SubmitTpSlInput) => Promise<SubmitTpSlResult>;
