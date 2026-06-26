import { useState } from 'react'
import { GOALS } from '../../lib/constants'

function RemainCard({ label, remaining, consumed, total, unit, icon, color, bgColor, borderColor }) {
  const pct = Math.min((consumed / total) * 100, 100)
  const done = consumed >= total
  const over = consumed > total

  return (
    <div className={`rounded-2xl p-3 border ${borderColor} ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</div>
        <div className="text-lg">{icon}</div>
      </div>
      <div className={`text-2xl font-black ${done ? 'text-emerald-600' : over ? 'text-red-500' : 'text-gray-800'}`}>
        {over ? <span className="text-red-500">+{Math.abs(remaining)}</span> : remaining}
        <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>
      </div>
      <div className="text-gray-400 text-xs mt-0.5 mb-2">
        {done ? '✓ Goal hit!' : over ? 'over limit' : `${consumed} / ${total} ${unit} used`}
      </div>
      <div className="h-2 bg-white/70 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, background: over ? '#ef4444' : done ? '#10b981' : color }} />
      </div>
    </div>
  )
}

function StepsRing({ steps }) {
  const goal = GOALS.steps
  const pct = Math.min(steps / goal, 1)
  const size = 64, stroke = 7, r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const done = steps >= goal

  return (
    <div className={`bg-white rounded-2xl p-3 border flex items-center gap-3 ${done ? 'border-emerald-100' : 'border-gray-100'} shadow-sm`}>
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={done ? '#10b981' : '#6366f1'} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute text-base">👣</div>
      </div>
      <div className="flex-1">
        <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-0.5">Steps</div>
        <div className={`text-xl font-black ${done ? 'text-emerald-600' : 'text-gray-800'}`}>
          {steps.toLocaleString()}
        </div>
        <div className="text-gray-400 text-xs">
          {done ? '✓ 10,000 hit!' : `${(goal - steps).toLocaleString()} to go`}
        </div>
      </div>
      <div className={`text-xl font-bold ${done ? 'text-emerald-600' : 'text-indigo-600'}`}>
        {Math.round(pct * 100)}%
      </div>
    </div>
  )
}

function ScoreCard({ log }) {
  const score = log?.daily_score || 0
  const xp = log?.xp_earned || 0
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : score > 0 ? '#f59e0b' : '#e2e8f0'
  const size = 56, stroke = 6, r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)

  return (
    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div className="absolute text-sm font-black text-gray-800">{score}</div>
      </div>
      <div>
        <div className="text-gray-500 text-xs uppercase tracking-wide">Daily Score</div>
        <div className="text-gray-700 text-sm font-semibold mt-0.5">{score}/100</div>
        {!log && <div className="text-gray-400 text-xs mt-0.5">Log to earn points</div>}
      </div>
      <div className="ml-auto text-right">
        <div className="text-indigo-600 font-black text-lg">+{xp}</div>
        <div className="text-gray-400 text-xs">XP</div>
      </div>
    </div>
  )
}

function GoalList({ log }) {
  const macros = log?.macros || { p: 0, c: 0, f: 0 }
  const cal = log?.calories || 0
  const steps = log?.steps || 0
  const goals = [
    { label: 'Logged',                                        sub: '',                              hit: !!log,                                         pts: 10 },
    { label: `Protein ≥ 160g`,                               sub: `${macros.p}g logged`,           hit: macros.p >= GOALS.protein,                     pts: 25 },
    { label: `Calories ≥ 1800`,                               sub: `${cal} kcal logged`,            hit: cal >= GOALS.calories.target,                  pts: 20 },
    { label: `Steps ≥ 10,000`,                               sub: steps.toLocaleString(),          hit: steps >= 10000,                                pts: 20 },
    { label: 'Gym or Cardio',                                sub: log?.muscles?.join(', ') || '',  hit: !!(log?.exercises?.length || log?.cardio_type), pts: 25 },
  ]

  return (
    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
      <h3 className="text-gray-700 font-semibold mb-2 text-sm">Goals</h3>
      <div className="space-y-1.5">
        {goals.map(g => (
          <div key={g.label}
            className={`flex items-center justify-between rounded-xl px-3 py-2 ${g.hit ? 'bg-emerald-50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${g.hit ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {g.hit ? '✓' : '○'}
              </div>
              <div>
                <span className={`text-xs font-medium ${g.hit ? 'text-gray-700' : 'text-gray-400'}`}>{g.label}</span>
                {g.sub && <span className="text-gray-400 text-xs ml-1.5">{g.sub}</span>}
              </div>
            </div>
            <span className={`text-xs font-semibold shrink-0 ${g.hit ? 'text-emerald-600' : 'text-gray-300'}`}>+{g.pts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Meals({ log }) {
  const items = [
    { label: 'Breakfast', icon: '🌅', key: 'breakfast' },
    { label: 'Lunch',     icon: '☀️', key: 'lunch' },
    { label: 'Dinner',    icon: '🌙', key: 'dinner' },
    { label: 'Snacks',    icon: '🍿', key: 'snacks' },
  ].filter(m => log?.[m.key])
  if (!items.length) return null

  return (
    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
      <h3 className="text-gray-700 font-semibold mb-2 text-sm">Meals</h3>
      <div className="space-y-2">
        {items.map(m => (
          <div key={m.key} className="flex gap-2.5">
            <span className="text-base shrink-0">{m.icon}</span>
            <div>
              <div className="text-xs text-gray-400 font-medium">{m.label}</div>
              <div className="text-gray-600 text-xs">{log[m.key]}</div>
              {log.meal_macros?.[m.key] && (() => {
                const mx = log.meal_macros[m.key]
                const c = mx.p * 4 + mx.c * 4 + mx.f * 9
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
  const over = total > GOALS.dailyBudget
  return (
    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-gray-700 font-semibold text-sm">Spending</h3>
        <span className={`text-xs font-bold ${over ? 'text-red-500' : 'text-gray-600'}`}>
          ₹{total.toLocaleString()} / ₹{GOALS.dailyBudget}
        </span>
      </div>
      <div className="space-y-1.5">
        {log.spending.map((s, i) => (
          <div key={i} className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">{s.item}</span>
              <span className="text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{s.category}</span>
            </div>
            <span className="text-gray-700 font-medium">₹{s.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DayView({ log }) {
  const macros = log?.macros || { p: 0, c: 0, f: 0 }
  const cal = log?.calories || 0
  const steps = log?.steps || 0
  const spent = (log?.spending || []).reduce((s, e) => s + e.amount, 0)

  const calRemaining = Math.max(GOALS.calories.target - cal, 0)
  const proteinRemaining = Math.max(GOALS.protein - macros.p, 0)
  const budgetRemaining = Math.max(GOALS.dailyBudget - spent, 0)

  return (
    <div className="space-y-3">
      <ScoreCard log={log} />

      <div className="grid grid-cols-3 gap-2">
        <RemainCard label="Calories" remaining={calRemaining} consumed={cal} total={GOALS.calories.target}
          unit="kcal" icon="🔥" color="#6366f1" bgColor="bg-indigo-50" borderColor="border-indigo-100" />
        <RemainCard label="Protein" remaining={proteinRemaining} consumed={macros.p} total={GOALS.protein}
          unit="g" icon="💪" color="#8b5cf6" bgColor="bg-purple-50" borderColor="border-purple-100" />
        <RemainCard label="Budget" remaining={budgetRemaining} consumed={spent} total={GOALS.dailyBudget}
          unit="₹" icon="💰" color="#f59e0b" bgColor="bg-amber-50" borderColor="border-amber-100" />
      </div>

      <StepsRing steps={steps} />
      <GoalList log={log} />
      <Meals log={log} />
      <Spending log={log} />

      {log?.badges_unlocked?.length > 0 && (
        <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-100">
          <h3 className="text-yellow-700 font-semibold mb-1.5 text-sm">🎉 Badges Unlocked!</h3>
          <div className="flex gap-2 flex-wrap">
            {log.badges_unlocked.map(b => (
              <span key={b} className="bg-yellow-100 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-medium">{b}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Today({ log, yesterdayLog }) {
  const [tab, setTab] = useState('today')

  const tabs = [
    { id: 'today',     label: '📊 Today' },
    { id: 'yesterday', label: '📅 Yesterday' },
  ]

  return (
    <div className="space-y-3 fade-up">
      <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today'     && <DayView log={log} />}
      {tab === 'yesterday' && <DayView log={yesterdayLog} />}
    </div>
  )
}
