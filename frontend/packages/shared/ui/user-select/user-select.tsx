import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsers, type GetUsersParams } from '@shared/api/endpoints/users'
import { Spinner } from '@shared/ui/spinner'
import type { User } from '@shared/api/endpoints/users'
import './style.css'

export type UserSelectProps = {
  value: string
  onChange: (userId: string) => void
  label?: string
  className?: string
}

export const UserSelect: React.FC<UserSelectProps> = ({ value, onChange, label, className }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const pageSize = 20

  const { data: usersResponse, isLoading, isFetching } = useQuery({
    queryKey: ['users', { type: 'client', status: 'active', page, page_size: pageSize }],
    queryFn: () => getUsers({ type: 'client', status: 'active', page, page_size: pageSize }),
  })

  const users = usersResponse?.users || []

  useEffect(() => {
    if (users && users.length > 0) {
      if (page === 1) {
        const selected = value && selectedUserData ? selectedUserData : null
        const newList = [...users]
        if (selected && !newList.find((u) => u.id === selected.id)) {
          newList.unshift(selected)
        }
        setAllUsers(newList)
      } else {
        setAllUsers((prev) => {
          const existingIds = new Set(prev.map((u) => u.id))
          const newUsers = users.filter((u) => !existingIds.has(u.id))
          return [...prev, ...newUsers]
        })
      }
      
      if (value) {
        const found = users.find((u) => u.id === value)
        if (found) {
          setSelectedUserData(found)
        }
      }
    }
  }, [users, page, value, selectedUserData])

  const filteredUsers = allUsers.filter((user) => {
    const query = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      (user.full_name && user.full_name.toLowerCase().includes(query))
    )
  })

  const handleScroll = useCallback(() => {
    if (!listRef.current || !isOpen || isFetching) return

    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    if (scrollPercentage > 0.8 && users && users.length === pageSize) {
      setPage((prev) => prev + 1)
    }
  }, [isOpen, isFetching, users, pageSize])

  useEffect(() => {
    const listElement = listRef.current
    if (listElement && isOpen) {
      listElement.addEventListener('scroll', handleScroll)
      return () => listElement.removeEventListener('scroll', handleScroll)
    }
  }, [isOpen, handleScroll])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (!value) {
      setSelectedUserData(null)
    } else if (selectedUserData?.id !== value) {
      const found = allUsers.find((u) => u.id === value)
      if (found) {
        setSelectedUserData(found)
      }
    }
  }, [value, allUsers, selectedUserData])

  const selectedUser = selectedUserData || allUsers.find((u) => u.id === value)

  const handleSelect = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId)
    if (user) {
      setSelectedUserData(user)
    }
    onChange(userId)
    setIsOpen(false)
    setSearchQuery('')
  }

  useEffect(() => {
    if (isOpen && page === 1) {
      const hasOnlySelected = allUsers.length === 1 && value && allUsers[0]?.id === value
      if (allUsers.length === 0 || hasOnlySelected) {
        const selected = value && selectedUserData ? selectedUserData : null
        setAllUsers(selected ? [selected] : [])
      }
    }
  }, [isOpen, page, allUsers, value, selectedUserData])

  const handleToggle = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    
    if (newIsOpen) {
      if (page !== 1) {
        setPage(1)
      }
    } else {
      setSearchQuery('')
      if (page !== 1) {
        setPage(1)
      }
    }
  }

  return (
    <div className={`user-select-container ${className || ''}`} ref={containerRef}>
      {label && <label className="user-select-label">{label}</label>}
      <div className="user-select-wrapper">
        <button
          type="button"
          className={`user-select-button ${isOpen ? 'user-select-button-open' : ''}`}
          onClick={handleToggle}
        >
          <span className="user-select-button-text">
            {selectedUser
              ? selectedUser.full_name || selectedUser.email
              : 'Выберите пользователя'}
          </span>
          <div className="user-select-button-actions">
            {value && (
              <button
                type="button"
                className="user-select-clear"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedUserData(null)
                  onChange('')
                }}
                title="Очистить выбор"
              >
                ×
              </button>
            )}
            <svg
              className={`user-select-arrow ${isOpen ? 'user-select-arrow-open' : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path d="M6 9L1 4h10z" fill="#2563eb" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="user-select-dropdown">
            <div className="user-select-search">
              <input
                type="text"
                className="user-select-search-input"
                placeholder="Поиск по имени или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="user-select-list" ref={listRef}>
              {isLoading && page === 1 ? (
                <div className="user-select-loading">
                  <Spinner />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="user-select-empty">Пользователи не найдены</div>
              ) : (
                <>
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`user-select-option ${value === user.id ? 'user-select-option-selected' : ''}`}
                      onClick={() => handleSelect(user.id)}
                    >
                      <div className="user-select-option-name">
                        {user.full_name || user.email}
                      </div>
                      {user.full_name && (
                        <div className="user-select-option-email">{user.email}</div>
                      )}
                    </div>
                  ))}
                  {isFetching && page > 1 && (
                    <div className="user-select-loading-more">
                      <Spinner />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

