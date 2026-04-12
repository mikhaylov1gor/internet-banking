import { useId } from 'react'
import type { CreditRating } from '@shared/api/endpoints/credits'
import { getLoadDataErrorMessage } from '@shared/api'
import { Spinner } from '../../spinner'
import {
  GAUGE_CX,
  GAUGE_CY,
  arcPath,
  polar,
  riskLevelHint,
  ruPaymentWord,
  scoreToRad,
} from '../model/credit-rating-gauge-helpers'
import '../style.css'

export type CreditRatingGaugeProps = {
  rating: CreditRating | undefined
  isLoading?: boolean
  isError?: boolean
  loadError?: unknown
  className?: string
  showTitle?: boolean
  showDescription?: boolean
  descriptionContext?: 'client' | 'employee'
}

export const CreditRatingGauge = ({
  rating,
  isLoading,
  isError,
  loadError,
  className = '',
  showTitle = true,
  showDescription = false,
  descriptionContext = 'client',
}: CreditRatingGaugeProps) => {
  const rawId = useId().replace(/:/g, '')
  const gradId = `crg-arc-grad-${rawId}`
  const filterId = `crg-arc-flt-${rawId}`
  const ratingHintId = `crg-rating-hint-${rawId}`

  if (isLoading) {
    return (
      <div className={`credit-rating-gauge credit-rating-gauge--loading ${className}`}>
        <Spinner />
        <span className="credit-rating-gauge__loading-text">Загрузка рейтинга…</span>
      </div>
    )
  }

  if (isError || !rating) {
    return (
      <div className={`credit-rating-gauge credit-rating-gauge--error ${className}`}>
        <p className="credit-rating-gauge__error-text">
          {getLoadDataErrorMessage('кредитный рейтинг', loadError)}
        </p>
      </div>
    )
  }

  const score = Math.max(0, Math.min(100, Math.round(rating.score)))
  const needleLen = 68
  const nd = scoreToRad(score)
  const tipX = GAUGE_CX + needleLen * Math.cos(nd)
  const tipY = GAUGE_CY - needleLen * Math.sin(nd)

  const riskClass =
    rating.risk_level === 'высокий'
      ? 'credit-rating-gauge__risk--high'
      : rating.risk_level === 'средний'
        ? 'credit-rating-gauge__risk--mid'
        : 'credit-rating-gauge__risk--low'

  const riskHint = riskLevelHint(rating.risk_level, descriptionContext)

  const pLeft = polar(0)
  const pRight = polar(100)

  return (
    <div className={`credit-rating-gauge ${className}`}>
      {showTitle && <h2 className="credit-rating-gauge__title">Кредитный рейтинг</h2>}
      <div className="credit-rating-gauge__svg-wrap">
        <svg
          className="credit-rating-gauge__svg"
          viewBox="0 0 220 125"
          width="220"
          height="125"
          aria-hidden={true}
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={pLeft.x}
              y1={pLeft.y}
              x2={pRight.x}
              y2={pRight.y}
            >
              <stop offset="0%" stopColor="var(--credit-gauge-red, #dc2626)" />
              <stop offset="40%" stopColor="var(--credit-gauge-orange, #ea580c)" />
              <stop offset="70%" stopColor="var(--credit-gauge-orange-mid, #f59e0b)" />
              <stop offset="100%" stopColor="var(--credit-gauge-green, #16a34a)" />
            </linearGradient>
            <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.14" />
            </filter>
          </defs>
          <path
            d={arcPath(0, 100)}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={18}
            strokeLinecap="round"
            filter={`url(#${filterId})`}
          />
          <line
            x1={GAUGE_CX}
            y1={GAUGE_CY}
            x2={tipX}
            y2={tipY}
            className="credit-rating-gauge__needle"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <circle cx={GAUGE_CX} cy={GAUGE_CY} r={7} className="credit-rating-gauge__pivot" />
        </svg>
        <div className="credit-rating-gauge__score-block">
          <span className="credit-rating-gauge__score-value">{score}</span>
          <span className="credit-rating-gauge__score-label">из 100</span>
        </div>
      </div>
      <div className="credit-rating-gauge__risk-row">
        <p className={`credit-rating-gauge__risk ${riskClass}`}>
          Уровень риска: <strong>{rating.risk_level}</strong>
        </p>
        {showDescription && (
          <span className="credit-rating-gauge__risk-help">
            <button
              type="button"
              className="credit-rating-gauge__hint-trigger"
              aria-label="Как считается кредитный рейтинг"
              aria-describedby={ratingHintId}
            >
              ?
            </button>
            <div id={ratingHintId} className="credit-rating-gauge__hint-popup" role="tooltip">
              <p className="credit-rating-gauge__hint-lead">
                Баллы от 0 до 100 отражают кредитную дисциплину: чем выше значение, тем ниже риск для банка.
                На расчёт влияют просроченные платежи и их сумма по{' '}
                {descriptionContext === 'employee'
                  ? 'всем кредитам этого клиента в системе.'
                  : 'всем вашим кредитам.'}
              </p>
              <ul className="credit-rating-gauge__hint-list">
                <li>0–40 — высокий риск</li>
                <li>40–70 — средний риск</li>
                <li>70–100 — низкий риск</li>
              </ul>
            </div>
          </span>
        )}
      </div>
      {riskHint && <p className="credit-rating-gauge__risk-hint">{riskHint}</p>}
      {(rating.overdue_count > 0 || rating.overdue_amount > 0) && (
        <p className="credit-rating-gauge__overdue">
          Просрочки: {rating.overdue_count} {ruPaymentWord(rating.overdue_count)}
          {rating.overdue_amount > 0 && (
            <>
              {' '}
              · на сумму {rating.overdue_amount.toLocaleString('ru-RU')} ₽
            </>
          )}
        </p>
      )}
      <div className="credit-rating-gauge__legend">
        <div className="credit-rating-gauge__legend-gradient" aria-hidden={true} />
        <div className="credit-rating-gauge__legend-labels">
          <span>0–40</span>
          <span>40–70</span>
          <span>70–100</span>
        </div>
      </div>
    </div>
  )
}
