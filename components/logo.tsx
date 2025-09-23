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
        onError={(e) => {
          // Fallback if logo fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          // Add text fallback
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.logo-fallback')) {
            const fallback = document.createElement('span');
            fallback.className = 'logo-fallback text-lg font-bold text-primary';
            fallback.textContent = 'Tranquilae';
            parent.appendChild(fallback);
          }
        }}
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
