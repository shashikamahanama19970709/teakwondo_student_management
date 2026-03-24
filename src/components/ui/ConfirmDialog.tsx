'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'text-red-600 hover:bg-red-50'
      case 'warning':
        return 'text-yellow-600 hover:bg-yellow-50'
      case 'info':
        return 'text-blue-600 hover:bg-blue-50'
      default:
        return 'text-red-600 hover:bg-red-50'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
      default:
        return 'text-red-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white border-0">
        <DialogHeader className="px-6 py-5 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${getIconColor()}`} />
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-xl">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-600 hover:bg-gray-200 h-9 px-4 font-medium text-sm rounded-lg transition-colors"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`h-9 px-4 font-medium text-sm rounded-lg transition-colors ${getVariantClasses()}`}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
