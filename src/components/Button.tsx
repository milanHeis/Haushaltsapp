import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  children: ReactNode
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600',
  danger: 'bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30',
  ghost: 'text-slate-400 hover:text-white hover:bg-slate-700',
}

export default function Button({ variant = 'primary', children, fullWidth, className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`
        flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm
        transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}
      `}
    >
      {children}
    </button>
  )
}
