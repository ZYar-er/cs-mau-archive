import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  ring?: boolean
}

export default function Card({ children, className = '', ring = true }: Props) {
  return (
    <div
      className={`rounded-sm bg-steam-card px-4 py-4 shadow-steam ${
        ring ? 'ring-1 ring-steam-border/50' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
