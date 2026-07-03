import { useState } from 'react'
import { GOALS, EXERCISE_GOALS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { WEEKLY_PLAN } from '../../lib/mealPlan'
import { DAY_WORKOUT, GROUP_LABEL, GROUP_EMOJI, GROUP_COLOR, WORKOUT_GROUPS, CARDIO_PLAN } from '../../lib/workoutPlan'

function ScoreStrip({ log, onEdit }) {
  const score = log?.daily_score || 0
  const xp    = log?.xp_earned  || 0
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : score > 0 ? '#f59e0b' : '#cbd5e1'
  const r = 17, circ = 2 * Math.PI * r

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 px-3 py-2">
      <div className="relative flex items-center justify-center shrink-0">
        <svg width={42} height={42} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={21} cy={21} r={r} fill="none" stroke="#f1f5f9" strokeWidth={4.5} />
          <circle cx={21} cy={21} r={r} fill="none" stroke={color} strokeWidth={4.5}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round" />
        </svg>
        <div className="absolute text-xs font-black" style={{ color }}>{score}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-700">{score}/100 daily score</div>
        <div className="text-gray-400 text-xs">{log ? `+${xp} XP earned` : 'Nothing logged yet'}</div>
      </div>
      {log && (
        <button onClick={onEdit}
          className="shrink-0 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
          ✏️ Edit
        </button>
      )}
    </div>
  )
}

function RemainCard({ label, remaining, consumed, total, unit, icon, color, bgClass }) {
  const pct   = Math.min((consumed / total) * 100, 100)
  const done  = consumed >= total
  const over  = consumed > total
  const bar   = over ? '#ef4444' : done ? '#10b981' : color

  return (
    <div className={`rounded-xl p-2.5 border ${bgClass} shadow-sm`} style={{ borderColor: color + '33' }}>
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-sm leading-none">{icon}</span>
        <span className="text-gray-500 text-xs font-semibold truncate">{label}</span>
      </div>

      <div className="flex items-baseline gap-0.5 leading-none mb-0.5">
        <span className={`text-lg font-black ${done ? 'text-emerald-600' : 'text-gray-800'}`}>{consumed}</span>
        <span className="text-gray-400 text-xs">/{total}{unit}</span>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden my-1.5" style={{ background: 'rgba(255,255,255,0.7)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, background: bar }} />
      </div>

      <div className={`text-xs font-bold leading-none ${over ? 'text-red-500' : done ? 'text-emerald-600' : 'text-gray-500'}`}>
        {over
          ? `+${Math.abs(remaining)}${unit} over`
          : done
          ? '✓ goal hit!'
          : `${remaining}${unit} left`}
      </div>
    </div>
  )
}

function StepsBar({ steps }) {
  const goal = GOALS.steps
  const pct  = Math.min(steps / goal, 1)
  const done = steps >= goal

  return (
    <div className={`bg-white rounded-xl px-3 py-2.5 border shadow-sm flex items-center gap-3 ${done ? 'border-emerald-100' : 'border-gray-100'}`}>
      <span className="text-lg shrink-0">👣</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-sm font-bold ${done ? 'text-emerald-600' : 'text-gray-800'}`}>
            {steps.toLocaleString()}
            <span className="text-xs text-gray-400 font-normal"> / {goal.toLocaleString()}</span>
          </span>
          <span className={`text-xs font-bold ${done ? 'text-emerald-500' : 'text-indigo-500'}`}>
            {Math.round(pct * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct * 100}%`, background: done ? '#10b981' : '#6366f1' }} />
        </div>
      </div>
      {done && <span className="text-emerald-500 text-xs font-bold shrink-0">✓</span>}
    </div>
  )
}

function GoalList({ log }) {
  const macros = log?.macros || { p: 0, c: 0, f: 0 }
  const cal    = log?.calories || 0
  const steps  = log?.steps   || 0
  const goals  = [
    { label: 'Logged',           sub: '',                                   hit: !!log,                                          pts: 10 },
    { label: 'Protein ≥ 160g',  sub: `${macros.p}g`,                       hit: macros.p >= GOALS.protein,                      pts: 25 },
    { label: 'Calories 1500',   sub: `${cal}kcal`,                         hit: cal >= 1400 && cal <= 1600,                     pts: 20 },
    { label: 'Steps ≥ 10k',     sub: steps.toLocaleString(),               hit: steps >= 10000,                                 pts: 20 },
    { label: 'Gym or Cardio',   sub: log?.muscles?.slice(0, 2).join(', ') || '', hit: !!(log?.exercises?.length || log?.cardio_type), pts: 25 },
  ]
  const hitCount = goals.filter(g => g.hit).length

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Goals</span>
        <span className="text-xs font-bold text-indigo-500">{hitCount}/{goals.length} hit</span>
      </div>
      <div className="divide-y divide-gray-50">
        {goals.map(g => (
          <div key={g.label} className={`flex items-center px-3 py-1.5 ${g.hit ? 'bg-emerald-50/40' : ''}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mr-2 ${
              g.hit ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'
            }`}>
              {g.hit ? '✓' : ''}
            </div>
            <span className={`text-xs flex-1 ${g.hit ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{g.label}</span>
            {g.sub && <span className="text-gray-400 text-xs mx-2">{g.sub}</span>}
            <span className={`text-xs font-bold shrink-0 ${g.hit ? 'text-emerald-600' : 'text-gray-200'}`}>+{g.pts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MealEditSheet({ meal, index, allMeals, log, onClose, onSaved }) {
  const calcCal = (p, c, f) => Number(p||0)*4 + Number(c||0)*4 + Number(f||0)*9

  const [text,    setText]    = useState(meal.text      || '')
  const [time,    setTime]    = useState(meal.time      || '')
  const [protein, setProtein] = useState(meal.macros?.p || 0)
  const [carbs,   setCarbs]   = useState(meal.macros?.c || 0)
  const [fat,     setFat]     = useState(meal.macros?.f || 0)
  const [calOvr,  setCalOvr]  = useState(meal.calories ?? calcCal(meal.macros?.p, meal.macros?.c, meal.macros?.f))
  const [calManual, setCalManual] = useState(meal.calories != null)
  const [saving,  setSaving]  = useState(false)

  function onMacroChange(setter, val) {
    setter(Math.max(0, Number(val)))
    if (!calManual) setCalOvr(calcCal(
      setter === setProtein ? val : protein,
      setter === setCarbs   ? val : carbs,
      setter === setFat     ? val : fat,
    ))
  }

  function recalc(updatedMeals) {
    const p   = updatedMeals.reduce((s, m) => s + (m.macros?.p || 0), 0)
    const c   = updatedMeals.reduce((s, m) => s + (m.macros?.c || 0), 0)
    const f   = updatedMeals.reduce((s, m) => s + (m.macros?.f || 0), 0)
    const cal = updatedMeals.reduce((s, m) => s + (m.calories ?? calcCal(m.macros?.p, m.macros?.c, m.macros?.f)), 0)
    return supabase.from('daily_logs').update({
      meals: updatedMeals, macros: { p, c, f }, calories: cal,
    }).eq('date', log.date)
  }

  async function save() {
    setSaving(true)
    const updated = allMeals.map((m, i) => i === index ? {
      ...m, text, time,
      macros:   { p: Number(protein)||0, c: Number(carbs)||0, f: Number(fat)||0 },
      calories: Number(calOvr) || calcCal(protein, carbs, fat),
    } : m)
    await recalc(updated)
    setSaving(false); onSaved(); onClose()
  }

  async function remove() {
    setSaving(true)
    const updated = allMeals.filter((_, i) => i !== index).map((m, i) => ({ ...m, label: `Meal ${i+1}` }))
    await recalc(updated)
    setSaving(false); onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-white rounded-t-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            {meal.label || `Meal ${index+1}`}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={remove} disabled={saving}
              className="text-red-400 text-xs font-semibold hover:text-red-600 transition-colors">🗑 Remove</button>
            <button onClick={onClose} className="text-gray-400 text-xs">Cancel</button>
            <button onClick={save} disabled={saving}
              className="bg-indigo-600 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        <div className="px-5 py-4 pb-8 space-y-3">
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
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 resize-none" />
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

function getMealStatus(planned, logged) {
  if (!logged) return 'pending'
  const lp  = logged.macros?.p || 0
  const lf  = logged.macros?.f || 0
  const lc  = logged.macros?.c || 0
  const lkc = logged.calories ?? (lp * 4 + lc * 4 + lf * 9)
  const proteinOk = lp >= planned.macros.p * 0.75
  const fatOk     = lf <= planned.macros.f * 1.3
  const calOk     = lkc <= planned.cal * 1.25
  if (proteinOk && fatOk && calOk) return 'good'
  const issues = []
  if (!proteinOk) issues.push(`need +${Math.round(planned.macros.p - lp)}g protein`)
  if (!fatOk)     issues.push(`fat over by ${Math.round(lf - planned.macros.f)}g`)
  if (!calOk)     issues.push(`${Math.round(lkc - planned.cal)} kcal over`)
  return { bad: true, issues, lp, lc, lf, lkc }
}

function ActionMessage({ plan, log }) {
  const loggedMeals = log?.meals || []
  const totalP   = loggedMeals.reduce((s, m) => s + (m.macros?.p || 0), 0)
  const totalCal = loggedMeals.reduce((s, m) => s + (m.calories ?? ((m.macros?.p||0)*4 + (m.macros?.c||0)*4 + (m.macros?.f||0)*9)), 0)
  const needP    = GOALS.protein - totalP
  const needCal  = GOALS.calories.target - totalCal

  const nextMeal = plan.meals.find(pm => !loggedMeals.find(m => m.label === pm.label))

  let msg, clr
  if (!loggedMeals.length) {
    msg = `Nothing logged yet — have ${plan.meals[0].name} at ${plan.meals[0].time}`
    clr = 'text-gray-500'
  } else if (nextMeal) {
    const parts = [`Next: ${nextMeal.name} at ${nextMeal.time}`]
    if (needP > 20) parts.push(`${needP}g protein still needed`)
    if (needCal > 200) parts.push(`${needCal} kcal left`)
    msg = parts.join(' · ')
    clr = 'text-indigo-600'
  } else if (needP > 25) {
    msg = `All meals done but ${needP}g protein short — add a whey shake`
    clr = 'text-orange-500'
  } else if (totalCal > GOALS.calories.target + 200) {
    msg = `Over by ${totalCal - GOALS.calories.target} kcal today — skip any extra snacks`
    clr = 'text-red-500'
  } else {
    msg = 'All meals done — protein and calories on track'
    clr = 'text-emerald-600'
  }

  return (
    <div className={`text-xs font-semibold ${clr} px-1 pb-0.5`}>{msg}</div>
  )
}

function TodayMealPlan({ log, dayIdx, onRefresh }) {
  const [editingIndex, setEditingIndex] = useState(null)
  const plan = WEEKLY_PLAN[dayIdx]
  const loggedMeals = log?.meals || []

  // Legacy fallback rows (old format before meal plan migration)
  const legacy = [
    { label: 'Breakfast', icon: '🌅', key: 'breakfast' },
    { label: 'Lunch',     icon: '☀️', key: 'lunch' },
    { label: 'Dinner',    icon: '🌙', key: 'dinner' },
    { label: 'Snacks',    icon: '🍿', key: 'snacks' },
  ].filter(m => log?.[m.key])

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Meals</span>
          <span className="text-xs text-gray-300">
            {loggedMeals.length}/{plan.meals.length} logged
          </span>
        </div>

        <div className="px-3 pt-2 pb-1">
          <ActionMessage plan={plan} log={log} />
        </div>

        <div className="divide-y divide-gray-50">
          {plan.meals.map((pm, i) => {
            const logged = loggedMeals.find(m => m.label === pm.label)
            const loggedIdx = loggedMeals.findIndex(m => m.label === pm.label)
            const status = getMealStatus(pm, logged)
            const isPending = status === 'pending'
            const isGood    = status === 'good'
            const isBad     = typeof status === 'object'

            return (
              <button key={i}
                onClick={() => logged ? setEditingIndex(loggedIdx) : null}
                className={`w-full text-left px-3 py-2.5 transition-colors ${
                  isPending ? 'opacity-50 cursor-default' :
                  isGood    ? 'hover:bg-emerald-50/40' :
                              'hover:bg-red-50/40'
                }`}>
                <div className="flex items-center gap-2">
                  {/* status dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    isPending ? 'bg-gray-200' :
                    isGood    ? 'bg-emerald-400' :
                                'bg-red-400'
                  }`} />

                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                    isPending ? 'text-gray-400 bg-gray-50 border-gray-100' :
                    isGood    ? 'text-emerald-600 bg-emerald-50 border-emerald-100' :
                                'text-red-500 bg-red-50 border-red-100'
                  }`}>
                    {pm.label}
                  </span>

                  <span className={`text-xs ${isPending ? 'text-gray-300' : 'text-gray-400'}`}>{pm.time}</span>

                  {/* status tag */}
                  <span className={`ml-auto text-xs font-semibold shrink-0 ${
                    isPending ? 'text-gray-300' :
                    isGood    ? 'text-emerald-500' :
                                'text-red-400'
                  }`}>
                    {isPending ? 'Not logged' : isGood ? '✓ On track' : `⚠ ${isBad.issues?.[0] || 'Check'}`}
                  </span>
                </div>

                {/* meal text */}
                <div className={`text-xs mt-1 ml-4 ${isPending ? 'text-gray-300' : isGood ? 'text-gray-600' : 'text-gray-600'}`}>
                  {logged?.text || pm.name}
                </div>

                {/* macros */}
                <div className="flex gap-2 text-xs ml-4 mt-0.5">
                  {logged ? (
                    <>
                      <span className={`font-semibold ${(logged.macros?.p||0) >= pm.macros.p * 0.75 ? 'text-indigo-500' : 'text-red-400'}`}>
                        {logged.macros?.p||0}g P
                      </span>
                      <span className="text-amber-400">{logged.macros?.c||0}g C</span>
                      <span className={`font-semibold ${(logged.macros?.f||0) <= pm.macros.f * 1.3 ? 'text-pink-400' : 'text-red-400'}`}>
                        {logged.macros?.f||0}g F
                      </span>
                      <span className="text-gray-300 ml-auto">
                        {logged.calories ?? ((logged.macros?.p||0)*4 + (logged.macros?.c||0)*4 + (logged.macros?.f||0)*9)} kcal
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-200">{pm.macros.p}g P</span>
                      <span className="text-gray-200">{pm.macros.c}g C</span>
                      <span className="text-gray-200">{pm.macros.f}g F</span>
                      <span className="text-gray-200 ml-auto">{pm.cal} kcal</span>
                    </>
                  )}
                </div>

                {logged && <div className="text-xs text-gray-300 ml-4 mt-0.5">tap to edit</div>}
              </button>
            )
          })}

          {/* Legacy entries */}
          {legacy.map(m => (
            <div key={m.key} className="flex items-start gap-2 px-3 py-1.5">
              <span className="text-sm shrink-0 mt-0.5">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-gray-500">{m.label}</span>
                <div className="text-xs text-gray-600 truncate">{log[m.key]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingIndex !== null && loggedMeals[editingIndex] && (
        <MealEditSheet
          meal={loggedMeals[editingIndex]}
          index={editingIndex}
          allMeals={loggedMeals}
          log={log}
          onClose={() => setEditingIndex(null)}
          onSaved={() => { setEditingIndex(null); onRefresh?.() }}
        />
      )}
    </>
  )
}

// ─── Sleep Tracker ───────────────────────────────────────────────────────────
const SLEEP_TARGET  = '01:00'  // target lights-out
const WAKE_TARGET   = '08:30'  // target wake-up
const SLEEP_GOAL_M  = 450      // 7h 30m

function parseTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function fmtDur(mins) {
  if (mins == null) return '—'
  const h = Math.floor(Math.abs(mins) / 60), m = Math.abs(mins) % 60
  return `${h}h ${m > 0 ? m + 'm' : ''}`.trim()
}
function sleepDurMin(sleepT, wakeT) {
  const s = parseTime(sleepT), w = parseTime(wakeT)
  if (s === null || w === null) return null
  return w > s ? w - s : (1440 - s) + w
}

function SleepTracker({ log }) {
  const sleepTime = log?.sleep_time || null
  const wakeTime  = log?.wake_time  || null
  const duration  = sleepDurMin(sleepTime, wakeTime)
  const sleptBy   = sleepTime ? parseTime(sleepTime) <= parseTime(SLEEP_TARGET) : null
  const wokeBy    = wakeTime  ? parseTime(wakeTime)  <= parseTime(WAKE_TARGET)  : null
  const durOk     = duration  != null ? duration >= SLEEP_GOAL_M                : null
  const allGood   = sleptBy && wokeBy && durOk
  const hasData   = sleepTime || wakeTime

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${allGood ? 'bg-emerald-50 border-emerald-100' : hasData ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/60">
        <div className="flex items-center gap-2">
          <span className="text-base">😴</span>
          <span className="text-xs font-semibold text-gray-700">Sleep</span>
          <span className="text-xs text-gray-400">target 1:00 AM → 8:30 AM · 7h 30m</span>
        </div>
        {hasData && (
          <span className={`text-xs font-bold ${allGood ? 'text-emerald-600' : 'text-red-500'}`}>
            {allGood ? '✓ On target' : '⚠ Off'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-0 divide-x divide-white/60 px-0">
        {[
          { label: 'Slept at', val: sleepTime || '—', sub: sleptBy === true ? '✓ on time' : sleptBy === false ? `+${fmtDur(parseTime(sleepTime) - parseTime(SLEEP_TARGET))} late` : `target ${SLEEP_TARGET}`, ok: sleptBy },
          { label: 'Woke at',  val: wakeTime  || '—', sub: wokeBy  === true ? '✓ on time' : wokeBy  === false ? `${fmtDur(parseTime(wakeTime) - parseTime(WAKE_TARGET))} late` : `target ${WAKE_TARGET}`, ok: wokeBy },
          { label: 'Duration', val: duration != null ? fmtDur(duration) : '—', sub: durOk === true ? '✓ 7h 30m+' : durOk === false ? `${fmtDur(duration - SLEEP_GOAL_M)} short` : 'goal 7h 30m', ok: durOk },
        ].map(({ label, val, sub, ok }) => (
          <div key={label} className="px-3 py-2.5 text-center">
            <div className="text-xs text-gray-500 mb-0.5">{label}</div>
            <div className={`text-sm font-bold ${ok === true ? 'text-emerald-600' : ok === false ? 'text-red-500' : 'text-gray-600'}`}>{val}</div>
            <div className={`text-xs mt-0.5 ${ok === true ? 'text-emerald-500' : ok === false ? 'text-red-400' : 'text-gray-500'}`}>{sub}</div>
          </div>
        ))}
      </div>

      {!hasData && (
        <div className="px-3 pb-2.5 text-center text-xs text-gray-500">Log sleep time during /checkin</div>
      )}
    </div>
  )
}

// ─── Today's Exercise Plan ───────────────────────────────────────────────────

function ExerciseRow({ name, level, goal, logged }) {
  const scheme  = goal?.scheme || '3×12'
  const isDone  = !!logged
  const readyUp = !isDone && level?.last_sets?.length >= 3 && level.last_sets.every(s => s >= 12)
  const hasLevel = !!level

  let pct = null
  if (hasLevel && goal?.goal != null && level.unit === goal?.unit && goal.goal > 0) {
    pct = Math.min(100, Math.round((level.current_weight / goal.goal) * 100))
  }

  return (
    <div className={`px-3 py-2.5 ${isDone ? 'bg-emerald-50/50' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            isDone   ? 'bg-emerald-400' :
            readyUp  ? 'bg-amber-400'   :
            hasLevel ? 'bg-indigo-300'  : 'bg-gray-200'
          }`} />
          <div className="min-w-0">
            <div className={`text-sm font-semibold truncate ${isDone ? 'text-emerald-700' : 'text-gray-800'}`}>{name}</div>
            {isDone && logged.sets && (
              <div className="text-xs text-emerald-600 font-medium">
                ✓ {logged.weight} {logged.unit} · [{logged.sets.join(', ')}] reps
              </div>
            )}
            {readyUp && (
              <div className="text-xs text-amber-600 font-semibold">⬆ Hit 3×12 last session — increase weight today</div>
            )}
            {!isDone && !hasLevel && (
              <div className="text-xs text-gray-600">First time — start light, find your working weight</div>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <div className="text-xs font-semibold text-gray-600">{scheme}</div>
          {hasLevel && !isDone && (
            <div className={`text-sm font-bold ${readyUp ? 'text-amber-600' : 'text-indigo-600'}`}>
              {level.current_weight} {level.unit}
            </div>
          )}
          {goal?.goal != null && (
            <div className="text-xs text-gray-500">→ {goal.goal} {goal.unit}</div>
          )}
        </div>
      </div>
      {pct != null && !isDone && (
        <div className="ml-5 mt-1.5">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct >= 90 ? '#10b981' : pct >= 60 ? '#6366f1' : '#a5b4fc' }} />
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{pct}% to goal</div>
        </div>
      )}
    </div>
  )
}

function TodayExercisePlan({ log, dayIdx, levels }) {
  const group   = DAY_WORKOUT[dayIdx]
  const cardio  = CARDIO_PLAN[dayIdx]
  const color   = GROUP_COLOR[group] || '#6366f1'

  const goalMap  = Object.fromEntries(EXERCISE_GOALS.map(g => [g.name, g]))
  const levelMap = Object.fromEntries(levels.map(l => [l.exercise_name, l]))
  const loggedMap = Object.fromEntries((log?.exercises || []).map(e => [e.name, e]))

  const gymExercises = WORKOUT_GROUPS[group] || []
  const doneCount    = gymExercises.filter(n => loggedMap[n]).length
  const hasGym       = gymExercises.length > 0

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `2px solid ${color}22` }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{GROUP_EMOJI[group]}</span>
          <div>
            <div className="text-sm font-bold text-gray-800">{GROUP_LABEL[group]}</div>
            {cardio && <div className="text-xs text-gray-400">{cardio.desc}</div>}
          </div>
        </div>
        {hasGym && (
          <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            doneCount === gymExercises.length ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
          }`}>
            {doneCount}/{gymExercises.length}
          </div>
        )}
      </div>

      {/* Rest day — Mon (gym closed) */}
      {group === 'rest' && (
        <div className="px-3 py-4 text-center">
          <div className="text-sm text-gray-600 font-medium">Gym is closed today — full recovery</div>
          <div className="text-xs text-gray-500 mt-1">Good day to stretch, foam roll, or go for a walk</div>
        </div>
      )}

      {/* Buffer day — Fri (flexible) */}
      {group === 'buffer' && (
        <div className="px-3 py-4 text-center">
          <div className="text-sm text-gray-600 font-medium">Flexible day — gym is open</div>
          <div className="text-xs text-gray-500 mt-1">Use it as a makeup session if you missed one, or take a full rest</div>
        </div>
      )}

      {/* Gym day */}
      {hasGym && group !== 'buffer' && group !== 'rest' && (
        <div className="divide-y divide-gray-50">
          {gymExercises.map(name => (
            <ExerciseRow key={name}
              name={name}
              level={levelMap[name]}
              goal={goalMap[name]}
              logged={loggedMap[name]}
            />
          ))}
        </div>
      )}

      {/* Session complete banner */}
      {hasGym && doneCount === gymExercises.length && gymExercises.length > 0 && (
        <div className="px-3 py-2 bg-emerald-50 border-t border-emerald-100 text-center">
          <span className="text-xs font-bold text-emerald-600">Session complete — great work! 🎉</span>
        </div>
      )}
    </div>
  )
}

function SpendingView({ log }) {
  if (!log?.spending?.length) return null
  const total = log.spending.reduce((s, e) => s + e.amount, 0)
  const over  = total > GOALS.dailyBudget

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Spending</span>
        <span className={`text-xs font-bold ${over ? 'text-red-500' : 'text-gray-600'}`}>
          ₹{total.toLocaleString()} / ₹{GOALS.dailyBudget.toLocaleString()}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {log.spending.map((s, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-gray-600 truncate">{s.item}</span>
              <span className="text-gray-400 bg-gray-50 text-xs px-1.5 py-0.5 rounded shrink-0">{s.category}</span>
            </div>
            <span className="text-xs font-semibold text-gray-700 ml-2">₹{s.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

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

function buildInitialMeals(log) {
  if (log?.meals?.length > 0) return log.meals
  // Migrate legacy breakfast/lunch/dinner/snacks to meals array
  return [
    log?.breakfast && { label: 'Meal 1', text: log.breakfast, time: '', macros: log.meal_macros?.breakfast || {p:0,c:0,f:0} },
    log?.lunch     && { label: 'Meal 2', text: log.lunch,     time: '', macros: log.meal_macros?.lunch     || {p:0,c:0,f:0} },
    log?.dinner    && { label: 'Meal 3', text: log.dinner,    time: '', macros: log.meal_macros?.dinner    || {p:0,c:0,f:0} },
    log?.snacks    && { label: 'Meal 4', text: log.snacks,    time: '', macros: log.meal_macros?.snacks    || {p:0,c:0,f:0} },
  ].filter(Boolean)
}

function EditLogModal({ log, onClose, onSaved }) {
  const [meals,      setMeals]      = useState(() => buildInitialMeals(log))
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

  function updateMeal(i, patch) {
    setMeals(prev => prev.map((m, j) => j === i ? { ...m, ...patch } : m))
  }
  function addMeal() {
    setMeals(prev => [...prev, { label: `Meal ${prev.length + 1}`, text: '', time: '', macros: {p:0,c:0,f:0} }])
  }
  function removeMeal(i) {
    setMeals(prev => prev.filter((_, j) => j !== i).map((m, j) => ({ ...m, label: `Meal ${j+1}` })))
  }

  async function save() {
    setSaving(true)
    const cleanMeals = meals
      .filter(m => m.text?.trim())
      .map((m, i) => ({ label: `Meal ${i+1}`, text: m.text.trim(), time: m.time || '', macros: m.macros || {p:0,c:0,f:0} }))
    await supabase.from('daily_logs').update({
      meals:       cleanMeals,
      calories:    Number(calories)   || 0,
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

  const CATS = ['Food','Transport','Shopping','Entertainment','Health','Rent','Subscriptions','Bills','Education']

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="bg-white rounded-t-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
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

        <div className="overflow-y-auto px-5 py-4 space-y-6 pb-10">
          {/* Meals */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-gray-700 font-semibold text-sm">Meals</h4>
              <button onClick={addMeal}
                className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-medium transition-colors">
                + Add meal
              </button>
            </div>
            {meals.length === 0 && (
              <p className="text-gray-300 text-xs text-center py-2">No meals yet — tap + Add meal</p>
            )}
            <div className="space-y-2">
              {meals.map((m, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {m.label || `Meal ${i+1}`}
                    </span>
                    <button onClick={() => removeMeal(i)}
                      className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none px-1">×</button>
                  </div>
                  <div className="flex gap-2">
                    <input type="time" value={m.time || ''}
                      onChange={e => updateMeal(i, { time: e.target.value })}
                      className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400 shrink-0" />
                    <input type="text" value={m.text || ''}
                      onChange={e => updateMeal(i, { text: e.target.value })}
                      placeholder="What did you eat?"
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="text-gray-700 font-semibold text-sm mb-3">Macros & Calories</h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Calories (kcal)" type="number" value={calories}  onChange={setCalories} />
              <Field label="Protein (g)"     type="number" value={macros.p}  onChange={v => setMacro('p', v)} />
              <Field label="Carbs (g)"       type="number" value={macros.c}  onChange={v => setMacro('c', v)} />
              <Field label="Fat (g)"         type="number" value={macros.f}  onChange={v => setMacro('f', v)} />
            </div>
          </section>

          <section>
            <h4 className="text-gray-700 font-semibold text-sm mb-3">Spending</h4>
            {spending.length === 0 && <div className="text-gray-400 text-xs mb-3">No spending logged.</div>}
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
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="text-gray-500 text-xs font-medium">Add item</div>
              <input value={newItem.item} onChange={e => setNewItem(n => ({ ...n, item: e.target.value }))}
                placeholder="Description"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
              <div className="flex gap-2">
                <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400">
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={newItem.amount} onChange={e => setNewItem(n => ({ ...n, amount: e.target.value }))}
                  placeholder="₹"
                  className="w-20 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
                <button onClick={addSpend}
                  className="bg-indigo-600 text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors">+</button>
              </div>
            </div>
          </section>

          <section>
            <h4 className="text-gray-700 font-semibold text-sm mb-3">Activity</h4>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Steps"        type="number" value={steps}      onChange={setSteps} />
              <Field label="Weight (kg)"  type="number" value={weight}     onChange={setWeight} />
              <Field label="Screen (min)" type="number" value={screenTime} onChange={setScreenTime} />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ─── Day View ────────────────────────────────────────────────────────────────

function DayView({ log, onRefresh, dayIdx, levels }) {
  const [editing, setEditing] = useState(false)
  const macros = log?.macros || { p: 0, c: 0, f: 0 }
  const cal    = log?.calories || 0
  const steps  = log?.steps   || 0
  const spent  = (log?.spending || []).reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-2">
      <ScoreStrip log={log} onEdit={() => setEditing(true)} />

      <div className="grid grid-cols-3 gap-2">
        <RemainCard label="Calories" remaining={GOALS.calories.target - cal} consumed={cal}   total={GOALS.calories.target}
          unit="kcal" icon="🔥" color="#6366f1" bgClass="bg-indigo-50" />
        <RemainCard label="Protein"  remaining={GOALS.protein - macros.p}   consumed={macros.p} total={GOALS.protein}
          unit="g"    icon="💪" color="#8b5cf6" bgClass="bg-purple-50" />
        <RemainCard label="Budget"   remaining={GOALS.dailyBudget - spent}  consumed={spent}  total={GOALS.dailyBudget}
          unit="₹"   icon="💰" color="#f59e0b" bgClass="bg-amber-50" />
      </div>

      <StepsBar steps={steps} />
      <SleepTracker log={log} />
      <GoalList log={log} />
      <TodayExercisePlan log={log} dayIdx={dayIdx} levels={levels} />
      <TodayMealPlan log={log} dayIdx={dayIdx} onRefresh={onRefresh} />
      <SpendingView log={log} />

      {log?.badges_unlocked?.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
          <div className="text-yellow-700 font-semibold text-xs mb-1.5">🎉 Badges Unlocked!</div>
          <div className="flex gap-1.5 flex-wrap">
            {log.badges_unlocked.map(b => (
              <span key={b} className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">{b}</span>
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

export default function Today({ log, yesterdayLog, onRefresh, levels = [] }) {
  const [tab, setTab] = useState('today')

  const fmt = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const todayLabel     = fmt(new Date())
  const _y = new Date(); _y.setDate(_y.getDate() - 1)
  const yesterdayLabel = fmt(_y)

  return (
    <div className="space-y-2 fade-up">
      <div className="flex gap-1 bg-gray-100/80 rounded-xl p-0.5">
        {[['today', `📊 Today · ${todayLabel}`], ['yesterday', `📅 Yesterday · ${yesterdayLabel}`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
              tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'today'     && <DayView log={log}          onRefresh={onRefresh} dayIdx={new Date().getDay()} levels={levels} />}
      {tab === 'yesterday' && <DayView log={yesterdayLog} onRefresh={onRefresh} dayIdx={(new Date().getDay() + 6) % 7} levels={levels} />}
    </div>
  )
}
