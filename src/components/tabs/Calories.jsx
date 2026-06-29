import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GOALS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'

const MEAL_LIST = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch',     label: 'Lunch',     icon: '☀️' },
  { key: 'dinner',    label: 'Dinner',    icon: '🌙' },
  { key: 'snacks',    label: 'Snacks',    icon: '🍿' },
]

function MacroBar({ label, value, target, color, emoji }) {
  const pct       = Math.min((value / target) * 100, 100)
  const remaining = Math.max(target - value, 0)
  const over      = value > target
  const done      = value >= target

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{emoji}</span>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500"><span className="font-bold text-gray-800">{value}g</span> done</span>
          <span className="text-gray-300">·</span>
          {done
            ? <span className="text-emerald-500 font-semibold">✓ goal hit</span>
            : over
            ? <span className="text-red-400 font-semibold">+{value - target}g over</span>
            : <span className="text-gray-400"><span className="font-semibold text-gray-600">{remaining}g</span> left</span>
          }
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: done ? '#10b981' : color }} />
      </div>
      <div className="flex justify-between text-xs text-gray-300">
        <span>0</span>
        <span>{target}g</span>
      </div>
    </div>
  )
}

function SevenDayChart({ logs }) {
  const data = logs.slice(0, 7).reverse().map(l => ({ date: l.date?.slice(5), calories: l.calories || 0 }))
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barSize={22}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 5000]} width={36} />
        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
        <ReferenceLine y={GOALS.calories.target} stroke="#a5b4fc" strokeDasharray="4 2"
          label={{ value: '3280', fill: '#818cf8', fontSize: 9, position: 'right' }} />
        <Bar dataKey="calories" fill="#6366f1" radius={[5,5,0,0]} name="kcal" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Edit Meal Modal ───────────────────────────────────────────────────────────

function EditMealModal({ mealKey, mealLabel, mealIcon, log, onClose, onSaved }) {
  const existing = log?.[mealKey] || ''
  const existingMacros = log?.meal_macros?.[mealKey] || { p: 0, c: 0, f: 0 }

  const [text,    setText]    = useState(existing)
  const [protein, setProtein] = useState(existingMacros.p || 0)
  const [carbs,   setCarbs]   = useState(existingMacros.c || 0)
  const [fat,     setFat]     = useState(existingMacros.f || 0)
  const [saving,  setSaving]  = useState(false)

  const mealCal = protein * 4 + carbs * 4 + fat * 9

  // Recalculate total calories and macros from all meals
  async function save() {
    setSaving(true)
    const meals = { breakfast: log?.meal_macros?.breakfast || { p:0,c:0,f:0 },
                    lunch:     log?.meal_macros?.lunch     || { p:0,c:0,f:0 },
                    dinner:    log?.meal_macros?.dinner    || { p:0,c:0,f:0 },
                    snacks:    log?.meal_macros?.snacks    || { p:0,c:0,f:0 } }
    meals[mealKey] = { p: Number(protein)||0, c: Number(carbs)||0, f: Number(fat)||0 }

    const totalP = Object.values(meals).reduce((s,m) => s + (m.p||0), 0)
    const totalC = Object.values(meals).reduce((s,m) => s + (m.c||0), 0)
    const totalF = Object.values(meals).reduce((s,m) => s + (m.f||0), 0)
    const totalCal = totalP*4 + totalC*4 + totalF*9

    await supabase.from('daily_logs').update({
      [mealKey]: text || null,
      meal_macros: meals,
      macros: { p: totalP, c: totalC, f: totalF },
      calories: totalCal,
    }).eq('date', log.date)

    setSaving(false)
    onSaved()
    onClose()
  }

  async function clearMeal() {
    setSaving(true)
    const meals = { breakfast: log?.meal_macros?.breakfast || { p:0,c:0,f:0 },
                    lunch:     log?.meal_macros?.lunch     || { p:0,c:0,f:0 },
                    dinner:    log?.meal_macros?.dinner    || { p:0,c:0,f:0 },
                    snacks:    log?.meal_macros?.snacks    || { p:0,c:0,f:0 } }
    meals[mealKey] = { p:0, c:0, f:0 }
    const totalP = Object.values(meals).reduce((s,m) => s + m.p, 0)
    const totalC = Object.values(meals).reduce((s,m) => s + m.c, 0)
    const totalF = Object.values(meals).reduce((s,m) => s + m.f, 0)

    await supabase.from('daily_logs').update({
      [mealKey]: null,
      meal_macros: meals,
      macros: { p: totalP, c: totalC, f: totalF },
      calories: totalP*4 + totalC*4 + totalF*9,
    }).eq('date', log.date)

    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">{mealIcon}</span>
            <span className="font-bold text-gray-800">{mealLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {existing && (
              <button onClick={clearMeal} disabled={saving}
                className="text-red-400 text-xs font-medium hover:text-red-600 transition-colors">
                Remove
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 text-sm ml-2">Cancel</button>
            <button onClick={save} disabled={saving}
              className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-xl disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 pb-8">
          {/* Meal description */}
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">What did you eat?</label>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
              placeholder="e.g. 2 rotis, dal, salad"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 resize-none" />
          </div>

          {/* Macros */}
          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Macros</label>
            <div className="grid grid-cols-3 gap-2">
              {[['Protein (g)', protein, setProtein, '#6366f1'],
                ['Carbs (g)',   carbs,   setCarbs,   '#f59e0b'],
                ['Fat (g)',     fat,     setFat,     '#ec4899']].map(([label, val, setter, color]) => (
                <div key={label}>
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <input type="number" min="0" value={val}
                    onChange={e => setter(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center font-semibold focus:outline-none focus:border-indigo-400"
                    style={{ color }} />
                </div>
              ))}
            </div>
          </div>

          {/* Live calorie preview */}
          <div className="bg-indigo-50 rounded-xl px-4 py-2.5 flex justify-between items-center">
            <span className="text-indigo-600 text-sm font-medium">This meal</span>
            <span className="text-indigo-600 font-bold">{mealCal} kcal</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Meal Row ──────────────────────────────────────────────────────────────────

function MealRow({ mealKey, label, icon, log, onEdit }) {
  const text   = log?.[mealKey]
  const macros = log?.meal_macros?.[mealKey]
  const hasMacros = macros && (macros.p || macros.c || macros.f)
  const cal = hasMacros ? macros.p*4 + macros.c*4 + macros.f*9 : 0

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xl shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-400 mb-0.5">{label}</div>
        {text
          ? <div className="text-sm text-gray-700 leading-snug">{text}</div>
          : <div className="text-sm text-gray-300 italic">Not logged</div>
        }
        {hasMacros && (
          <div className="text-xs text-gray-400 mt-1">
            {cal} kcal · <span className="text-indigo-400">P{macros.p}</span> · <span className="text-amber-400">C{macros.c}</span> · <span className="text-pink-400">F{macros.f}</span>
          </div>
        )}
      </div>
      <button onClick={() => onEdit(mealKey)}
        className="shrink-0 text-gray-300 hover:text-indigo-500 transition-colors text-sm px-1 py-0.5 rounded-lg hover:bg-indigo-50">
        ✏️
      </button>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Calories({ todayLog, logs, onRefresh }) {
  const [editingMeal, setEditingMeal] = useState(null)

  const cal     = todayLog?.calories || 0
  const macros  = todayLog?.macros   || { p: 0, c: 0, f: 0 }
  const remaining = Math.max(GOALS.calories.target - cal, 0)
  const over    = cal > GOALS.calories.target
  const onTarget = cal >= GOALS.calories.target
  const pct     = Math.min((cal / GOALS.calories.target) * 100, 100)

  const totalDeficit = logs.reduce((sum, l) => l.calories ? sum + (GOALS.calories.target - l.calories) : sum, 0)
  const kgLost = Math.max((totalDeficit / 7700).toFixed(2), 0)

  const editingMealMeta = MEAL_LIST.find(m => m.key === editingMeal)

  return (
    <div className="space-y-3 fade-up">
      {/* Hero */}
      <div className={`rounded-2xl p-4 border shadow-sm ${onTarget ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-gray-500 text-xs font-medium uppercase tracking-wide">Today</div>
            <div className={`text-4xl font-black mt-0.5 ${onTarget ? 'text-emerald-600' : 'text-gray-800'}`}>
              {cal.toLocaleString()}
              <span className="text-base font-medium text-gray-400 ml-1">kcal</span>
            </div>
          </div>
          <div className="text-right">
            {over ? (
              <div className="bg-amber-50 text-amber-500 text-xs font-bold px-2.5 py-1 rounded-full">
                +{(cal - GOALS.calories.target).toLocaleString()} over
              </div>
            ) : (
              <div>
                <div className={`text-2xl font-black ${remaining === 0 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                  {remaining.toLocaleString()}
                </div>
                <div className="text-gray-400 text-xs">kcal left</div>
              </div>
            )}
          </div>
        </div>
        <div className="h-2.5 bg-white/70 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: onTarget ? '#10b981' : '#6366f1' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{cal.toLocaleString()} eaten</span>
          <span className="text-indigo-400">target: {GOALS.calories.target.toLocaleString()}</span>
        </div>
      </div>

      {/* Macros */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-700 font-semibold text-sm">Macros</h3>
          <span className="text-xs text-gray-400">P·{macros.p} C·{macros.c} F·{macros.f}</span>
        </div>
        <MacroBar label="Protein" value={macros.p} target={GOALS.protein} color="#6366f1" emoji="💪" />
        <MacroBar label="Carbs"   value={macros.c} target={GOALS.carbs}   color="#f59e0b" emoji="🌾" />
        <MacroBar label="Fat"     value={macros.f} target={GOALS.fat}     color="#ec4899" emoji="🧈" />
      </div>

      {/* Food Log — today */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-gray-700 font-semibold text-sm">Today's Meals</h3>
          <span className="text-gray-400 text-xs">tap ✏️ to edit</span>
        </div>
        <div className="divide-y divide-gray-50">
          {MEAL_LIST.map(m => (
            <MealRow key={m.key} mealKey={m.key} label={m.label} icon={m.icon}
              log={todayLog} onEdit={setEditingMeal} />
          ))}
        </div>
      </div>

      {/* 7-day chart */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">7-Day Trend</h3>
        <SevenDayChart logs={logs} />
      </div>

      {/* Deficit */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-3">Cumulative Deficit</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-indigo-600">{totalDeficit > 0 ? '+' : ''}{totalDeficit.toLocaleString()}</div>
            <div className="text-gray-400 text-xs mt-0.5">kcal deficit</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-600">~{kgLost} kg</div>
            <div className="text-gray-400 text-xs mt-0.5">estimated fat lost</div>
          </div>
        </div>
      </div>

      {/* Edit meal modal */}
      {editingMeal && editingMealMeta && (
        <EditMealModal
          mealKey={editingMeal}
          mealLabel={editingMealMeta.label}
          mealIcon={editingMealMeta.icon}
          log={todayLog}
          onClose={() => setEditingMeal(null)}
          onSaved={() => { setEditingMeal(null); onRefresh?.() }}
        />
      )}
    </div>
  )
}
