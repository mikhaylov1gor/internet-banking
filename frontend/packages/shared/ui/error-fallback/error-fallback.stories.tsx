import type { Meta, StoryObj } from '@storybook/react'
import { ErrorFallback } from './error-fallback'

const meta: Meta<typeof ErrorFallback> = {
  title: 'Shared/ErrorFallback',
  component: ErrorFallback,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ErrorFallback>

export const Default: Story = {
  args: {
    title: 'Произошла ошибка',
    message: 'Что-то пошло не так. Попробуйте обновить страницу или вернуться назад.',
    onGoBack: () => alert('Назад'),
    onRetry: () => alert('Повторить'),
  },
}

export const WithGoBackOnly: Story = {
  args: {
    title: 'Страница не найдена',
    message: 'Запрашиваемая страница не существует.',
    onGoBack: () => alert('Назад'),
  },
}

export const WithRetryOnly: Story = {
  args: {
    title: 'Ошибка загрузки',
    message: 'Не удалось загрузить данные.',
    onRetry: () => alert('Повторить'),
  },
}

