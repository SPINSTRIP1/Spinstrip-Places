interface Props {
  monogram: string
  bg: string
  size?: number
  className?: string
}

export default function RestaurantLogo({ monogram, bg, size = 72, className = '' }: Props) {
  return (
    <div
      className={`flex items-center justify-center rounded-3xl font-display font-bold text-white shadow-lg ${className}`}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * 0.38,
        boxShadow: '0 10px 30px -8px rgba(0,0,0,0.35)',
      }}
      aria-hidden="true"
    >
      {monogram}
    </div>
  )
}
