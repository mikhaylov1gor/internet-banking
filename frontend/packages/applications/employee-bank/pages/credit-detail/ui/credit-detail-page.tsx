import { useLocation } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { getLoadDataErrorMessage, isNotFoundError } from '@shared/api'
import { CopyableId } from '@shared/ui/copyable-id'
import { formatShortId } from '@shared/utils/format-short-id'
import { useCreditDetailPage } from '../model/use-credit-detail-page'
import './style.css'

const formatMoney = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatCreditIssueDay = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })

const formatPaymentDueDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const paymentStatusLabel = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Внесено'
    case 'partial':
      return 'Частично'
    case 'overdue':
      return 'Просрочено'
    case 'pending':
    default:
      return 'Ожидает'
  }
}

export const CreditDetailPage = () => {
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string })?.returnTo
  const {
    credit,
    creditLoading,
    creditError,
    client,
    clientLoading,
    clientLoadError,
    tariff,
    tariffLoading,
    tariffLoadError,
    navigate,
    creditPayments,
    creditPaymentsLoading,
    creditPaymentsError,
    paymentsPage,
    setPaymentsPage,
    paymentsPageQuantity,
    onlyOverduePayments,
    setOnlyOverduePayments,
    paymentsEnabled,
  } = useCreditDetailPage()

  if (creditLoading || clientLoading || tariffLoading) {
    return (
      <div className="credit-detail-page-loading">
        <Spinner size="large" />
      </div>
    )
  }

  if (creditError && isNotFoundError(creditError)) {
    return (
      <ErrorFallback
        title="Кредит не найден"
        message="Кредит с указанным ID не существует или был удалён"
        onGoBack={() => navigate(returnTo || '/credits')}
      />
    )
  }

  if (creditError || !credit) {
    return (
      <ErrorFallback
        title="Ошибка загрузки"
        message={getLoadDataErrorMessage('данные кредита')}
        onGoBack={() => navigate(returnTo || '/credits')}
      />
    )
  }

  return (
    <div className="credit-detail-page-container">
      <Button variant="secondary" onClick={() => navigate(returnTo || '/credits')} className="credit-detail-page-back-button">
        ← Назад
      </Button>

      {(clientLoadError || tariffLoadError) && (
        <div className="credit-detail-page-inline-errors" role="alert">
          {clientLoadError && <p>{getLoadDataErrorMessage('данные клиента')}</p>}
          {tariffLoadError && <p>{getLoadDataErrorMessage('данные тарифа')}</p>}
        </div>
      )}

      <div className="credit-detail-page-credit-info">
        <h1 className="credit-detail-page-title">
          <span>Кредит</span>{' '}
          <CopyableId
            className="credit-detail-page-title-id"
            copyText={credit.id}
            toastOk="Номер кредита скопирован"
            title="Скопировать полный номер кредита"
          >
            #{formatShortId(credit.id)}
          </CopyableId>
        </h1>
        <div className="credit-detail-page-details">
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Клиент:</span>
            <span
              onClick={() => navigate(`/users/${credit.client_id}`, { state: { returnTo: `/credits/${credit.id}` } })}
              className="credit-detail-page-clickable"
              title={client ? undefined : credit.client_id}
            >
              {client ? (client.full_name || client.email) : formatShortId(credit.client_id)}
            </span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Тариф:</span>
            <span>
              {tariff ? (
                tariff.name
              ) : (
                <CopyableId
                  className="credit-detail-page-title-id"
                  copyText={credit.tariff_id}
                  toastOk="ID тарифа скопирован"
                  title="Скопировать полный ID тарифа"
                >
                  {formatShortId(credit.tariff_id)}
                </CopyableId>
              )}
            </span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Сумма:</span>
            <span className="credit-detail-page-amount">
              {credit.amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽
            </span>
          </div>
          {(credit.term_days ?? 0) > 0 && (credit.total_due ?? 0) > 0 && (
            <div className="credit-detail-page-detail-item">
              <span className="credit-detail-page-label">К возврату с процентами:</span>
              <span>{formatMoney(Number(credit.total_due))} ₽</span>
            </div>
          )}
          {(credit.status === 'active' || credit.status === 'overdue') && (
            <div className="credit-detail-page-detail-item">
              <span className="credit-detail-page-label">Остаток:</span>
              <span className="credit-detail-page-remaining">{formatMoney(Number(credit.remaining))} ₽</span>
            </div>
          )}
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Процентная ставка:</span>
            <span>{(credit.rate * 100).toFixed(2)}%</span>
          </div>
          <div className="credit-detail-page-detail-item">
            <span className="credit-detail-page-label">Статус:</span>
            <span
              className={
                credit.status === 'active'
                  ? 'credit-detail-page-active'
                  : credit.status === 'overdue'
                    ? 'credit-detail-page-overdue'
                    : 'credit-detail-page-paid'
              }
            >
              {credit.status === 'active' ? 'Активен' : credit.status === 'overdue' ? 'Просрочен' : 'Погашен'}
            </span>
          </div>
          <div className="credit-detail-page-detail-item credit-detail-page-detail-item--issue-dates">
            <span className="credit-detail-page-label">Даты выдачи</span>
            <p className="credit-detail-page-issue-range">
              {credit.maturity_at
                ? `С ${formatCreditIssueDay(credit.issued_at)} до ${formatCreditIssueDay(credit.maturity_at)}`
                : `С ${formatCreditIssueDay(credit.issued_at)}`}
            </p>
          </div>
          {credit.paid_at && (
            <div className="credit-detail-page-detail-item">
              <span className="credit-detail-page-label">Погашен:</span>
              <span>{new Date(credit.paid_at).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
        </div>
      </div>

      {paymentsEnabled && (
        <section className="credit-detail-payments-section" aria-labelledby="credit-payments-heading">
          <div className="credit-detail-payments-head">
            <h2 id="credit-payments-heading" className="credit-detail-payments-title">
              Платежи
            </h2>
            <label className="credit-detail-payments-filter">
              <input
                type="checkbox"
                checked={onlyOverduePayments}
                onChange={(e) => setOnlyOverduePayments(e.target.checked)}
              />
              <span>Только просроченные</span>
            </label>
          </div>
          {creditPaymentsError && (
            <div className="credit-detail-page-inline-errors" role="alert">
              <p>{getLoadDataErrorMessage('платежи по кредиту')}</p>
            </div>
          )}
          {creditPaymentsLoading && (
            <div className="credit-detail-payments-loading">
              <Spinner />
            </div>
          )}
          {!creditPaymentsLoading && !creditPaymentsError && creditPayments && (
            <>
              {creditPayments.items.length === 0 ? (
                <p className="credit-detail-payments-empty">Нет платежей для отображения.</p>
              ) : (
                <ul className="credit-payments-feed" role="list">
                  {creditPayments.items.map((row) => {
                    const dueLabel = formatPaymentDueDate(row.due_at)
                    const dayLabel = row.day != null ? `День ${row.day}` : `Платёж ${row.index}`
                    const scheduleLine =
                      row.amount_due != null ? (
                        <>
                          К оплате за день: {formatMoney(row.amount_due)} ₽
                          {row.amount_paid != null && row.amount_paid > 0 && (
                            <> · внесено {formatMoney(row.amount_paid)} ₽</>
                          )}
                          {row.amount_remaining != null && row.amount_remaining > 0 && (
                            <> · осталось {formatMoney(row.amount_remaining)} ₽</>
                          )}
                        </>
                      ) : (
                        <>Накопительно по графику: {formatMoney(row.expected_total)} ₽</>
                      )
                    return (
                      <li key={`${row.index}-${row.due_at}`} className="credit-payments-feed-item">
                        <div
                          className={`credit-payments-feed-icon credit-payments-feed-icon--${row.status}`}
                          aria-hidden
                        />
                        <div className="credit-payments-feed-content">
                          <div className="credit-payments-feed-top">
                            <div className="credit-payments-feed-text">
                              <div className="credit-payments-feed-title">{dayLabel}</div>
                              <time dateTime={row.due_at} className="credit-payments-feed-date">
                                {dueLabel}
                              </time>
                              <p className="credit-payments-feed-schedule-line">{scheduleLine}</p>
                            </div>
                            <div className="credit-payments-feed-sumcol">
                              <span className="credit-payments-feed-amount">
                                Всего к этому дню: {formatMoney(row.expected_total)} ₽
                              </span>
                              <span
                                className={`credit-payments-feed-badge credit-payments-feed-badge--${row.status}`}
                              >
                                {paymentStatusLabel(row.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {paymentsPageQuantity > 1 && (
                <div className="credit-detail-payments-pagination">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={paymentsPage <= 1}
                    onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  <span className="credit-detail-payments-page-info">
                    Страница {paymentsPage} из {paymentsPageQuantity}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={paymentsPage >= paymentsPageQuantity}
                    onClick={() => setPaymentsPage((p) => p + 1)}
                  >
                    Вперёд
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}


