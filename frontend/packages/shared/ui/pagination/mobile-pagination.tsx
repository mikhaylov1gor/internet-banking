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

export const MobilePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
}: PaginationProps) => {
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
    <div className="pagination-container mobile-pagination">
      {itemsPerPage && onItemsPerPageChange && (
        <div className="pagination-items-per-page mobile-pagination-items">
          <label>На странице:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="pagination-select mobile-pagination-select"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="pagination-controls mobile-pagination-controls">
        <Button
          variant="secondary"
          size="small"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="mobile-pagination-button"
        >
          ←
        </Button>
        <span className="pagination-page-info mobile-pagination-info">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="small"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="mobile-pagination-button"
        >
          →
        </Button>
      </div>
    </div>
  )
}

