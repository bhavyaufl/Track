import clsx from 'clsx'

export default function StatCard({ label, value, sub, color = 'text-gray-900', icon, hit }) {
  return (
    <div className={clsx(
      'rounded-2xl p-4 flex flex-col gap-1 border',
      hit === true  ? 'bg-emerald-50 border-emerald-100' :
      hit === false ? 'bg-white border-gray-100' :
                     'bg-white border-gray-100'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-xs font-medium">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
        {hit !== undefined && (
          <span className={hit ? 'text-emerald-500 text-sm font-bold' : 'text-gray-300 text-sm'}>
            {hit ? '✓' : '○'}
          </span>
        )}
      </div>
      <div className={clsx('text-2xl font-bold', color)}>{value}</div>
      {sub && <div className="text-gray-400 text-xs">{sub}</div>}
    </div>
  )
}
