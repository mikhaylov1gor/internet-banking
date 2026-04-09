import type { RubDepositPreviewPlan } from '@shared/utils/rub-deposit-preview'
import type { TransferPreviewResponse } from '@shared/api/endpoints/accounts'
import type { FxConvertResponse } from '@shared/api/endpoints/fx'
import { getApiErrorMessage } from '@shared/api'
import { Spinner } from '../spinner'
import './style.css'

export type RubDepositPreviewQuerySlice = {
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  error: unknown
  data?: TransferPreviewResponse | undefined
}

export type RubDepositFxQuoteSlice = {
  isPending: boolean
  isFetching: boolean
  isError: boolean
  isSuccess: boolean
  error: unknown
  data?: FxConvertResponse | undefined
}

export type RubDepositPreviewProps = {
  plan: RubDepositPreviewPlan
  variant: 'credit' | 'debit'
  selectedAccountCurrency: string
  preview: RubDepositPreviewQuerySlice
  fxQuoteActive?: boolean
  fxQuote?: RubDepositFxQuoteSlice
  hidden?: boolean
}

const formatAmt = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const RubDepositPreview = ({
  plan,
  variant,
  selectedAccountCurrency,
  preview,
  fxQuoteActive = false,
  fxQuote,
  hidden = false,
}: RubDepositPreviewProps) => {
  if (hidden) return null

  const title = variant === 'credit' ? 'Предрасчёт зачисления' : 'Предрасчёт списания'

  const transferMode = plan.kind === 'transfer'
  const curUp = selectedAccountCurrency.trim().toUpperCase() || 'RUB'
  const fxMode = plan.kind === 'none' && curUp !== 'RUB' && fxQuoteActive && fxQuote

  if (!transferMode && !fxMode) return null

  if (transferMode) {
    const { isPending, isError, isSuccess, error, data } = preview
    return (
      <div className="rub-deposit-preview" aria-live="polite">
        <p className="rub-deposit-preview__title">{title}</p>
        {isPending && (
          <div className="rub-deposit-preview__loading">
            <Spinner size="small" />
            <span>Расчёт по курсу банка…</span>
          </div>
        )}
        {isError && !isPending && (
          <p className="rub-deposit-preview__error" role="alert">
            {getApiErrorMessage(error)}
          </p>
        )}
        {isSuccess && data && (
          <div className="rub-deposit-preview__body">
            <p className="rub-deposit-preview__line">
              {variant === 'credit' ? (
                <>
                  На счёт поступит{' '}
                  <strong>
                    {formatAmt(data.credit_amount)} {data.to_currency}
                  </strong>
                </>
              ) : (
                <>
                  Со счёта спишется{' '}
                  <strong>
                    {formatAmt(data.credit_amount)} {data.to_currency}
                  </strong>
                </>
              )}
              {data.from_currency !== data.to_currency ? (
                <>
                  <br />
                  <span className="rub-deposit-preview__rate">
                    Курс: 1 {data.from_currency} ={' '}
                    {data.rate.toLocaleString('ru-RU', {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 6,
                    })}{' '}
                    {data.to_currency}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        )}
      </div>
    )
  }

  const q = fxQuote!
  const fxLoading = q.isPending || q.isFetching
  return (
    <div className="rub-deposit-preview" aria-live="polite">
      <p className="rub-deposit-preview__title">{title}</p>
      {fxLoading && (
        <div className="rub-deposit-preview__loading">
          <Spinner size="small" />
          <span>Расчёт по курсу банка…</span>
        </div>
      )}
      {q.isError && !fxLoading && (
        <p className="rub-deposit-preview__error" role="alert">
          {getApiErrorMessage(q.error)}
        </p>
      )}
      {q.isSuccess && q.data && (
        <div className="rub-deposit-preview__body">
          <p className="rub-deposit-preview__line">
            {variant === 'credit' ? (
              <>
                Ориентировочно на счёт поступит{' '}
                <strong>
                  {formatAmt(q.data.result_amount)} {q.data.to_currency}
                </strong>
              </>
            ) : (
              <>
                Ориентировочно со счёта спишется{' '}
                <strong>
                  {formatAmt(q.data.result_amount)} {q.data.to_currency}
                </strong>
              </>
            )}
            {q.data.from_currency !== q.data.to_currency ? (
              <>
                <br />
                <span className="rub-deposit-preview__rate">
                  Курс: 1 {q.data.from_currency} ={' '}
                  {q.data.rate.toLocaleString('ru-RU', {
                    minimumFractionDigits: 4,
                    maximumFractionDigits: 6,
                  })}{' '}
                  {q.data.to_currency}
                </span>
              </>
            ) : null}
          </p>
        </div>
      )}
    </div>
  )
}
