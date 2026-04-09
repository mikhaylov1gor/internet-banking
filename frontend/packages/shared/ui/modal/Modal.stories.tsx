import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Modal } from './ui/modal'
import { Button } from '../button'

const meta: Meta<typeof Modal> = {
  title: 'Shared/Modal',
  component: Modal,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Modal>

const ModalExample = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Открыть модальное окно</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Пример модального окна">
        <p>Это содержимое модального окна. Вы можете закрыть его, нажав на крестик или вне окна.</p>
      </Modal>
    </>
  )
}

export const Default: Story = {
  render: () => <ModalExample />,
}
