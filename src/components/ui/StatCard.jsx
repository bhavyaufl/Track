import clsx from 'clsx'

export default function StatCard({ label, value, sub, color = 'text-white', icon, hit }) {
  return (
    <div className={clsx(
      'rounded-xl p-4 flex flex-col gap-1',
      hit === true ? 'bg-emerald-900/40 border border-emerald-700/40' :
      hit === false ? 'bg-slate-800/60 border border-slate-700/40' :
      'bg-slate-800/60 border border-slate-700/40'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
        {hit !== undefined && (
          <span className={hit ? 'text-emerald-400 text-xs font-medium' : 'text-slate-500 text-xs'}>
            {hit ? '✓' : '✗'}
          </span>
        )}
      </div>
      <div className={clsx('text-2xl font-bold', color)}>{value}</div>
      {sub && <div className="text-slate-500 text-xs">{sub}</div>}
    </div>
  )
}
