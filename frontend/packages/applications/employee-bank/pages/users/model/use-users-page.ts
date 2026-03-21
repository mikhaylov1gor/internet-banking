import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isForbiddenError, isNotFoundError, isUnauthorizedError } from '@shared/api'
import { useUsers, useCreateUser, useToggleUserStatus, verifyUserExistsForNavigation } from '../../../features/users'

export const useUsersPage = () => {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'client' | 'employee'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    type: 'client' as 'client' | 'employee',
    email: '',
    full_name: '',
    phone: '',
    password: '',
  })
  const [emailValid, setEmailValid] = useState(false)
  const [phoneValid, setPhoneValid] = useState(true)
  const [fullNameValid, setFullNameValid] = useState(false)
  const [fullNameTouched, setFullNameTouched] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  const navigate = useNavigate()

  const params = useMemo(() => {
    const result: {
      type?: 'client' | 'employee'
      status?: 'active' | 'blocked'
      page: number
      page_size: number
    } = {
      page,
      page_size: pageSize,
    }

    if (typeFilter !== 'all') {
      result.type = typeFilter
    }

    if (statusFilter !== 'all') {
      result.status = statusFilter
    }

    return result
  }, [typeFilter, statusFilter, page, pageSize])

  const { data: usersResponse, isLoading, error: usersError } = useUsers(params)

  const users = usersResponse?.users || []
  const totalPages = usersResponse?.pageQuantity || 1
  const createUserMutation = useCreateUser()
  const toggleStatusMutation = useToggleUserStatus()

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page, setPage])

  const handleSearch = async () => {
    const trimmedUserId = userId.trim()

    if (!trimmedUserId) {
      setError('Введите ID пользователя')
      return
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(trimmedUserId)) {
      setError('ID пользователя должен быть в формате UUID')
      return
    }

    try {
      await verifyUserExistsForNavigation(trimmedUserId)
      navigate(`/users/${trimmedUserId}`)
      setError('')
    } catch (err: unknown) {
      if (isNotFoundError(err)) {
        setError('Пользователь не найден')
      } else if (isForbiddenError(err)) {
        setError('Нет доступа к этому пользователю')
      } else if (isUnauthorizedError(err)) {
        setError('Необходима авторизация')
      } else {
        setError('Ошибка при поиске пользователя. Попробуйте еще раз')
      }
    }
  }

  const handleCreateUser = () => {
    if (emailValid && fullNameValid && phoneValid && passwordValid) {
      createUserMutation.mutate(createForm, {
        onSuccess: () => {
          setShowCreateModal(false)
          setCreateForm({ type: 'client', email: '', full_name: '', phone: '', password: '' })
          setEmailValid(false)
          setPhoneValid(true)
          setFullNameValid(false)
          setFullNameTouched(false)
          setPasswordValid(false)
          setPasswordTouched(false)
        },
      })
    }
  }

  const handleToggleStatus = (userId: string, currentStatus: 'active' | 'blocked') => {
    toggleStatusMutation.mutate({
      userId,
      action: currentStatus === 'active' ? 'block' : 'unblock',
    })
  }

  const handleTypeFilterChange = (newType: 'all' | 'client' | 'employee') => {
    setTypeFilter(newType)
    setPage(1)
  }

  const handleStatusFilterChange = (newStatus: 'all' | 'active' | 'blocked') => {
    setStatusFilter(newStatus)
    setPage(1)
  }

  const handleLimitChange = (newLimit: number) => {
    setPageSize(newLimit)
    setPage(1)
  }

  return {
    userId,
    setUserId,
    error,
    setError,
    typeFilter,
    setTypeFilter: handleTypeFilterChange,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    page,
    setPage,
    limit: pageSize,
    setLimit: handleLimitChange,
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
  }
}
