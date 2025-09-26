'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ theme: propsTheme, ...props }: ToasterProps) => {
  const { theme: contextTheme = 'system' } = useTheme()

  // Use props theme first, then context theme, ensuring it's a valid value
  const finalTheme = propsTheme || contextTheme || 'system'
  const validTheme = ['system', 'dark', 'light'].includes(finalTheme) 
    ? finalTheme as ToasterProps['theme']
    : 'system' as ToasterProps['theme']

  const toasterProps = {
    theme: validTheme,
    className: "toaster group",
    style: {
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
    } as React.CSSProperties,
    ...props,
  } as ToasterProps

  return <Sonner {...toasterProps} />
}

export { Toaster }
