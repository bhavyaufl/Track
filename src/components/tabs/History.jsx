import { useState } from 'react'
import clsx from 'clsx'

function LogRow({ log, expanded, onToggle }) {
  const macros = log.macros || { p: 0, c: 0, f: 0 }
  const score = log.daily_score || 0
  const scoreColor = score >= 80 ? 'text-emerald-600 bg-emerald-50' : score >= 50 ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 bg-gray-100'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
        onClick={onToggle}>
        <div className="flex items-center gap-3">
          <span className="text-gray-700 text-sm font-semibold">{log.date}</span>
          {log.muscles?.map(m => (
            <span key={m} className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">{m}</span>
          ))}
          {log.cardio_type && (
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{log.cardio_type}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">{log.calories || 0} kcal</span>
          <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', scoreColor)}>{score}</span>
          <span className="text-gray-300 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-50">
          <div className="grid grid-cols-3 gap-3 pt-3">
            {[
              { label: 'Macros', value: `P${macros.p} C${macros.c} F${macros.f}` },
              { label: 'Steps', value: (log.steps||0).toLocaleString() },
              { label: 'Weight', value: log.weight ? `${log.weight} kg` : '—' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-2 text-center">
                <div className="text-gray-400 text-xs">{s.label}</div>
                <div className="text-gray-700 text-sm font-medium mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>

          {log.exercises?.length > 0 && (
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1.5">Exercises</div>
              <div className="space-y-1">
                {log.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{ex.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{ex.weight}{ex.unit} · {ex.sets?.join('/')} reps</span>
                      {ex.leveled_up && <span className="text-amber-500 text-xs">⬆️</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(log.breakfast || log.lunch || log.dinner || log.snacks) && (
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1.5">Meals</div>
              <div className="space-y-0.5 text-sm text-gray-600">
                {[['🌅','breakfast'],['☀️','lunch'],['🌙','dinner'],['🍿','snacks']].map(([e,k]) =>
                  log[k] && <div key={k}><span className="mr-1">{e}</span>{log[k]}</div>
                )}
              </div>
            </div>
          )}

          {log.spending?.length > 0 && (
            <div>
              <div className="text-gray-400 text-xs uppercase tracking-wide mb-1.5">Spending</div>
              {log.spending.map((s, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{s.item}</span>
                  <span className="text-gray-700 font-medium">₹{s.amount}</span>
                </div>
              ))}
            </div>
          )}

          {log.xp_earned > 0 && (
            <div className="text-indigo-500 text-sm font-semibold">⚡ +{log.xp_earned} XP</div>
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
      l.cardio_type?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-3 fade-up">
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
        <input type="text" placeholder="Search logs…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl pl-9 pr-4 py-2.5 text-gray-700 text-sm placeholder-gray-300 focus:outline-none focus:border-indigo-300 shadow-sm" />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {search ? 'No logs match your search.' : 'No logs yet.'}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(l => (
          <LogRow key={l.date} log={l} expanded={expanded === l.date}
            onToggle={() => setExpanded(expanded === l.date ? null : l.date)} />
        ))}
      </div>
    </div>
  )
}
