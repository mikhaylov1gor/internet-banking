import type { Meta, StoryObj } from '@storybook/react'
import { EmailInput } from './ui/email-input'

const meta: Meta<typeof EmailInput> = {
  title: 'Shared/EmailInput',
  component: EmailInput,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof EmailInput>

export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'example@mail.com',
  },
}

export const WithError: Story = {
  args: {
    label: 'Email',
    error: 'Неверный формат email',
  },
}

export const Required: Story = {
  args: {
    label: 'Email',
    required: true,
  },
}

