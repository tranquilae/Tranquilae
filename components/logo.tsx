import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  className?: string
  href?: string
  showText?: boolean
}

export function Logo({ className = "h-8 w-auto", href, showText = true }: LogoProps) {
  const logoContent = (
    <div className="flex items-center space-x-2">
      <img
        src="/logo.svg"
        alt="Tranquilae"
        className={className}
        style={{ maxWidth: 'none' }}
      />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
