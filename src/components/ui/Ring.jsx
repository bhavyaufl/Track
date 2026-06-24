export default function Ring({ value, max, size = 120, stroke = 10, color = '#6366f1', label, sublabel }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      {label && (
        <div className="text-center -mt-1" style={{ marginTop: `-${size / 2 + 8}px`, marginBottom: `${size / 2 - 8}px` }}>
          <div className="text-xl font-bold text-white">{label}</div>
          {sublabel && <div className="text-xs text-slate-400">{sublabel}</div>}
        </div>
      )}
    </div>
  )
}
