import BigNumber from 'bignumber.js';

type PerpsFundingIssue = 'below-minimum' | 'insufficient-balance' | 'insufficient-gas' | 'amount-required';

interface PerpsFundingInput {
    kind: 'deposit' | 'withdraw';
    amount: string;
    minimumAmount: string;
    availableBalance: string;
    gasBalance: string;
    requiredGas: string;
}

export function validatePerpsFunding(input: PerpsFundingInput) {
    const issues: Array<{ code: PerpsFundingIssue }> = [];
    const amount = new BigNumber(input.amount || '0');
    if (!amount.isPositive()) issues.push({ code: 'amount-required' });
    else if (amount.isLessThan(input.minimumAmount)) issues.push({ code: 'below-minimum' });
    else if (amount.isGreaterThan(input.availableBalance)) issues.push({ code: 'insufficient-balance' });
    else if (new BigNumber(input.gasBalance).isLessThan(input.requiredGas)) issues.push({ code: 'insufficient-gas' });
    return issues.length ? ({ ok: false, issues } as const) : ({ ok: true } as const);
}
