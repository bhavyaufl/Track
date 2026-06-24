import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GOALS, EXERCISE_GOALS } from '../../lib/constants'

function WeightChart({ logs }) {
  const data = logs.filter(l => l.weight).slice(0, 30).reverse()
    .map(l => ({ date: l.date?.slice(5), weight: Number(l.weight) }))

  if (!data.length) return (
    <div className="text-center py-10 text-gray-400 text-sm">No weight data yet.</div>
  )
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#94a3b8' }} domain={['dataMin - 1', 'dataMax + 1']} />
        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
        <Line dataKey="weight" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }} name="kg" />
      </LineChart>
    </ResponsiveContainer>
  )
}

function LevelsTable({ levels }) {
  const GROUPS = ['Push', 'Pull', 'Legs']
  if (!levels.length) return (
    <div className="text-center py-10 text-gray-400 text-sm">No exercise data yet.</div>
  )

  return (
    <div className="space-y-4">
      {GROUPS.map(group => {
        const rows = EXERCISE_GOALS.filter(e => e.group === group).map(ex => {
          const lvl = levels.find(l => l.exercise_name === ex.name)
          return { ...ex, current: lvl?.current_weight || 0, level: lvl?.current_level || 1, lastSets: lvl?.last_sets || [] }
        })

        return (
          <div key={group}>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</div>
            <div className="space-y-1.5">
              {rows.map(r => {
                const started = r.current > 0
                const readyToLevel = started && r.lastSets.length >= 3 && r.lastSets.every(s => s >= 12)
                const pct = r.goal && started
                  ? Math.min(r.type === 'time' ? (r.current ? (r.goal / r.current) * 100 : 0) : (r.current / r.goal) * 100, 100)
                  : 0
                const barColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#6366f1' : '#a5b4fc'

                return (
                  <div key={r.name}
                    className={`rounded-xl px-3 py-2.5 flex items-center justify-between border ${started ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${started ? 'text-gray-700' : 'text-gray-400'}`}>{r.name}</span>
                        {readyToLevel && <span className="text-amber-500 text-xs bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">⬆️ add weight</span>}
                        {!started && <span className="text-gray-300 text-xs">not started</span>}
                      </div>
                      {r.goal && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{Math.round(pct)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-bold text-sm ${started ? 'text-indigo-600' : 'text-gray-300'}`}>
                        {started ? `${r.current} ${r.unit}` : '—'}
                      </div>
                      {r.goal && <div className="text-gray-400 text-xs">/ {r.goal} {r.unit}</div>}
                      {r.scheme && <div className="text-gray-300 text-xs">{r.scheme}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WorkoutHistory({ logs }) {
  const workouts = logs.filter(l => l.exercises?.length || l.cardio_type).slice(0, 14)
  if (!workouts.length) return (
    <div className="text-center py-10 text-gray-400 text-sm">No workouts yet.</div>
  )

  return (
    <div className="space-y-2">
      {workouts.map(l => (
        <div key={l.date} className="bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-700 text-sm font-medium">{l.date}</span>
            <div className="flex gap-1.5">
              {l.muscles?.map(m => (
                <span key={m} className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">{m}</span>
              ))}
              {l.cardio_type && (
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{l.cardio_type}</span>
              )}
            </div>
          </div>
          {l.exercises?.slice(0, 3).map((ex, i) => (
            <div key={i} className="text-gray-400 text-xs">
              {ex.name} · {ex.weight}{ex.unit} · {ex.sets?.join('/')} reps
            </div>
          ))}
          {l.exercises?.length > 3 && (
            <div className="text-gray-300 text-xs">+{l.exercises.length - 3} more</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Fitness({ logs, levels }) {
  const [tab, setTab] = useState('levels')

  return (
    <div className="space-y-4 fade-up">
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        {[['levels','🏋️ Levels'],['weight','⚖️ Weight'],['history','📋 History']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
              tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'levels' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold mb-3">Exercise Progress</h3>
          <LevelsTable levels={levels} />
        </div>
      )}

      {tab === 'weight' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex justify-between mb-4">
            <div>
              <div className="text-gray-700 font-semibold">Weight Trend</div>
              <div className="text-gray-400 text-xs mt-0.5">Start: 91 kg → Target: 85 kg</div>
            </div>
            {logs.find(l => l.weight) && (
              <div className="text-right">
                <div className="text-indigo-600 font-bold">{logs.find(l=>l.weight)?.weight} kg</div>
                <div className="text-xs text-gray-400">current</div>
              </div>
            )}
          </div>
          <WeightChart logs={logs} />
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold mb-3">Workout History</h3>
          <WorkoutHistory logs={logs} />
        </div>
      )}
    </div>
  )
}
