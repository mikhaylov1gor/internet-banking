import type { Meta, StoryObj } from '@storybook/react'
import { PhoneInput } from './ui/phone-input'

const meta: Meta<typeof PhoneInput> = {
  title: 'Shared/PhoneInput',
  component: PhoneInput,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof PhoneInput>

export const Default: Story = {
  args: {
    label: 'Телефон',
    placeholder: '+7 (999) 123-45-67',
  },
}

export const WithError: Story = {
  args: {
    label: 'Телефон',
    error: 'Неверный формат телефона',
  },
}

export const Required: Story = {
  args: {
    label: 'Телефон',
    required: true,
  },
}

