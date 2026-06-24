import { useState } from 'react'
import clsx from 'clsx'

function LogRow({ log, expanded, onToggle }) {
  const macros = log.macros || { p: 0, c: 0, f: 0 }
  const score = log.daily_score || 0
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-slate-400'

  return (
    <div className="border border-slate-700/40 rounded-xl overflow-hidden">
      <button
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors text-left"
        onClick={onToggle}>
        <div className="flex items-center gap-3">
          <span className="text-slate-300 text-sm font-medium">{log.date}</span>
          {log.muscles?.length > 0 && (
            <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full">
              {log.muscles.join(', ')}
            </span>
          )}
          {log.cardio_type && (
            <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded-full">
              {log.cardio_type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-xs">{log.calories || 0} kcal</span>
          <span className={clsx('text-sm font-bold', scoreColor)}>{score}</span>
          <span className="text-slate-600">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/40 pt-3">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-slate-500 text-xs">Macros</div>
              <div className="text-slate-300">P {macros.p}g · C {macros.c}g · F {macros.f}g</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Steps</div>
              <div className="text-slate-300">{(log.steps || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs">Weight</div>
              <div className="text-slate-300">{log.weight ? `${log.weight} kg` : '—'}</div>
            </div>
          </div>

          {log.exercises?.length > 0 && (
            <div>
              <div className="text-slate-500 text-xs mb-1">Exercises</div>
              <div className="space-y-1">
                {log.exercises.map((ex, i) => (
                  <div key={i} className="text-slate-300 text-sm flex items-center gap-2">
                    <span>{ex.name}</span>
                    <span className="text-slate-500">{ex.weight}{ex.unit} — {ex.sets?.join('/')} reps</span>
                    {ex.leveled_up && <span className="text-yellow-400 text-xs">⬆️ Level up!</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {log.breakfast && (
            <div>
              <div className="text-slate-500 text-xs mb-1">Meals</div>
              <div className="space-y-0.5 text-sm text-slate-300">
                {log.breakfast && <div><span className="text-slate-500">🌅 </span>{log.breakfast}</div>}
                {log.lunch && <div><span className="text-slate-500">☀️ </span>{log.lunch}</div>}
                {log.dinner && <div><span className="text-slate-500">🌙 </span>{log.dinner}</div>}
                {log.snacks && <div><span className="text-slate-500">🍿 </span>{log.snacks}</div>}
              </div>
            </div>
          )}

          {log.spending?.length > 0 && (
            <div>
              <div className="text-slate-500 text-xs mb-1">Spending</div>
              <div className="space-y-0.5 text-sm">
                {log.spending.map((s, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-slate-300">{s.item}</span>
                    <span className="text-slate-400">₹{s.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {log.xp_earned > 0 && (
            <div className="text-yellow-400 text-sm">⚡ +{log.xp_earned} XP</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function History({ logs }) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const filtered = logs.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.date?.includes(q) ||
      l.muscles?.join(' ').toLowerCase().includes(q) ||
      l.breakfast?.toLowerCase().includes(q) ||
      l.lunch?.toLowerCase().includes(q) ||
      l.dinner?.toLowerCase().includes(q) ||
      l.cardio_type?.toLowerCase().includes(q) ||
      l.notes?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search logs…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
      />

      {filtered.length === 0 && (
        <div className="text-slate-500 text-center py-8">
          {search ? 'No logs match your search.' : 'No logs yet.'}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(l => (
          <LogRow
            key={l.date}
            log={l}
            expanded={expanded === l.date}
            onToggle={() => setExpanded(expanded === l.date ? null : l.date)}
          />
        ))}
      </div>
    </div>
  )
}
