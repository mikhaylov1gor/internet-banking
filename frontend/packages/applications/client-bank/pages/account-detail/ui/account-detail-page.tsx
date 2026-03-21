import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { Modal } from '@shared/ui/modal'
import { OperationCard } from '@shared/ui/operation-card'
import { useTheme } from '@shared/features/theme'
import { CopyableId } from '@shared/ui/copyable-id'
import { useAccountDetailPage } from '../model/use-account-detail-page'
import './style.css'

export const AccountDetailPage = () => {
  const { hideAccountsFeatureEnabled, hiddenAccountIds, toggleHiddenAccount } = useTheme()
  const {
    account,
    accountLoading,
    accountError,
    operations,
    operationsLoading,
    operationsError,
    operationsFetchError,
    operationsPage,
    operationsTotalPages,
    goPrevOperationsPage,
    goNextOperationsPage,
    showConfirm,
    setShowConfirm,
    showDepositModal,
    setShowDepositModal,
    showWithdrawModal,
    setShowWithdrawModal,
    depositAmount,
    setDepositAmount,
    withdrawAmount,
    setWithdrawAmount,
    handleCloseAccount,
    closeAccountMutation,
    depositMutation,
    withdrawMutation,
    handleDeposit,
    handleWithdraw,
    handleBack,
    navigate,
    otherActiveAccounts,
  } = useAccountDetailPage()

  const isAccountHidden = account ? hiddenAccountIds.includes(account.id) : false

  if (accountLoading) {
    return (
      <div className="account-detail-page-loading">
        <Spinner size="large" />
      </div>
    )
  }

  if (accountError || !account) {
    return (
      <ErrorFallback
        title="Счёт не найден"
        message="Счёт с указанным ID не найден или у вас нет доступа к нему"
        onGoBack={() => navigate('/accounts')}
      />
    )
  }

  return (
    <div className="account-detail-page-container">
      <Button variant="secondary" onClick={handleBack} className="account-detail-page-back-button">
        Назад
      </Button>

      <div className="account-detail-page-account-info">
        <div className="account-detail-page-card-header">
          <h1 className="account-detail-page-title">
            <span className="account-detail-page-title-gradient">Счёт</span>
            <CopyableId
              className="account-detail-page-title-gradient account-detail-page-title-id"
              copyText={account.id}
              toastOk="Номер счёта скопирован"
              title="Скопировать полный номер счёта"
            >
              {` #${account.id.slice(0, 8)}…`}
            </CopyableId>
          </h1>
          {hideAccountsFeatureEnabled && (
            <button
              type="button"
              className={`account-detail-page-eye-btn ${isAccountHidden ? 'account-detail-page-eye-btn--hidden' : ''}`}
              onClick={() => toggleHiddenAccount(account.id)}
              title={isAccountHidden ? 'Показать счёт в списке' : 'Скрыть счёт из списка'}
              aria-label={isAccountHidden ? 'Показать счёт в списке' : 'Скрыть счёт из списка'}
            >
              {isAccountHidden ? (
                <svg
                  className="account-detail-page-eye-icon"
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden={true}
                >
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.43 13.43 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              ) : (
                <svg
                  className="account-detail-page-eye-icon"
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden={true}
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
        <div className="account-detail-page-details">
          <div className="account-detail-page-detail-item">
            <span className="account-detail-page-label">Баланс:</span>
            <span className="account-detail-page-balance">
              {account.balance.toLocaleString()} {account.currency || 'RUB'}
            </span>
          </div>
          <div className="account-detail-page-detail-item">
            <span className="account-detail-page-label">Статус:</span>
            <span className={account.status === 'active' ? 'account-detail-page-active' : 'account-detail-page-closed'}>
              {account.status === 'active' ? 'Активен' : 'Закрыт'}
            </span>
          </div>
          <div className="account-detail-page-detail-item">
            <span className="account-detail-page-label">Открыт:</span>
            <span>{new Date(account.opened_at).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>

        {account.status === 'active' && (
          <div className="actions">
            <div className="account-detail-hover-hint-wrap">
              <Button onClick={() => setShowDepositModal(true)}>Пополнить счёт</Button>
              <div className="account-detail-hover-hint" role="tooltip">
                <p className="account-detail-hover-hint-title">Способ пополнения</p>
                <div className="account-detail-hover-hint-actions">
                  <Button
                    type="button"
                    size="small"
                    variant="secondary"
                    className="account-detail-hover-hint-btn"
                    onClick={() => setShowDepositModal(true)}
                  >
                    Деньги из воздуха
                  </Button>
                  <Button
                    type="button"
                    size="small"
                    variant="secondary"
                    className="account-detail-hover-hint-btn"
                    disabled={otherActiveAccounts.length === 0}
                    title={
                      otherActiveAccounts.length === 0 ? 'Нет другого активного счёта' : undefined
                    }
                    onClick={() => navigate(`/transfer?to=${account.id}`)}
                  >
                    Пополнить с другого счёта
                  </Button>
                  {otherActiveAccounts.length === 0 && (
                    <p className="account-detail-hover-hint-empty">Нет другого активного счёта.</p>
                  )}
                </div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setShowWithdrawModal(true)}>
              Снять средства
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/transfer?from=${account.id}`)}>
              Перевести
            </Button>
            <div className="close-account-wrapper">
              <Button
                variant="danger"
                onClick={() => setShowConfirm(true)}
                disabled={account.balance !== 0}
                title={account.balance !== 0 ? 'Нельзя закрыть счёт с ненулевым балансом' : ''}
              >
                Закрыть счёт
              </Button>
              {account.balance !== 0 && (
                <span className="close-account-hint">*Нельзя закрыть счёт с ненулевым балансом</span>
              )}
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="confirmOverlay">
          <div className="confirmBox">
            <h3>Подтвердите закрытие счёта</h3>
            <p>Вы уверены, что хотите закрыть этот счёт? Баланс должен быть нулевым.</p>
            <div className="confirmActions">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                Нет
              </Button>
              <Button variant="danger" onClick={handleCloseAccount} disabled={closeAccountMutation.isPending}>
                {closeAccountMutation.isPending ? 'Закрываем...' : 'Да, закрыть'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false)
          setDepositAmount('')
        }}
        title="Пополнить счёт"
      >
        <div className="deposit-form">
          <Input
            label="Сумма"
            type="number"
            min="0.01"
            step="0.01"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Введите сумму"
          />
          {depositMutation.isError && (
            <div className="error">
              {depositMutation.error instanceof Error
                ? depositMutation.error.message
                : 'Ошибка пополнения счёта'}
            </div>
          )}
          <div className="modalActions">
            <Button variant="secondary" onClick={() => setShowDepositModal(false)}>
              Отмена
            </Button>
            <Button onClick={handleDeposit} disabled={depositMutation.isPending || !depositAmount}>
              {depositMutation.isPending ? 'Пополняем...' : 'Пополнить'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false)
          setWithdrawAmount('')
        }}
        title="Снять средства"
      >
        <div className="withdraw-form">
          <Input
            label="Сумма"
            type="number"
            min="0.01"
            step="0.01"
            max={account?.balance}
            value={withdrawAmount}
            onChange={(e) => {
              const value = e.target.value
              const numValue = parseFloat(value)
              if (value === '' || (numValue > 0 && account && numValue <= account.balance)) {
                setWithdrawAmount(value)
              }
            }}
            placeholder={account ? `Доступно: ${account.balance.toLocaleString()} ${account.currency || 'RUB'}` : 'Введите сумму'}
          />
          {withdrawAmount && account && parseFloat(withdrawAmount) > account.balance && (
            <div className="error" style={{ marginTop: '10px' }}>
              Сумма не может быть больше доступного баланса ({account.balance.toLocaleString()} {account.currency || 'RUB'})
            </div>
          )}
          {withdrawMutation.isError && (
            <div className="error">
              {withdrawMutation.error instanceof Error
                ? withdrawMutation.error.message
                : 'Ошибка снятия средств'}
            </div>
          )}
          <div className="modalActions">
            <Button variant="secondary" onClick={() => setShowWithdrawModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={
                withdrawMutation.isPending ||
                !withdrawAmount ||
                !account ||
                parseFloat(withdrawAmount) <= 0 ||
                parseFloat(withdrawAmount) > account.balance
              }
            >
              {withdrawMutation.isPending ? 'Снимаем...' : 'Снять'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="operations">
        <div className="operationsHeader">
          <h2 className="subtitle">История операций</h2>
        </div>

        {operationsError && (
          <div className="error" style={{ marginBottom: '12px' }}>
            {operationsFetchError instanceof Error
              ? operationsFetchError.message
              : 'Не удалось загрузить операции'}
          </div>
        )}

        {operationsLoading && (
          <div className="loading">
            <Spinner />
          </div>
        )}

        {!operationsLoading && !operationsError && operations.length === 0 && (
          <div className="empty">Операции не найдены</div>
        )}

        {!operationsError && operations.length > 0 && (
          <div className="operationsList">
            {operations.map((operation) => (
              <OperationCard
                key={operation.id}
                operation={operation}
                currency={account.currency || 'RUB'}
              />
            ))}
          </div>
        )}

        {!operationsLoading && !operationsError && operationsTotalPages > 1 && (
          <div className="operations-pagination">
            <Button
              type="button"
              variant="secondary"
              disabled={operationsPage <= 1}
              onClick={goPrevOperationsPage}
            >
              Назад
            </Button>
            <span className="operations-pagination-info">
              Страница {operationsPage} из {operationsTotalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={operationsPage >= operationsTotalPages}
              onClick={goNextOperationsPage}
            >
              Вперёд
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
