import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-white/20 flex h-10 w-full min-w-0 rounded-2xl border bg-white/30 dark:bg-white/10 backdrop-blur-md px-4 py-2 text-base shadow-sm transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-white/30 focus-visible:ring-white/30 focus-visible:ring-[3px] hover:bg-white/40 dark:hover:bg-white/15',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
