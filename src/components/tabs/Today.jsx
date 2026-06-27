import { useState } from 'react'
import { GOALS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

function RemainCard({ label, remaining, consumed, total, unit, icon, color, bgColor, borderColor }) {
  const pct  = Math.min((consumed / total) * 100, 100)
  const done = consumed >= total
  const over = consumed > total

  return (
    <div className={`rounded-2xl p-3 border ${borderColor} ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</div>
        <div className="text-base">{icon}</div>
      </div>

      {/* Done */}
      <div className="flex items-baseline gap-1 leading-none">
        <span className={`text-xl font-black ${done ? 'text-emerald-600' : 'text-gray-800'}`}>{consumed}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <div className="text-gray-400 text-xs mt-0.5">done</div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/70 rounded-full overflow-hidden my-2">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, background: over ? '#ef4444' : done ? '#10b981' : color }} />
      </div>

      {/* Left */}
      <div className="flex items-baseline gap-1 leading-none">
        {over
          ? <span className="text-base font-black text-red-500">+{Math.abs(remaining)}</span>
          : <span className={`text-base font-black ${done ? 'text-emerald-600' : 'text-gray-700'}`}>{remaining}</span>
        }
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <div className="text-gray-400 text-xs mt-0.5">
        {done ? '✓ hit!' : over ? 'over' : 'left'}
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
    { label: 'Logged',          sub: '',                              hit: !!log,                                         pts: 10 },
    { label: 'Protein ≥ 160g', sub: `${macros.p}g logged`,           hit: macros.p >= GOALS.protein,                     pts: 25 },
    { label: 'Calories ≥ 1800', sub: `${cal} kcal logged`,           hit: cal >= GOALS.calories.target,                  pts: 20 },
    { label: 'Steps ≥ 10,000', sub: steps.toLocaleString(),          hit: steps >= 10000,                                pts: 20 },
    { label: 'Gym or Cardio',  sub: log?.muscles?.join(', ') || '',  hit: !!(log?.exercises?.length || log?.cardio_type), pts: 25 },
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

function SpendingView({ log }) {
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

// ─── Edit Modal ────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="text-gray-400 text-xs mb-1 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400" />
    </div>
  )
}

function EditLogModal({ log, onClose, onSaved }) {
  const [meals, setMeals] = useState({
    breakfast: log?.breakfast || '',
    lunch:     log?.lunch     || '',
    dinner:    log?.dinner    || '',
    snacks:    log?.snacks    || '',
  })
  const [calories,   setCalories]   = useState(log?.calories || 0)
  const [macros,     setMacros]     = useState(log?.macros   || { p: 0, c: 0, f: 0 })
  const [steps,      setSteps]      = useState(log?.steps    || 0)
  const [weight,     setWeight]     = useState(log?.weight   || '')
  const [screenTime, setScreenTime] = useState(log?.screen_time || 0)
  const [spending,   setSpending]   = useState(log?.spending  || [])
  const [newItem,    setNewItem]    = useState({ item: '', category: 'Food', amount: '' })
  const [saving,     setSaving]     = useState(false)

  function setMacro(k, v) { setMacros(m => ({ ...m, [k]: Number(v) || 0 })) }

  function removeSpend(i)  { setSpending(prev => prev.filter((_, j) => j !== i)) }

  function addSpend() {
    if (!newItem.item || !newItem.amount) return
    setSpending(prev => [...prev, { ...newItem, amount: Number(newItem.amount) }])
    setNewItem({ item: '', category: 'Food', amount: '' })
  }

  async function save() {
    setSaving(true)
    await supabase.from('daily_logs').update({
      breakfast:   meals.breakfast || null,
      lunch:       meals.lunch     || null,
      dinner:      meals.dinner    || null,
      snacks:      meals.snacks    || null,
      calories:    Number(calories) || 0,
      macros,
      steps:       Number(steps)      || 0,
      weight:      weight ? Number(weight) : null,
      screen_time: Number(screenTime) || 0,
      spending,
    }).eq('date', log.date)
    setSaving(false)
    onSaved()
    onClose()
  }

  const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Health','Rent','Subscriptions','Bills','Education']
  const MEAL_KEYS  = [['breakfast','🌅 Breakfast'],['lunch','☀️ Lunch'],['dinner','🌙 Dinner'],['snacks','🍿 Snacks']]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-white rounded-t-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-800">Edit Log</h3>
            <div className="text-gray-400 text-xs">{log?.date}</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-400 text-sm">Cancel</button>
            <button onClick={save} disabled={saving}
              className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-xl disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-6 pb-8">

          {/* Meals */}
          <section>
            <h4 className="text-gray-700 font-semibold text-sm mb-3">Meals</h4>
            <div className="space-y-2">
              {MEAL_KEYS.map(([key, label]) => (
                <div key={key} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Field label={label} value={meals[key]} placeholder={`No ${key} logged`}
                      onChange={v => setMeals(m => ({ ...m, [key]: v }))} />
                  </div>
                  {meals[key] && (
                    <button onClick={() => setMeals(m => ({ ...m, [key]: '' }))}
                      className="mt-6 text-gray-300 hover:text-red-400 transition-colors px-1.5 text-lg leading-none">×</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Macros & Calories */}
          <section>
            <h4 className="text-gray-700 font-semibold text-sm mb-3">Macros & Calories</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Calories (kcal)" type="number" value={calories} onChange={setCalories} />
              <Field label="Protein (g)"     type="number" value={macros.p} onChange={v => setMacro('p', v)} />
              <Field label="Carbs (g)"       type="number" value={macros.c} onChange={v => setMacro('c', v)} />
              <Field label="Fat (g)"         type="number" value={macros.f} onChange={v => setMacro('f', v)} />
            </div>
          </section>

          {/* Spending */}
          <section>
            <h4 className="text-gray-700 font-semibold text-sm mb-3">Spending</h4>

            {spending.length === 0 && (
              <div className="text-gray-400 text-xs mb-3">No spending logged.</div>
            )}

            <div className="space-y-2 mb-3">
              {spending.map((s, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="flex-1 text-sm text-gray-700 truncate">{s.item}</span>
                  <span className="text-xs text-gray-400 shrink-0">{s.category}</span>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">₹{s.amount}</span>
                  <button onClick={() => removeSpend(i)}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none shrink-0">×</button>
                </div>
              ))}
            </div>

            {/* Add spending item */}
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="text-gray-500 text-xs font-medium">Add item</div>
              <input value={newItem.item} onChange={e => setNewItem(n => ({ ...n, item: e.target.value }))}
                placeholder="Description"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              <div className="flex gap-2">
                <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={newItem.amount} onChange={e => setNewItem(n => ({ ...n, amount: e.target.value }))}
                  placeholder="₹"
                  className="w-20 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                <button onClick={addSpend}
                  className="bg-indigo-600 text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors">+</button>
              </div>
            </div>
          </section>

          {/* Steps / Weight / Screen */}
          <section>
            <h4 className="text-gray-700 font-semibold text-sm mb-3">Activity</h4>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Steps"       type="number" value={steps}      onChange={setSteps} />
              <Field label="Weight (kg)" type="number" value={weight}     onChange={setWeight} />
              <Field label="Screen (min)" type="number" value={screenTime} onChange={setScreenTime} />
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

// ─── Day View ──────────────────────────────────────────────────────────────────

function DayView({ log, onRefresh }) {
  const [editing, setEditing] = useState(false)
  const macros = log?.macros || { p: 0, c: 0, f: 0 }
  const cal    = log?.calories || 0
  const steps  = log?.steps   || 0
  const spent  = (log?.spending || []).reduce((s, e) => s + e.amount, 0)

  const calRemaining    = Math.max(GOALS.calories.target - cal, 0)
  const proteinRemaining = Math.max(GOALS.protein - macros.p, 0)
  const budgetRemaining  = Math.max(GOALS.dailyBudget - spent, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <ScoreCard log={log} />
      </div>

      {log && (
        <button onClick={() => setEditing(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-500 text-sm font-medium py-2.5 rounded-2xl hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm">
          ✏️ Edit this log
        </button>
      )}

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
      <SpendingView log={log} />

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

      {editing && log && (
        <EditLogModal
          log={log}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onRefresh?.() }}
        />
      )}
    </div>
  )
}

export default function Today({ log, yesterdayLog, onRefresh }) {
  const [tab, setTab] = useState('today')

  return (
    <div className="space-y-3 fade-up">
      <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
        {[['today','📊 Today'],['yesterday','📅 Yesterday']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'today'     && <DayView log={log}          onRefresh={onRefresh} />}
      {tab === 'yesterday' && <DayView log={yesterdayLog} onRefresh={onRefresh} />}
    </div>
  )
}
