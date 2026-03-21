import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@shared/api/endpoints/users'
import type { User } from '@shared/api/endpoints/users'

const PAGE_SIZE = 20

export const useUserSelect = (value: string, onChange: (userId: string) => void) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { data: usersResponse, isLoading, isFetching } = useQuery({
    queryKey: ['users', { type: 'client', status: 'active', page, page_size: PAGE_SIZE }],
    queryFn: () => getUsers({ type: 'client', status: 'active', page, page_size: PAGE_SIZE }),
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

    if (scrollPercentage > 0.8 && users && users.length === PAGE_SIZE) {
      setPage((prev) => prev + 1)
    }
  }, [isOpen, isFetching, users])

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

  useEffect(() => {
    if (isOpen && page === 1) {
      const hasOnlySelected = allUsers.length === 1 && value && allUsers[0]?.id === value
      if (allUsers.length === 0 || hasOnlySelected) {
        const selected = value && selectedUserData ? selectedUserData : null
        setAllUsers(selected ? [selected] : [])
      }
    }
  }, [isOpen, page, allUsers, value, selectedUserData])

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

  const clearSelection = () => {
    setSelectedUserData(null)
    onChange('')
  }

  return {
    searchQuery,
    setSearchQuery,
    isOpen,
    page,
    isLoading,
    isFetching,
    filteredUsers,
    selectedUser,
    containerRef,
    listRef,
    handleSelect,
    handleToggle,
    clearSelection,
  }
}
