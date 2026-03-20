import React from 'react'
import { Button } from '../button'
import './style.css'

export type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  onItemsPerPageChange?: (itemsPerPage: number) => void
  itemsPerPageOptions?: number[]
}

export const DesktopPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className="pagination-container desktop-pagination">
      {itemsPerPage && onItemsPerPageChange && (
        <div className="pagination-items-per-page">
          <label>Записей на странице:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="pagination-select"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="pagination-controls">
        <Button
          variant="secondary"
          size="small"
          onClick={handlePrevious}
          disabled={currentPage === 1}
        >
          Назад
        </Button>
        <span className="pagination-page-info">
          Страница {currentPage} из {totalPages}
        </span>
        <Button
          variant="secondary"
          size="small"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          Вперед
        </Button>
      </div>
    </div>
  )
}

