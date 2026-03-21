import type { Operation } from '@shared/api/endpoints/accounts'

export const TRANSFER_DESCRIPTION = 'перевод между счетами'

export const getOperationTypeLabel = (operation: Operation): string => {
  const isTransfer = operation.description === TRANSFER_DESCRIPTION
  if (isTransfer) {
    if (operation.type === 'withdraw') {
      return 'Перевод со счёта'
    }
    if (operation.type === 'deposit') {
      return 'Перевод на счёт'
    }
  }
  switch (operation.type) {
    case 'deposit':
      return 'Пополнение'
    case 'withdraw':
      return 'Снятие'
    case 'credit_issue':
      return 'Выдача кредита'
    case 'credit_repay':
      return 'Погашение кредита'
    default:
      return operation.type
  }
}

export const shouldHideOperationDescription = (operation: Operation): boolean => {
  return (
    operation.description === TRANSFER_DESCRIPTION &&
    (operation.type === 'withdraw' || operation.type === 'deposit')
  )
}
