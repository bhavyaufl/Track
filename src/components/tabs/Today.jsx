import { GOALS, SCORE_TABLE } from '../../lib/constants'
import StatCard from '../ui/StatCard'

function ScoreRing({ score }) {
  const size = 140, stroke = 12, r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(score / 100, 1))
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b'
  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-black text-gray-800">{score}</div>
        <div className="text-gray-400 text-xs">/100</div>
      </div>
    </div>
  )
}

function MacroBar({ label, value, target, color }) {
  const pct = Math.min((value / target) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-500">{value}g <span className="text-gray-300">/ {target}g</span></span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Today({ log }) {
  if (!log) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-3xl">📋</div>
      <div className="text-gray-700 font-semibold">No log for today yet</div>
      <div className="text-gray-400 text-sm text-center max-w-xs">Run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600">/checkin</code> each morning to log yesterday's data.</div>
    </div>
  )

  const macros = log.macros || { p: 0, c: 0, f: 0 }
  const proteinHit = macros.p >= GOALS.protein
  const calsHit = log.calories >= GOALS.calories.min && log.calories <= GOALS.calories.max
  const stepsHit = (log.steps || 0) >= GOALS.steps
  const workoutHit = !!(log.exercises?.length || log.cardio_type)
  const score = log.daily_score || 0

  return (
    <div className="space-y-4">
      {/* Score + stats */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <ScoreRing score={score} />
            <div className="text-gray-400 text-xs mt-1">Daily Score</div>
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: 'Calories', value: `${log.calories || 0} kcal`, hit: calsHit, sub: '1200–1600 target' },
              { label: 'Steps', value: (log.steps||0).toLocaleString(), hit: stepsHit, sub: 'goal: 10,000' },
              { label: 'XP Today', value: `+${log.xp_earned || 0}`, color: 'text-indigo-600' },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{s.label}</span>
                <div className="text-right">
                  <span className={`text-sm font-bold ${s.color || (s.hit === true ? 'text-emerald-600' : s.hit === false ? 'text-amber-500' : 'text-gray-700')}`}>
                    {s.value}
                  </span>
                  {s.hit !== undefined && (
                    <span className={`ml-1.5 text-xs ${s.hit ? 'text-emerald-500' : 'text-gray-300'}`}>{s.hit ? '✓' : '○'}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals checklist */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold mb-3">Goals</h3>
        <div className="space-y-2">
          {[
            { label: 'Logged', hit: true, pts: SCORE_TABLE.logged },
            { label: `Protein ≥ 130g (${macros.p}g)`, hit: proteinHit, pts: SCORE_TABLE.protein },
            { label: `Calories 1200–1600 (${log.calories || 0})`, hit: calsHit, pts: SCORE_TABLE.calories },
            { label: `Steps ≥ 10,000 (${(log.steps||0).toLocaleString()})`, hit: stepsHit, pts: SCORE_TABLE.steps },
            { label: 'Gym or Cardio', hit: workoutHit, pts: SCORE_TABLE.workout },
          ].map(g => (
            <div key={g.label} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${g.hit ? 'bg-emerald-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${g.hit ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {g.hit ? '✓' : '○'}
                </div>
                <span className={`text-sm ${g.hit ? 'text-gray-700' : 'text-gray-400'}`}>{g.label}</span>
              </div>
              <span className={`text-sm font-semibold ${g.hit ? 'text-emerald-600' : 'text-gray-300'}`}>+{g.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Macros */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold mb-3">Macros</h3>
        <div className="space-y-3">
          <MacroBar label="Protein 💪" value={macros.p} target={GOALS.protein} color="#6366f1" />
          <MacroBar label="Carbs 🌾" value={macros.c} target={GOALS.carbs} color="#f59e0b" />
          <MacroBar label="Fat 🧈" value={macros.f} target={GOALS.fat} color="#ec4899" />
        </div>
      </div>

      {/* Meals */}
      {(log.breakfast || log.lunch || log.dinner || log.snacks) && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold mb-3">Meals</h3>
          <div className="space-y-3">
            {[
              { label: 'Breakfast', icon: '🌅', key: 'breakfast' },
              { label: 'Lunch', icon: '☀️', key: 'lunch' },
              { label: 'Dinner', icon: '🌙', key: 'dinner' },
              { label: 'Snacks', icon: '🍿', key: 'snacks' },
            ].map(m => log[m.key] && (
              <div key={m.key} className="flex gap-3">
                <span className="text-lg shrink-0">{m.icon}</span>
                <div>
                  <div className="text-xs text-gray-400 font-medium">{m.label}</div>
                  <div className="text-gray-600 text-sm">{log[m.key]}</div>
                  {log.meal_macros?.[m.key] && (
                    <div className="text-gray-400 text-xs mt-0.5">
                      P {log.meal_macros[m.key].p}g · C {log.meal_macros[m.key].c}g · F {log.meal_macros[m.key].f}g
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending */}
      {log.spending?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-semibold mb-3">Spending</h3>
          <div className="space-y-2">
            {log.spending.map((s, i) => (
              <div key={i} className="flex justify-between items-center">
                <div>
                  <span className="text-gray-700 text-sm">{s.item}</span>
                  <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{s.category}</span>
                </div>
                <span className="text-gray-700 font-medium text-sm">₹{s.amount}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-sm">
              <span className="text-gray-500">Total</span>
              <span className="text-gray-800">₹{log.spending.reduce((a, s) => a + s.amount, 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      {log.badges_unlocked?.length > 0 && (
        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
          <h3 className="text-yellow-700 font-semibold mb-2">🎉 Badges Unlocked!</h3>
          <div className="flex gap-2 flex-wrap">
            {log.badges_unlocked.map(b => (
              <span key={b} className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded-full font-medium">{b}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
