import { SCHOOL_LOGO, SCHOOL_NAME } from '../lib/constants'

interface SchoolLogoProps {
  size?: number
  className?: string
}

export default function SchoolLogo({ size = 40, className = '' }: SchoolLogoProps) {
  if (SCHOOL_LOGO) {
    return (
      <img
        src={SCHOOL_LOGO}
        alt={SCHOOL_NAME}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`bg-white/10 rounded-full flex items-center justify-center ${className}`}
    >
      <span style={{ fontSize: size * 0.5 }}>📚</span>
    </div>
  )
}
