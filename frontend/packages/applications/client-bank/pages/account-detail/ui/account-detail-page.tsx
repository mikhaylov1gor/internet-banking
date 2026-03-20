import React from 'react'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import {DesktopPagination, MobilePagination} from '@shared/ui/pagination'
import { Modal } from '@shared/ui/modal'
import { Select } from '@shared/ui/select'
import { OperationCard } from '@shared/ui/operation-card'
import { useAccountDetailPage } from '../model/use-account-detail-page'
import './style.css'
import {isMobile} from "../../../main";

export const AccountDetailPage: React.FC = () => {
  const {
    account,
    accountLoading,
    accountError,
    operations,
    operationsLoading,
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
    limit,
    setLimit,
    page,
    setPage,
    handleCloseAccount,
    closeAccountMutation,
    depositMutation,
    withdrawMutation,
    handleDeposit,
    handleWithdraw,
    handleBack,
    navigate,
    totalPages,
  } = useAccountDetailPage()

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
        message="Счёт с указанным ID не существует или был удалён"
        onGoBack={() => navigate('/accounts')}
      />
    )
  }

  const Pagination = isMobile ? MobilePagination : DesktopPagination

  return (
    <div className="account-detail-page-container">
      <Button variant="secondary" onClick={handleBack} className="account-detail-page-back-button">
        ← Назад
      </Button>

      <div className="account-detail-page-account-info">
        <h1 className="account-detail-page-title">Счёт #{account.id.slice(0, 8)}...</h1>
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
            <Button onClick={() => setShowDepositModal(true)}>Пополнить счет</Button>
            <Button variant="secondary" onClick={() => setShowWithdrawModal(true)}>
              Снять деньги
            </Button>
            <div className="close-account-wrapper">
              <Button 
                variant="danger" 
                onClick={() => setShowConfirm(true)}
                disabled={account.balance !== 0}
                title={account.balance !== 0 ? 'Можно закрыть при нулевом балансе' : ''}
              >
                Закрыть счёт
              </Button>
              {account.balance !== 0 && (
                <span className="close-account-hint">*Можно закрыть при нулевом балансе</span>
              )}
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="confirmOverlay">
          <div className="confirmBox">
            <h3>Подтверждение закрытия счёта</h3>
            <p>Вы уверены, что хотите закрыть этот счёт? Баланс должен быть нулевым.</p>
            <div className="confirmActions">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                Нет
              </Button>
              <Button variant="danger" onClick={handleCloseAccount} disabled={closeAccountMutation.isPending}>
                {closeAccountMutation.isPending ? 'Закрытие...' : 'Да, закрыть'}
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
        title="Пополнить счет"
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
                : 'Ошибка пополнения счета'}
            </div>
          )}
          <div className="modalActions">
            <Button variant="secondary" onClick={() => setShowDepositModal(false)}>
              Отмена
            </Button>
            <Button onClick={handleDeposit} disabled={depositMutation.isPending || !depositAmount}>
              {depositMutation.isPending ? 'Пополнение...' : 'Пополнить'}
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
        title="Снять деньги"
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
            placeholder={account ? `Максимум: ${account.balance.toLocaleString()} ${account.currency || 'RUB'}` : 'Введите сумму'}
          />
          {withdrawAmount && account && parseFloat(withdrawAmount) > account.balance && (
            <div className="error" style={{ marginTop: '10px' }}>
              Сумма снятия не может превышать баланс счета ({account.balance.toLocaleString()} {account.currency || 'RUB'})
            </div>
          )}
          {withdrawMutation.isError && (
            <div className="error">
              {withdrawMutation.error instanceof Error
                ? withdrawMutation.error.message
                : 'Ошибка снятия денег'}
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
              {withdrawMutation.isPending ? 'Снятие...' : 'Снять'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="operations">
        <div className="operationsHeader">
          <h2 className="subtitle">История операций</h2>
          <Select
            value={limit.toString()}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
            options={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
            ]}
          />
        </div>

        {operationsLoading && (
          <div className="loading">
            <Spinner />
          </div>
        )}

        {operations && operations.length === 0 && <div className="empty">Операции не найдены</div>}

        {operations && operations.length > 0 && (
          <>
            <div className="operationsList">
              {operations.map((operation) => (
                <OperationCard
                  key={operation.id}
                  operation={operation}
                  currency={account.currency || 'RUB'}
                />
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={limit}
              onItemsPerPageChange={(newLimit) => {
                setLimit(newLimit)
                setPage(1)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

