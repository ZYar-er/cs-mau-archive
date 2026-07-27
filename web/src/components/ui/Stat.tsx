interface Props {
  label: string
  value: string
  sub?: string
  color?: string
  align?: 'center' | 'left'
}

export default function Stat({
  label,
  value,
  sub,
  color,
  align = 'center',
}: Props) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      <p className="text-xs uppercase tracking-wider text-steam-muted">
        {label}
      </p>
      <p
        className={`mt-0.5 text-lg font-bold ${color ?? 'text-steam-text'}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-steam-muted">{sub}</p>}
    </div>
  )
}
