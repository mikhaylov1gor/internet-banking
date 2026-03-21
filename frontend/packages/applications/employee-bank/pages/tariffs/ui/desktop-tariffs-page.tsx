import { Input } from '@shared/ui/input'
import { Button } from '@shared/ui/button'
import { Spinner } from '@shared/ui/spinner'
import { DesktopPagination } from '@shared/ui/pagination'
import { Modal } from '@shared/ui/modal'
import { useTariffsPage } from '../model/use-tariffs-page'
import './style.css'

export const DesktopTariffsPage = () => {
  const {
    name,
    setName,
    rate,
    setRate,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    tariffs,
    isLoading,
    createTariffMutation,
    handleSubmit,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    showModal,
    handleOpenModal,
    handleCloseModal,
    errors,
    setErrors,
    handleBlur,
  } = useTariffsPage()

  return (
    <div className="tariffs-page-container desktop-tariffs-page">
      <div className="tariffs-page-header">
        <h1 className="tariffs-page-title">Тарифы кредитов</h1>
        <Button onClick={handleOpenModal}>Создать новый тариф</Button>
      </div>

      <div className="content">
        <div className="listSection">
          {isLoading && (
            <div className="loading">
              <Spinner />
            </div>
          )}
          {tariffs && tariffs.length === 0 && (
            <div className="empty">Тарифы не найдены</div>
          )}
          {tariffs && tariffs.length > 0 && (
            <div className="list desktop-tariffs-list">
              {tariffs.map((tariff) => (
                <div key={tariff.id} className="tariffCard desktop-tariffCard">
                  <h3 className="tariffName">{tariff.name}</h3>
                  <div className="tariffDetails">
                    <div>Ставка: {(tariff.rate * 100).toFixed(2)}%</div>
                    {tariff.min_amount && tariff.max_amount && (
                      <div>
                        Сумма от {tariff.min_amount.toLocaleString()} до {tariff.max_amount.toLocaleString()} ₽
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="paginationSection">
        <DesktopPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          itemsPerPage={limit}
          onItemsPerPageChange={(newLimit) => {
            setLimit(newLimit)
            setPage(1)
          }}
        />
      </div>  

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Создать новый тариф">
        <form onSubmit={handleSubmit} className="tariffs-page-form">
          <Input
            label="Название"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) {
                setErrors((prevErrors) => ({ ...prevErrors, name: undefined }))
              }
            }}
            onBlur={() => handleBlur('name')}
            error={errors.name}
            required
          />
          <Input
            label="Процентная ставка (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={rate}
            onChange={(e) => {
              setRate(e.target.value)
              if (errors.rate) {
                setErrors((prevErrors) => ({ ...prevErrors, rate: undefined }))
              }
            }}
            onBlur={() => handleBlur('rate')}
            error={errors.rate}
            required
          />
          <Input
            label="Минимальная сумма"
            type="number"
            min="0"
            value={minAmount}
            onChange={(e) => {
              setMinAmount(e.target.value)
              if (errors.minAmount) {
                setErrors((prevErrors) => ({ ...prevErrors, minAmount: undefined }))
              }
            }}
            onBlur={() => handleBlur('minAmount')}
            error={errors.minAmount}
            required
          />
          <Input
            label="Максимальная сумма"
            type="number"
            min="0"
            value={maxAmount}
            onChange={(e) => {
              setMaxAmount(e.target.value)
              if (errors.maxAmount) {
                setErrors((prevErrors) => ({ ...prevErrors, maxAmount: undefined }))
              }
            }}
            onBlur={() => handleBlur('maxAmount')}
            error={errors.maxAmount}
            required
          />
          {createTariffMutation.isError && (
            <div className="tariffs-page-error">
              {createTariffMutation.error instanceof Error
                ? createTariffMutation.error.message
                : 'Ошибка создания тарифа'}
            </div>
          )}
          <div className="modalActions">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button type="submit" disabled={createTariffMutation.isPending}>
              {createTariffMutation.isPending ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

