import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsers, useCreateUser, useToggleUserStatus } from '../../../features/users'

export const useUsersPage = () => {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'client' | 'employee'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    type: 'client' as 'client' | 'employee',
    email: '',
    full_name: '',
    phone: '',
    password: '',
  })
  const [emailValid, setEmailValid] = useState(false)
  const [phoneValid, setPhoneValid] = useState(true) // Телефон не обязателен
  const [fullNameValid, setFullNameValid] = useState(false)
  const [fullNameTouched, setFullNameTouched] = useState(false)
  const [passwordValid, setPasswordValid] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  const navigate = useNavigate()

  const params = {
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit,
    offset: (page - 1) * limit,
  }

  const { data: users, isLoading, error: usersError } = useUsers(params)
  const createUserMutation = useCreateUser()
  const toggleStatusMutation = useToggleUserStatus()

  const handleSearch = async () => {
    if (!userId.trim()) {
      setError('Введите ID пользователя')
      return
    }
    try {
      const { getUserById } = await import('../../../api/endpoints/users')
      await getUserById(userId.trim())
      navigate(`/users/${userId.trim()}`)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setError('Пользователь не существует')
      } else {
        setError('Ошибка при поиске пользователя')
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

  const totalPages = Math.ceil((users?.length || 0) / limit) || 1

  return {
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
  }
}


