import type { SVGProps } from 'react'

/**
 * Иконки брендов, которых нет в lucide-react. Нарисованы в стиле lucide:
 * сетка 24, линия 1.75, скруглённые концы, цвет через currentColor.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: 16 | 20 | 24 }

function Base({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function InstagramIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </Base>
  )
}

export function YoutubeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9 5 3-5 3z" />
    </Base>
  )
}

export function LinkedinIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 10v7M8 7h.01M12 17v-7M12 13a3 3 0 0 1 6 0v4" />
    </Base>
  )
}

export function TelegramIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21 4 3 11.5l6 2 2 6 3-4 4 3z" />
      <path d="m9 13.5 9-7.5" />
    </Base>
  )
}

export function WhatsappIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m3.5 20.5 1.4-4.2A8.5 8.5 0 1 1 8 19.3z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z" />
    </Base>
  )
}

export const socialIcons = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  telegram: TelegramIcon,
  linkedin: LinkedinIcon,
} as const

export const socialNames = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  telegram: 'Telegram',
  linkedin: 'LinkedIn',
} as const
