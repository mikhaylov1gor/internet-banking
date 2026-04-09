export type RubTransferPreviewRequestPayload = {
  from_account_id: string
  to_account_id: string
  amount: number
}

export type RubDepositPreviewPlan =
  | { kind: 'none' }
  | { kind: 'transfer'; request: RubTransferPreviewRequestPayload }

export function getRubDepositPreviewPlan(
  rubBridgeAccountId: string | null,
  selectedAccountId: string,
  selectedCurrencyUpper: string,
  rubAmount: number | null
): RubDepositPreviewPlan {
  const cur = selectedCurrencyUpper.trim().toUpperCase() || 'RUB'
  if (!selectedAccountId.trim() || rubAmount === null || rubAmount < 0.01) {
    return { kind: 'none' }
  }

  if (cur === 'RUB') {
    return { kind: 'none' }
  }

  if (!rubBridgeAccountId || rubBridgeAccountId === selectedAccountId) {
    return { kind: 'none' }
  }

  return {
    kind: 'transfer',
    request: {
      from_account_id: rubBridgeAccountId,
      to_account_id: selectedAccountId,
      amount: rubAmount,
    },
  }
}
