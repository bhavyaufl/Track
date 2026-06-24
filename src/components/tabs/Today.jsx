import { GOALS } from '../../lib/constants'

function RemainCard({ label, remaining, total, unit, icon, color, bgColor, borderColor }) {
  const consumed = total - remaining
  const pct = Math.min((consumed / total) * 100, 100)
  const done = remaining <= 0
  const over = consumed > total

  return (
    <div className={`rounded-2xl p-4 border ${borderColor} ${bgColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</div>
          <div className={`text-3xl font-black mt-1 ${done ? 'text-emerald-600' : over ? 'text-red-500' : 'text-gray-800'}`}>
            {over ? `+${Math.abs(remaining)}` : remaining}
            <span className="text-base font-medium text-gray-400 ml-1">{unit}</span>
          </div>
          <div className="text-gray-400 text-xs mt-0.5">
            {done ? '✓ Goal hit!' : over ? 'over limit' : `${consumed} / ${total} ${unit} used`}
          </div>
        </div>
        <div className={`text-3xl w-12 h-12 flex items-center justify-center rounded-2xl ${bgColor}`}>{icon}</div>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, background: over ? '#ef4444' : done ? '#10b981' : color }} />
      </div>
    </div>
  )
}

function StepsRing({ steps }) {
  const goal = GOALS.steps
  const pct = Math.min(steps / goal, 1)
  const size = 80, stroke = 8, r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const done = steps >= goal

  return (
    <div className={`bg-white rounded-2xl p-4 border flex items-center gap-4 ${done ? 'border-emerald-100' : 'border-gray-100'} shadow-sm`}>
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={done ? '#10b981' : '#6366f1'} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute text-center">
          <div className="text-lg">👣</div>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Steps</div>
        <div className={`text-2xl font-black ${done ? 'text-emerald-600' : 'text-gray-800'}`}>
          {steps.toLocaleString()}
        </div>
        <div className="text-gray-400 text-xs">
          {done ? '✓ 10k hit!' : `${(goal - steps).toLocaleString()} to go`}
        </div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-bold ${done ? 'text-emerald-600' : 'text-indigo-600'}`}>
          {Math.round(pct * 100)}%
        </div>
        <div className="text-gray-400 text-xs">of 10k</div>
      </div>
    </div>
  )
}

function ScoreCard({ log }) {
  const score = log?.daily_score || 0
  const xp = log?.xp_earned || 0
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b'
  const size = 64, stroke = 7, r = (size-stroke)/2
  const circ = 2*Math.PI*r
  const offset = circ*(1-score/100)

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"/>
        </svg>
        <div className="absolute text-center">
          <div className="text-base font-black text-gray-800">{score}</div>
        </div>
      </div>
      <div>
        <div className="text-gray-500 text-xs uppercase tracking-wide">Daily Score</div>
        <div className="text-gray-700 text-sm font-medium mt-0.5">{score}/100</div>
      </div>
      <div className="ml-auto text-right">
        <div className="text-indigo-600 font-black text-xl">+{xp}</div>
        <div className="text-gray-400 text-xs">XP today</div>
      </div>
    </div>
  )
}

function GoalList({ log }) {
  const macros = log?.macros || { p:0, c:0, f:0 }
  const cal = log?.calories || 0
  const steps = log?.steps || 0
  const goals = [
    { label: 'Logged',   hit: !!log,                              pts: 10 },
    { label: `Protein ≥ 130g (${macros.p}g)`,   hit: macros.p >= 130, pts: 25 },
    { label: `Calories 1200–1600 (${cal} kcal)`, hit: cal >= 1200 && cal <= 1600, pts: 20 },
    { label: `Steps ≥ 10,000 (${steps.toLocaleString()})`, hit: steps >= 10000, pts: 20 },
    { label: 'Gym or Cardio', hit: !!(log?.exercises?.length || log?.cardio_type), pts: 25 },
  ]

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="text-gray-700 font-semibold mb-3">Goals</h3>
      <div className="space-y-2">
        {goals.map(g => (
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
  )
}

function Meals({ log }) {
  const items = [
    { label:'Breakfast', icon:'🌅', key:'breakfast' },
    { label:'Lunch',     icon:'☀️', key:'lunch' },
    { label:'Dinner',    icon:'🌙', key:'dinner' },
    { label:'Snacks',    icon:'🍿', key:'snacks' },
  ].filter(m => log?.[m.key])

  if (!items.length) return null

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <h3 className="text-gray-700 font-semibold mb-3">Meals</h3>
      <div className="space-y-3">
        {items.map(m => (
          <div key={m.key} className="flex gap-3">
            <span className="text-xl shrink-0">{m.icon}</span>
            <div>
              <div className="text-xs text-gray-400 font-medium">{m.label}</div>
              <div className="text-gray-600 text-sm">{log[m.key]}</div>
              {log.meal_macros?.[m.key] && (() => {
                const mx = log.meal_macros[m.key]
                const c = mx.p*4+mx.c*4+mx.f*9
                return <div className="text-gray-400 text-xs mt-0.5">{c} kcal · P{mx.p} C{mx.c} F{mx.f}</div>
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Spending({ log }) {
  if (!log?.spending?.length) return null
  const total = log.spending.reduce((s, e) => s + e.amount, 0)
  const remaining = GOALS.dailyBudget - total

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-gray-700 font-semibold">Spending</h3>
        <span className={`text-sm font-bold ${remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          ₹{total} / ₹{GOALS.dailyBudget}
        </span>
      </div>
      <div className="space-y-1.5">
        {log.spending.map((s, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <div>
              <span className="text-gray-600">{s.item}</span>
              <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{s.category}</span>
            </div>
            <span className="text-gray-700 font-medium">₹{s.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Today({ log }) {
  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-3xl">📋</div>
        <div className="text-gray-700 font-semibold">No log for today yet</div>
        <div className="text-gray-400 text-sm text-center max-w-xs">
          Run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600">/checkin</code> each morning to log yesterday's data.
        </div>
      </div>
    )
  }

  const macros = log.macros || { p: 0, c: 0, f: 0 }
  const cal = log.calories || 0
  const steps = log.steps || 0
  const spent = (log.spending || []).reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-4">
      <ScoreCard log={log} />

      {/* Remaining targets — hero section */}
      <div className="space-y-3">
        <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-1">Remaining today</h2>
        <RemainCard
          label="Calories" remaining={Math.max(GOALS.calories.target - cal, 0)}
          total={GOALS.calories.target} unit="kcal" icon="🔥"
          color="#6366f1" bgColor="bg-indigo-50" borderColor="border-indigo-100" />
        <RemainCard
          label="Protein" remaining={Math.max(GOALS.protein - macros.p, 0)}
          total={GOALS.protein} unit="g" icon="💪"
          color="#8b5cf6" bgColor="bg-purple-50" borderColor="border-purple-100" />
        <RemainCard
          label="Daily Budget" remaining={Math.max(GOALS.dailyBudget - spent, 0)}
          total={GOALS.dailyBudget} unit="₹" icon="💰"
          color="#f59e0b" bgColor="bg-amber-50" borderColor="border-amber-100" />
      </div>

      <StepsRing steps={steps} />
      <GoalList log={log} />
      <Meals log={log} />
      <Spending log={log} />

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
