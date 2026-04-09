import { Spinner } from '@shared/ui/spinner'
import { useUserSelect, type UserSelectUserKind } from '../model/use-user-select'
import '../style.css'

export type UserSelectProps = {
  value: string
  onChange: (userId: string) => void
  label?: string
  className?: string
  userKind?: UserSelectUserKind
}

export const UserSelect = ({ value, onChange, label, className, userKind = 'client' }: UserSelectProps) => {
  const {
    searchQuery,
    setSearchQuery,
    isOpen,
    isLoading,
    isFetching,
    filteredUsers,
    selectedUser,
    containerRef,
    listRef,
    handleSelect,
    handleToggle,
    clearSelection,
    page,
  } = useUserSelect(value, onChange, userKind)

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
                  clearSelection()
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
