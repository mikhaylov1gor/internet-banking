import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Select } from '@shared/ui/select'
import { Spinner } from '@shared/ui/spinner'
import { ErrorFallback } from '@shared/ui/error-fallback'
import { DesktopPagination } from '@shared/ui/pagination'
import { Modal } from '@shared/ui/modal'
import { EmailInput } from '@shared/ui/email-input'
import { PhoneInput } from '@shared/ui/phone-input'
import { PasswordInput } from '@shared/ui/password-input'
import { getCurrentUserId } from '@shared/features/auth'
import { useUsersPage } from '../model/use-users-page'
import './style.css'

export const DesktopUsersPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    userId,
    setUserId,
    error,
    setError,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    limit,
    setLimit,
    showCreateModal,
    setShowCreateModal,
    createForm,
    setCreateForm,
    emailValid,
    setEmailValid,
    phoneValid,
    setPhoneValid,
    fullNameValid,
    setFullNameValid,
    fullNameTouched,
    setFullNameTouched,
    passwordValid,
    setPasswordValid,
    passwordTouched,
    setPasswordTouched,
    users,
    isLoading,
    usersError,
    createUserMutation,
    toggleStatusMutation,
    handleSearch,
    handleCreateUser,
    handleToggleStatus,
    totalPages,
  } = useUsersPage()

  return (
    <div className="users-page-container desktop-users-page">
      <h1 className="users-page-title">Список пользователей</h1>

      <div className="users-page-search-section">
        <div className="users-page-search-box">
          <Input
            placeholder="Введите ID пользователя"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value)
              setError('')
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            error={error || undefined}
          />
          <Button onClick={handleSearch}>Найти</Button>
        </div>
      </div>

      <div className="users-page-filters-section">
        <div className="users-page-filters">
          <div className="users-page-filter-buttons">
            <Button
              variant={typeFilter === 'all' ? 'primary' : 'secondary'}
              onClick={() => setTypeFilter('all')}
            >
              Все
            </Button>
            <Button
              variant={typeFilter === 'client' ? 'primary' : 'secondary'}
              onClick={() => setTypeFilter('client')}
            >
              Клиенты
            </Button>
            <Button
              variant={typeFilter === 'employee' ? 'primary' : 'secondary'}
              onClick={() => setTypeFilter('employee')}
            >
              Сотрудники
            </Button>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'blocked')}
            options={[
              { value: 'all', label: 'Все статусы' },
              { value: 'active', label: 'Активные' },
              { value: 'blocked', label: 'Заблокированные' },
            ]}
          />
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Создать пользователя</Button>
      </div>

      {isLoading && (
        <div className="users-page-loading">
          <Spinner />
        </div>
      )}

      {usersError && (
        <ErrorFallback
          title="Ошибка загрузки"
          message="Не удалось загрузить список пользователей"
          onRetry={() => window.location.reload()}
        />
      )}

      {!isLoading && users.length === 0 && (
        <div className="users-page-empty">Пользователи не найдены</div>
      )}

      {users.length > 0 && (
        <>
          <div className="users-page-list desktop-users-list">
            {users.map((user) => (
              <div
                key={user.id}
                className="users-page-user-card desktop-user-card"
                onClick={() => navigate(`/users/${user.id}`)}
              >
                <div className="users-page-user-info">
                  <div className="users-page-user-name">{user.full_name || user.email}</div>
                  <div className="users-page-user-details">
                    <span>Email: {user.email}</span>
                    <span>Тип: {user.type === 'client' ? 'Клиент' : 'Сотрудник'}</span>
                    <span className={user.status === 'active' ? 'users-page-status-active' : 'users-page-status-blocked'}>
                      Статус: {user.status === 'active' ? 'Активен' : 'Заблокирован'}
                    </span>
                    {user.phone && <span>Телефон: {user.phone}</span>}
                  </div>
                </div>
                <Button
                  variant={user.status === 'active' ? 'danger' : 'primary'}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleStatus(user.id, user.status)
                  }}
                  disabled={toggleStatusMutation.isPending || user.id === getCurrentUserId()}
                >
                  {user.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                </Button>
              </div>
            ))}
          </div>
          <DesktopPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={limit}
            onItemsPerPageChange={setLimit}
          />
        </>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setCreateForm({ type: 'client', email: '', full_name: '', phone: '', password: '' })
          setEmailValid(false)
          setPhoneValid(true)
          setFullNameValid(false)
          setFullNameTouched(false)
          setPasswordValid(false)
          setPasswordTouched(false)
        }}
        title="Создать пользователя"
      >
        <div className="users-page-create-form">
          <Select
            label="Тип"
            value={createForm.type}
            onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as 'client' | 'employee' })}
            options={[
              { value: 'client', label: 'Клиент' },
              { value: 'employee', label: 'Сотрудник' },
            ]}
          />
          <EmailInput
            label="Email"
            value={createForm.email}
            onChange={(e) => {
              setCreateForm({ ...createForm, email: e.target.value })
              if (emailValid) {
                setEmailValid(true)
              }
            }}
            onValidationChange={setEmailValid}
            required
          />
          <Input
            label="Полное имя"
            value={createForm.full_name}
            onChange={(e) => {
              const value = e.target.value
              setCreateForm({ ...createForm, full_name: value })
              if (fullNameTouched && (fullNameValid || value.trim())) {
                setFullNameValid(!!value.trim())
              }
            }}
            onBlur={() => {
              setFullNameTouched(true)
              const isValid = !!createForm.full_name.trim()
              setFullNameValid(isValid)
            }}
            error={!fullNameValid && fullNameTouched ? 'Полное имя обязательно' : undefined}
            required
          />
          <PhoneInput
            label="Телефон"
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            onValidationChange={setPhoneValid}
          />
          <PasswordInput
            label="Пароль"
            value={createForm.password}
            onChange={(e) => {
              const value = e.target.value
              setCreateForm({ ...createForm, password: value })
              if (passwordTouched && (passwordValid || value.trim())) {
                setPasswordValid(!!value.trim())
              }
            }}
            onBlur={() => {
              setPasswordTouched(true)
              const isValid = !!createForm.password.trim()
              setPasswordValid(isValid)
            }}
            error={!passwordValid && passwordTouched ? 'Пароль обязателен' : undefined}
            required
          />
          {createUserMutation.isError && (
            <div className="users-page-error">
              {(() => {
                const error = createUserMutation.error as any
                if (error?.response?.data?.error) {
                  const apiError = error.response.data.error
                  if (apiError === 'email already exists' || apiError.includes('email already exists')) {
                    return 'Email уже занят'
                  }
                  return apiError
                }
                if (error instanceof Error) {
                  return error.message
                }
                return 'Ошибка создания пользователя'
              })()}
            </div>
          )}
          <div className="users-page-modal-actions">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!emailValid || !fullNameValid || !phoneValid || !passwordValid || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

