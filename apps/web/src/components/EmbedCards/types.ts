import { type HTMLProps } from 'react';

export interface AddressCardProps extends HTMLProps<HTMLDivElement> {
    address: string;
    domain?: string;
}

export interface DomainCardProps extends HTMLProps<HTMLDivElement> {
    domain: string;
}
