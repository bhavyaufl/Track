import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { GOALS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { useTooltipStyle } from '../../lib/DarkContext'

function MacroBar({ label, value, target, color, emoji }) {
  const pct  = Math.min((value / target) * 100, 100)
  const rem  = Math.max(target - value, 0)
  const over = value > target
  const done = value >= target

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <span className="text-sm">{emoji}</span>
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-gray-700">{value}g</span>
          <span className="text-gray-300">·</span>
          {done
            ? <span className="text-emerald-500 font-semibold">✓</span>
            : over
            ? <span className="text-red-400 font-semibold">+{value - target}g over</span>
            : <span className="text-gray-400">{rem}g left</span>
          }
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-0.5">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: done ? '#10b981' : color }} />
      </div>
      <div className="flex justify-between text-xs text-gray-300">
        <span>0</span><span>{target}g</span>
      </div>
    </div>
  )
}

function SevenDayChart({ logs }) {
  const tooltipStyle = useTooltipStyle()
  const data = logs.slice(0, 7).reverse().map(l => ({ date: l.date?.slice(5), calories: l.calories || 0 }))
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} barSize={20}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} />
        <YAxis stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 5000]} width={36} />
        <Tooltip contentStyle={tooltipStyle} />
        <ReferenceLine y={GOALS.calories.target} stroke="#a5b4fc" strokeDasharray="4 2"
          label={{ value: `${GOALS.calories.target}`, fill: '#818cf8', fontSize: 9, position: 'right' }} />
        <Bar dataKey="calories" fill="#6366f1" radius={[4,4,0,0]} name="kcal" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Edit Meal Modal ──────────────────────────────────────────────────────────

function EditMealModal({ mealIndex, meals, log, onClose, onSaved }) {
  const meal = meals[mealIndex] || {}
  const calcCal = (p, c, f) => Number(p||0)*4 + Number(c||0)*4 + Number(f||0)*9

  const [text,    setText]    = useState(meal.text       || '')
  const [time,    setTime]    = useState(meal.time       || '')
  const [protein, setProtein] = useState(meal.macros?.p  || 0)
  const [carbs,   setCarbs]   = useState(meal.macros?.c  || 0)
  const [fat,     setFat]     = useState(meal.macros?.f  || 0)
  const [calOvr,  setCalOvr]  = useState(meal.calories ?? calcCal(meal.macros?.p, meal.macros?.c, meal.macros?.f))
  const [saving,  setSaving]  = useState(false)

  // Keep calorie field in sync when macros change, unless user has manually overridden it
  const [calManual, setCalManual] = useState(meal.calories != null)
  function onMacroChange(setter, val) {
    setter(Math.max(0, Number(val)))
    if (!calManual) setCalOvr(calcCal(
      setter === setProtein ? val : protein,
      setter === setCarbs   ? val : carbs,
      setter === setFat     ? val : fat,
    ))
  }

  function recalcAndSave(updatedMeals) {
    const totalP   = updatedMeals.reduce((s, m) => s + (m.macros?.p || 0), 0)
    const totalC   = updatedMeals.reduce((s, m) => s + (m.macros?.c || 0), 0)
    const totalF   = updatedMeals.reduce((s, m) => s + (m.macros?.f || 0), 0)
    const totalCal = updatedMeals.reduce((s, m) => s + (m.calories ?? calcCal(m.macros?.p, m.macros?.c, m.macros?.f)), 0)
    return supabase.from('daily_logs').update({
      meals:    updatedMeals,
      macros:   { p: totalP, c: totalC, f: totalF },
      calories: totalCal,
    }).eq('date', log.date)
  }

  async function save() {
    setSaving(true)
    const updated = meals.map((m, i) => i === mealIndex ? {
      ...m, text, time,
      macros:   { p: Number(protein)||0, c: Number(carbs)||0, f: Number(fat)||0 },
      calories: Number(calOvr) || calcCal(protein, carbs, fat),
    } : m)
    await recalcAndSave(updated)
    setSaving(false); onSaved(); onClose()
  }

  async function removeMeal() {
    setSaving(true)
    const updated = meals.filter((_, i) => i !== mealIndex).map((m, i) => ({ ...m, label: `Meal ${i+1}` }))
    await recalcAndSave(updated)
    setSaving(false); onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            {meal.label || `Meal ${mealIndex + 1}`}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={removeMeal} disabled={saving}
              className="text-red-400 text-xs font-medium hover:text-red-600 transition-colors">Remove</button>
            <button onClick={onClose} className="text-gray-400 text-sm ml-2">Cancel</button>
            <button onClick={save} disabled={saving}
              className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-xl disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 pb-8">
          <div className="flex gap-3">
            <div className="shrink-0">
              <label className="text-gray-400 text-xs mb-1.5 block">Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 w-28" />
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-xs mb-1.5 block">What did you eat?</label>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
                placeholder="e.g. 2 rotis, dal, salad"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 resize-none" />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1.5 block">Macros</label>
            <div className="grid grid-cols-4 gap-2">
              {[['P (g)', protein, setProtein, '#6366f1'],
                ['C (g)', carbs,   setCarbs,   '#f59e0b'],
                ['F (g)', fat,     setFat,     '#ec4899']].map(([label, val, setter, clr]) => (
                <div key={label}>
                  <div className="text-xs text-gray-400 mb-1 text-center">{label}</div>
                  <input type="number" min="0" value={val}
                    onChange={e => onMacroChange(setter, e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-sm text-center font-semibold focus:outline-none focus:border-indigo-400"
                    style={{ color: clr }} />
                </div>
              ))}
              <div>
                <div className="text-xs text-gray-400 mb-1 text-center">kcal</div>
                <input type="number" min="0" value={calOvr}
                  onChange={e => { setCalOvr(e.target.value); setCalManual(true) }}
                  className="w-full bg-indigo-50 border border-indigo-200 rounded-xl px-2 py-2 text-sm text-center font-bold text-indigo-600 focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
            {calManual && (
              <button onClick={() => { setCalOvr(calcCal(protein,carbs,fat)); setCalManual(false) }}
                className="text-xs text-gray-400 mt-1.5 hover:text-indigo-500 transition-colors">
                ↺ reset to calculated ({calcCal(protein,carbs,fat)} kcal)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Meal Row ─────────────────────────────────────────────────────────────────

function MealRow({ meal, index, onEdit }) {
  const kcal      = meal.macros ? meal.macros.p*4 + meal.macros.c*4 + meal.macros.f*9 : 0
  const hasMacros = meal.macros && (meal.macros.p || meal.macros.c || meal.macros.f)

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <div className="shrink-0 mt-0.5 text-center">
        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
          {meal.label || `Meal ${index+1}`}
        </span>
        {meal.time && <div className="text-xs text-gray-400 mt-0.5">{meal.time}</div>}
      </div>
      <div className="flex-1 min-w-0">
        {meal.text
          ? <div className="text-sm text-gray-700 leading-snug">{meal.text}</div>
          : <div className="text-sm text-gray-300 italic">Not logged</div>
        }
        {hasMacros && (
          <div className="text-xs text-gray-400 mt-0.5">
            {kcal} kcal · <span className="text-indigo-400">P{meal.macros.p}</span> · <span className="text-amber-400">C{meal.macros.c}</span> · <span className="text-pink-400">F{meal.macros.f}</span>
          </div>
        )}
      </div>
      {onEdit && (
        <button onClick={() => onEdit(index)}
          className="shrink-0 text-gray-300 hover:text-indigo-500 transition-colors text-sm px-1 py-0.5 rounded-lg hover:bg-indigo-50">
          ✏️
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Calories({ todayLog, logs, onRefresh }) {
  const [editingIndex, setEditingIndex] = useState(null)

  const cal    = todayLog?.calories || 0
  const macros = todayLog?.macros   || { p: 0, c: 0, f: 0 }
  const rem    = Math.max(GOALS.calories.target - cal, 0)
  const over   = cal > GOALS.calories.target
  const onTgt  = cal >= GOALS.calories.target
  const pct    = Math.min((cal / GOALS.calories.target) * 100, 100)

  const loggedDays   = logs.filter(l => l.calories > 0).length
  const totalCals    = logs.reduce((s, l) => s + (l.calories || 0), 0)
  const avgCals      = loggedDays > 0 ? Math.round(totalCals / loggedDays) : 0
  const totalSurplus = logs.reduce((s, l) => l.calories ? s + (l.calories - GOALS.calories.target) : s, 0)
  const daysOnTarget = logs.filter(l => l.calories >= GOALS.calories.target).length

  // Meals — new format with fallback to legacy columns
  const newMeals = todayLog?.meals || []
  const meals = newMeals.length > 0 ? newMeals : [
    todayLog?.breakfast && { label: 'Meal 1', text: todayLog.breakfast, time: '', macros: todayLog?.meal_macros?.breakfast },
    todayLog?.lunch     && { label: 'Meal 2', text: todayLog.lunch,     time: '', macros: todayLog?.meal_macros?.lunch },
    todayLog?.dinner    && { label: 'Meal 3', text: todayLog.dinner,    time: '', macros: todayLog?.meal_macros?.dinner },
    todayLog?.snacks    && { label: 'Meal 4', text: todayLog.snacks,    time: '', macros: todayLog?.meal_macros?.snacks },
  ].filter(Boolean)

  return (
    <div className="space-y-3 fade-up">

      {/* Hero — compact */}
      <div className={`rounded-2xl px-4 py-3 border shadow-sm ${onTgt ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wide">Today</div>
            <div className={`text-2xl font-black leading-none mt-0.5 ${onTgt ? 'text-emerald-600' : 'text-gray-800'}`}>
              {cal.toLocaleString()}<span className="text-sm font-medium text-gray-400 ml-1">kcal</span>
            </div>
          </div>
          <div className="text-right">
            {over ? (
              <div className="bg-amber-50 text-amber-500 text-xs font-bold px-2 py-1 rounded-full">
                +{(cal - GOALS.calories.target).toLocaleString()} over
              </div>
            ) : (
              <div>
                <div className={`text-lg font-black leading-none ${rem === 0 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                  {rem.toLocaleString()}
                </div>
                <div className="text-gray-400 text-xs">kcal left</div>
              </div>
            )}
          </div>
        </div>
        <div className="h-2 bg-white/70 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: onTgt ? '#10b981' : '#6366f1' }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{cal.toLocaleString()} eaten</span>
          <span className="text-indigo-400">target: {GOALS.calories.target.toLocaleString()}</span>
        </div>
      </div>

      {/* Macros — compact */}
      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm space-y-2.5">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-700 font-semibold text-sm">Macros</h3>
          <span className="text-xs text-gray-400">P·{macros.p} C·{macros.c} F·{macros.f}</span>
        </div>
        <MacroBar label="Protein" value={macros.p} target={GOALS.protein} color="#6366f1" emoji="💪" />
        <MacroBar label="Carbs"   value={macros.c} target={GOALS.carbs}   color="#f59e0b" emoji="🌾" />
        <MacroBar label="Fat"     value={macros.f} target={GOALS.fat}     color="#ec4899" emoji="🧈" />
      </div>

      {/* Meals */}
      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gray-700 font-semibold text-sm">Today's Meals</h3>
          {meals.length > 0 && newMeals.length > 0 && (
            <span className="text-gray-400 text-xs">tap ✏️ to edit</span>
          )}
        </div>
        {meals.length > 0 ? (
          <div>
            {meals.map((m, i) => (
              <MealRow key={i} meal={m} index={i} onEdit={newMeals.length > 0 ? setEditingIndex : undefined} />
            ))}
          </div>
        ) : (
          <div className="text-gray-300 text-sm text-center py-3">No meals logged yet</div>
        )}
      </div>

      {/* 7-day chart */}
      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-2">7-Day Trend</h3>
        <SevenDayChart logs={logs} />
      </div>

      {/* Calorie summary */}
      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
        <h3 className="text-gray-700 font-semibold text-sm mb-2">Calorie Summary</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-indigo-50 rounded-xl p-2.5 text-center">
            <div className={`text-lg font-bold ${totalSurplus >= 0 ? 'text-indigo-600' : 'text-red-400'}`}>
              {totalSurplus >= 0 ? '+' : ''}{totalSurplus.toLocaleString()}
            </div>
            <div className="text-gray-400 text-xs mt-0.5">kcal {totalSurplus >= 0 ? 'surplus' : 'deficit'}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-gray-700">{avgCals.toLocaleString()}</div>
            <div className="text-gray-400 text-xs mt-0.5">avg kcal / day</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-emerald-600">{daysOnTarget}</div>
            <div className="text-gray-400 text-xs mt-0.5">days on target</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-bold text-amber-600">{loggedDays}</div>
            <div className="text-gray-400 text-xs mt-0.5">days logged</div>
          </div>
        </div>
      </div>

      {editingIndex !== null && todayLog && (
        <EditMealModal
          mealIndex={editingIndex}
          meals={meals}
          log={todayLog}
          onClose={() => setEditingIndex(null)}
          onSaved={() => { setEditingIndex(null); onRefresh?.() }}
        />
      )}
    </div>
  )
}
