import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'

const meta: Meta<typeof Input> = {
  title: 'Shared/Input',
  component: Input,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    label: 'Имя',
    placeholder: 'Введите имя',
  },
}

export const WithError: Story = {
  args: {
    label: 'Имя',
    error: 'Поле обязательно для заполнения',
  },
}

export const Password: Story = {
  args: {
    label: 'Пароль',
    type: 'password',
  },
}

export const Number: Story = {
  args: {
    label: 'Количество',
    type: 'number',
  },
}
