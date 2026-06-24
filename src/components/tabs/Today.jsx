import { GOALS, SCORE_TABLE } from '../../lib/constants'
import StatCard from '../ui/StatCard'

function ScoreRing({ score }) {
  const size = 160
  const stroke = 14
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(score / 100, 1)
  const offset = circ * (1 - pct)
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-black text-white">{score}</div>
        <div className="text-slate-400 text-xs">/ 100</div>
      </div>
    </div>
  )
}

function MacroBar({ label, value, target, color }) {
  const pct = Math.min((value / target) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{value}g / {target}g</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Today({ log }) {
  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="text-5xl">📋</div>
        <div className="text-slate-400 text-lg">No log yet for today.</div>
        <div className="text-slate-500 text-sm">Use the morning check-in to log yesterday + today's workout.</div>
      </div>
    )
  }

  const macros = log.macros || { p: 0, c: 0, f: 0 }
  const proteinHit = macros.p >= GOALS.protein
  const calsHit = log.calories >= GOALS.calories.min && log.calories <= GOALS.calories.max
  const stepsHit = (log.steps || 0) >= GOALS.steps
  const workoutHit = !!(log.exercises?.length || log.cardio_type)
  const score = log.daily_score || 0

  const meals = [
    { label: 'Breakfast', key: 'breakfast', macros: log.meal_macros?.breakfast },
    { label: 'Lunch', key: 'lunch', macros: log.meal_macros?.lunch },
    { label: 'Dinner', key: 'dinner', macros: log.meal_macros?.dinner },
    { label: 'Snacks', key: 'snacks', macros: log.meal_macros?.snacks },
  ]

  return (
    <div className="space-y-6">
      {/* Score + XP row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
        <div className="sm:col-span-1 flex justify-center">
          <div className="text-center">
            <ScoreRing score={score} />
            <div className="text-slate-400 text-sm mt-2">Daily Score</div>
          </div>
        </div>
        <div className="sm:col-span-2 grid grid-cols-2 gap-3">
          <StatCard label="XP Earned" value={`+${log.xp_earned || 0}`} icon="⚡" color="text-yellow-400" />
          <StatCard label="Calories" value={log.calories || 0} sub={`target 1200–1600`} icon="🔥" hit={calsHit} />
          <StatCard label="Steps" value={(log.steps || 0).toLocaleString()} sub="goal: 10,000" icon="👣" hit={stepsHit} />
          <StatCard label="Weight" value={log.weight ? `${log.weight} kg` : '—'} icon="⚖️" />
        </div>
      </div>

      {/* Goals checklist */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Today's Goals</h3>
        <div className="space-y-2">
          {[
            { label: 'Logged', hit: true, pts: SCORE_TABLE.logged },
            { label: `Protein ≥ 130g (${macros.p}g)`, hit: proteinHit, pts: SCORE_TABLE.protein },
            { label: `Calories 1200–1600 (${log.calories})`, hit: calsHit, pts: SCORE_TABLE.calories },
            { label: `Steps ≥ 10,000 (${(log.steps||0).toLocaleString()})`, hit: stepsHit, pts: SCORE_TABLE.steps },
            { label: 'Gym or Cardio', hit: workoutHit, pts: SCORE_TABLE.workout },
          ].map(g => (
            <div key={g.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={g.hit ? 'text-emerald-400' : 'text-slate-600'}>
                  {g.hit ? '✓' : '○'}
                </span>
                <span className={g.hit ? 'text-slate-200' : 'text-slate-500'}>{g.label}</span>
              </div>
              <span className={g.hit ? 'text-emerald-400 text-sm font-medium' : 'text-slate-600 text-sm'}>
                +{g.pts}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Macros */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Macros</h3>
        <div className="space-y-3">
          <MacroBar label="Protein" value={macros.p} target={GOALS.protein} color="#6366f1" />
          <MacroBar label="Carbs" value={macros.c} target={GOALS.carbs} color="#f59e0b" />
          <MacroBar label="Fat" value={macros.f} target={GOALS.fat} color="#ec4899" />
        </div>
      </div>

      {/* Meals */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <h3 className="text-slate-300 font-semibold mb-3">Meals</h3>
        <div className="space-y-3">
          {meals.map(m => log[m.key] && (
            <div key={m.key}>
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">{m.label}</div>
              <div className="text-slate-200 text-sm">{log[m.key]}</div>
              {m.macros && (
                <div className="text-slate-500 text-xs mt-0.5">
                  P {m.macros.p}g · C {m.macros.c}g · F {m.macros.f}g
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Spending */}
      {log.spending?.length > 0 && (
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
          <h3 className="text-slate-300 font-semibold mb-3">Spending</h3>
          <div className="space-y-2">
            {log.spending.map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-slate-300">{s.item} <span className="text-slate-500 text-xs">({s.category})</span></span>
                <span className="text-slate-200">₹{s.amount}</span>
              </div>
            ))}
            <div className="border-t border-slate-700 pt-2 flex justify-between font-semibold">
              <span className="text-slate-400">Total</span>
              <span className="text-white">₹{log.spending.reduce((a, s) => a + s.amount, 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Badges unlocked today */}
      {log.badges_unlocked?.length > 0 && (
        <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-700/40">
          <h3 className="text-yellow-400 font-semibold mb-2">Badges Unlocked Today! 🎉</h3>
          <div className="flex gap-3 flex-wrap">
            {log.badges_unlocked.map(b => (
              <span key={b} className="bg-yellow-800/40 text-yellow-300 text-sm px-3 py-1 rounded-full">{b}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
