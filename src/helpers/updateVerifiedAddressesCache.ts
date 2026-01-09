import { type QueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

import { isSameAddress } from '@/helpers/isSameAddress.js';
import { type GetVerifiedAddressesResponse } from '@/providers/types/Firefly.js';

export function updateCacheAfterDelete(queryClient: QueryClient, deletedAddress: string) {
    queryClient.setQueryData(['verifiedAddresses'], (oldData: GetVerifiedAddressesResponse | undefined) => {
        if (!oldData?.data?.farcaster?.connected) return oldData;

        return produce(oldData, (draft) => {
            if (!draft.data.farcaster?.connected) return;

            draft.data.farcaster.connected.forEach((conn) => {
                conn.connectedAddresses = conn.connectedAddresses.filter(
                    (addr) => !isSameAddress(addr, deletedAddress),
                );
            });
        });
    });
}

export function updateCacheAfterAdd(queryClient: QueryClient, fid: string, newAddress: string) {
    queryClient.setQueryData(['verifiedAddresses'], (oldData: GetVerifiedAddressesResponse | undefined) => {
        if (!oldData?.data?.farcaster?.connected) return oldData;

        return produce(oldData, (draft) => {
            if (!draft.data.farcaster?.connected) return;

            const connection = draft.data.farcaster.connected.find((conn) => conn.fid.toString() === fid);
            if (!connection) return;

            const addressExists = connection.connectedAddresses.some((addr) => isSameAddress(addr, newAddress));
            if (!addressExists) {
                connection.connectedAddresses.push(newAddress);
            }
        });
    });
}
