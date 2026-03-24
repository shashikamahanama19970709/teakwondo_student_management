'use client'

import React, { useState, ReactNode } from 'react'

interface CollapsibleProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

interface CollapsibleTriggerProps {
  children: ReactNode
  asChild?: boolean
  className?: string
  onClick?: () => void
}

interface CollapsibleContentProps {
  children: ReactNode
  className?: string
}

export function Collapsible({ children, open, onOpenChange, className }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleToggle = () => {
    const newState = !isOpen
    if (!isControlled) {
      setInternalOpen(newState)
    }
    onOpenChange?.(newState)
  }

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childType = child.type as any
          if (childType === CollapsibleTrigger || childType?.displayName === 'CollapsibleTrigger') {
            return React.cloneElement(child, {
              onClick: handleToggle
            } as Partial<CollapsibleTriggerProps>)
          }
          if (childType === CollapsibleContent || childType?.displayName === 'CollapsibleContent') {
            return React.cloneElement(child, {
              style: {
                ...child.props.style,
                display: isOpen ? 'block' : 'none',
                overflow: 'hidden'
              }
            } as Partial<CollapsibleContentProps>)
          }
        }
        return child
      })}
    </div>
  )
}

Collapsible.displayName = 'Collapsible'

export function CollapsibleTrigger({ children, asChild, className, onClick, ...props }: CollapsibleTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className,
      onClick,
      ...props
    })
  }

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

CollapsibleTrigger.displayName = 'CollapsibleTrigger'

export function CollapsibleContent({ children, className, ...props }: CollapsibleContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

CollapsibleContent.displayName = 'CollapsibleContent'
