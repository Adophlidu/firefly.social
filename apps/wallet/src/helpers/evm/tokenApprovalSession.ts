import { isGreaterThanOrEqualTo, toFixed } from '@dimensiondev/web3/numbers';
import {
    type Address,
    decodeFunctionData,
    encodeFunctionData,
    erc20Abi,
    type Hex,
    isAddress,
    isHex,
    maxUint160,
    maxUint256,
} from 'viem';

const MaxUint128Decimal = toFixed('0xffffffffffffffffffffffffffffffff');

export const ERC20_APPROVE_SELECTOR = '0x095ea7b3' as Hex;

export type TokenApprovalKind = 'erc20Approve' | 'eip2612Permit' | 'permit2Single';

/** Parsed EIP-712 object for permit-style signing */
export interface Eip712TypedData {
    types: Record<string, Array<{ name: string; type: string }>>;
    primaryType: string;
    domain: Record<string, unknown>;
    message: Record<string, unknown>;
}

export interface Erc20ApproveSession {
    kind: 'erc20Approve';
    tokenAddress: Address;
    spender: Address;
    amount: bigint;
}

export interface Eip2612PermitSession {
    kind: 'eip2612Permit';
    tokenAddress: Address;
    spender: Address;
    amount: bigint;
    typedData: Eip712TypedData;
}

export interface Permit2SingleSession {
    kind: 'permit2Single';
    tokenAddress: Address;
    spender: Address;
    amount: bigint;
    typedData: Eip712TypedData;
}

export type TokenApprovalSession = Erc20ApproveSession | Eip2612PermitSession | Permit2SingleSession;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBigintAmount(value: unknown): bigint | null {
    if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
    if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
    return null;
}

/**
 * If `data` is an ERC20 approve call, returns spender and amount; otherwise null.
 */
export function tryParseErc20ApproveFromCalldata(data: Hex | undefined): { spender: Address; amount: bigint } | null {
    if (!data || !isHex(data) || data.length < 10) return null;
    if (data.slice(0, 10).toLowerCase() !== ERC20_APPROVE_SELECTOR) return null;

    try {
        const decoded = decodeFunctionData({
            abi: erc20Abi,
            data,
        });
        if (decoded.functionName !== 'approve') return null;
        const [spender, amount] = decoded.args;
        return { spender, amount };
    } catch {
        return null;
    }
}

/**
 * Full approve session including token contract address from `to`.
 */
export function tryParseErc20ApproveSession(tokenAddress: unknown, data: Hex | undefined): Erc20ApproveSession | null {
    const inner = tryParseErc20ApproveFromCalldata(data);
    if (!inner || typeof tokenAddress !== 'string' || !isAddress(tokenAddress)) return null;
    return {
        kind: 'erc20Approve',
        tokenAddress,
        spender: inner.spender,
        amount: inner.amount,
    };
}

function cloneTypedData(input: Eip712TypedData): Eip712TypedData {
    return {
        types: JSON.parse(JSON.stringify(input.types)) as Eip712TypedData['types'],
        primaryType: input.primaryType,
        domain: { ...input.domain },
        message: { ...input.message },
    };
}

/**
 * Parses `eth_signTypedData_v4` JSON for EIP-2612 Permit or Permit2 PermitSingle.
 */
export function tryParseTokenApprovalTypedData(jsonStr: string): Eip2612PermitSession | Permit2SingleSession | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonStr) as unknown;
    } catch {
        return null;
    }

    if (!isRecord(parsed)) return null;
    const { types, primaryType, domain, message } = parsed;
    if (!isRecord(types) || typeof primaryType !== 'string' || !isRecord(domain) || !isRecord(message)) return null;

    const normalizedTypes: Eip712TypedData['types'] = {};
    for (const [key, value] of Object.entries(types)) {
        if (!Array.isArray(value)) return null;
        const entries: Array<{ name: string; type: string }> = [];
        for (const item of value) {
            if (!isRecord(item) || typeof item.name !== 'string' || typeof item.type !== 'string') return null;
            entries.push({ name: item.name, type: item.type });
        }

        normalizedTypes[key] = entries;
    }

    const typedData: Eip712TypedData = {
        types: normalizedTypes,
        primaryType,
        domain,
        message,
    };

    if (primaryType === 'Permit') {
        const verifyingContract = domain.verifyingContract;
        const spender = message.spender;
        const value = message.value;
        if (typeof verifyingContract !== 'string' || !isAddress(verifyingContract)) return null;
        if (typeof spender !== 'string' || !isAddress(spender)) return null;
        const amount = parseBigintAmount(value);
        if (amount === null) return null;
        return {
            kind: 'eip2612Permit',
            tokenAddress: verifyingContract,
            spender,
            amount,
            typedData: cloneTypedData(typedData),
        };
    }

    if (primaryType === 'PermitSingle') {
        const details = message.details;
        if (!isRecord(details)) return null;
        const token = details.token;
        const amountRaw = details.amount;
        const spender = message.spender;
        if (typeof token !== 'string' || !isAddress(token)) return null;
        if (typeof spender !== 'string' || !isAddress(spender)) return null;
        const amount = parseBigintAmount(amountRaw);
        if (amount === null) return null;
        return {
            kind: 'permit2Single',
            tokenAddress: token,
            spender,
            amount,
            typedData: cloneTypedData(typedData),
        };
    }

    if (primaryType === 'PermitBatch') {
        return null;
    }

    return null;
}

export function encodeErc20ApproveCalldata(spender: Address, amount: bigint): Hex {
    return encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
    });
}

/**
 * Serializes updated typed data after changing allowance amount.
 * Permit2 uses uint160 for `details.amount`.
 */
export function applyAmountToTypedDataSession(
    session: Eip2612PermitSession | Permit2SingleSession,
    newAmount: bigint,
): string {
    const next = cloneTypedData(session.typedData);
    if (session.kind === 'eip2612Permit') {
        next.message = { ...next.message, value: newAmount.toString() };
    } else {
        const details = next.message.details;
        if (!isRecord(details)) throw new Error('Invalid PermitSingle message');
        const capped = newAmount > maxUint160 ? maxUint160 : newAmount;
        next.message = {
            ...next.message,
            details: { ...details, amount: capped.toString() },
        };
    }
    return JSON.stringify(next);
}

export function unlimitedApprovalAmount(kind: TokenApprovalKind): bigint {
    return kind === 'permit2Single' ? maxUint160 : maxUint256;
}

/** Whether the allowance should be shown as "Unlimited" in the UI */
export function isDisplayUnlimitedAllowance(amount: bigint, kind: TokenApprovalKind): boolean {
    if (kind === 'permit2Single') return amount === maxUint160;
    if (amount === maxUint256) return true;
    return isGreaterThanOrEqualTo(amount.toString(10), MaxUint128Decimal);
}
